const loginService = require("../services/login.service");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;
const sessionState = require("../utils/sessionState");

// Handle employee login
async function logInEmployee(req, res, next) {
  try {
    const employeeData = req.body;
    const employee = await loginService.logInEmployee(employeeData);

    if (employee.status === "fail") {
      return res.status(403).json({ status: employee.status, message: employee.message });
    }

    // If role is Admin (3) AND active user role is 'employee', block admin login
    const incomingRole = Number(employee.data.company_role_id);
    const activeRole = sessionState.getActiveUserRole();
    if (incomingRole === 3 && activeRole === "employee") {
      return res.status(403).json({
        status: "fail",
        message: "Admin access restricted while Employee is active"
      });
    }

    // Create JWT payload with employee role
    const payload = {
      employee_id: employee.data.employee_id,
      employee_email: employee.data.employee_email,
      employee_first_name: employee.data.employee_first_name,
      employee_role: incomingRole,
      type: "employee"
    };

    // Generate token
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "30d" });

    // Update active session role
    if (incomingRole === 1) {
      sessionState.setActiveUserRole("employee");
    } else if (incomingRole === 3) {
      // Setting to 'admin' does NOT block employee logins (we only block admin when employee active).
      sessionState.setActiveUserRole("admin");
    }

    // Send response with token and employee's first name and role
    res.status(200).json({
      status: "success",
      message: "Employee logged in successfully",
      data: {
        employee_token: token,
        employee_first_name: employee.data.employee_first_name,
        employee_role: incomingRole,
        employee_id: employee.data.employee_id,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "An error occurred during login" });
  }
}

// Handle customer login
async function logInCustomer(req, res, next) {
  try {
    const customerData = req.body;
    const customer = await loginService.logInCustomer(customerData);

    if (customer.status === "fail") {
      return res.status(403).json({ status: customer.status, message: customer.message });
    }

    // Create JWT payload with customer type
    const payload = {
      customer_id: Number(customer.data.customer_id),
      customer_email: customer.data.customer_email,
      customer_first_name: customer.data.customer_first_name,
      customer_phone: customer.data.customer_phone,
      type: "customer"
    };

    // Generate token
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "30d" });

    // Send response with token and customer's first name
    res.status(200).json({
      status: "success",
      message: "Customer logged in successfully",
      data: {
        customer_token: token,
        customer_first_name: customer.data.customer_first_name,
        customer_id: Number(customer.data.customer_id),
        customer_email: customer.data.customer_email,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "An error occurred during login" });
  }
}

async function logout(req, res) {
  try {
    // Clear the active role to allow admin to log in after employee logs out (and vice versa if needed)
    const role = (req.body && req.body.role) ? String(req.body.role) : null;
    // For simplicity, always clear the role
    const sessionState = require("../utils/sessionState");
    sessionState.clearActiveUserRole();

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred during logout",
    });
  }
}

module.exports = {
  logInEmployee,
  logInCustomer,
  logout,
};

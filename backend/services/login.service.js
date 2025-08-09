

const conn = require("../config/db.config");
const bcrypt = require("bcrypt");
const employeeService = require("./employee.service");
const customerService = require("./customer.service");

// Employee login logic
async function logInEmployee(employeeData) {
  try {

    let returnData = {};
    const employee = await employeeService.getEmployeeByEmail(
      employeeData.email
    );

    if (employee.length === 0) {
      returnData = { status: "fail", message: "Employee does not exist" };
      return returnData;
    } // **IMPORTANT: Trim both strings before comparison**

    const incomingPassword = employeeData.password.trim(); // Trim incoming plaintext password
    const storedHash = employee[0].employee_password_hashed.trim(); // Trim stored hashed password

 

    const passwordMatch = await bcrypt.compare(
      incomingPassword, // Use the trimmed plaintext password
      storedHash // Use the trimmed hashed password
    );

    if (!passwordMatch) {
      returnData = { status: "fail", message: "Incorrect password" };
      return returnData;
    } // Return employee data along with company_role_id (role)

    returnData = {
      status: "success",
      data: {
        employee_id: employee[0].employee_id,
        employee_email: employee[0].employee_email,
        employee_first_name: employee[0].employee_first_name,
        company_role_id: employee[0].company_role_id,
      },
    };

    return returnData;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Customer login logic (supports email + phone OR email + password)
async function logInCustomer(customerData) {
  try {
    let returnData = {};
    let customer = null;
    if (customerData.email) {
      customer = await customerService.getCustomerByEmail(
        String(customerData.email || '').trim()
      );
    }
    if ((!customer || customer.length === 0) && customerData.phone) {
      customer = await customerService.getCustomerByPhone(
        String(customerData.phone || '').trim()
      );
    }
    if (!customer || customer.length === 0) {
      returnData = { status: "fail", message: "Customer does not exist" };
      return returnData;
    }

    // If phone is provided, authenticate by matching the stored phone
    if (customerData.phone) {
      const providedPhone = String(customerData.phone).trim();
      const storedPhone = String(customer[0].customer_phone || "").trim();
      if (providedPhone !== storedPhone) {
        return { status: "fail", message: "Incorrect phone number" };
      }
      returnData = { status: "success", data: customer[0] };
      return returnData;
    }

    // Otherwise fall back to password-based login for compatibility
    if (!customerData.password) {
      // If no password is provided, check if the customer has a phone number
      if (!customer[0].customer_phone) {
        return { status: "fail", message: "Password or phone is required" };
      }
      // If customer has a phone number, they can log in without password
      returnData = { status: "success", data: customer[0] };
      return returnData;
    }
    const incomingCustomerPassword = customerData.password.trim();
    const storedCustomerHash = String(customer[0].customer_password_hashed || "").trim();
    const passwordMatch = await bcrypt.compare(incomingCustomerPassword, storedCustomerHash);
    if (!passwordMatch) {
      return { status: "fail", message: "Incorrect password" };
    }
    returnData = { status: "success", data: customer[0] };
    return returnData;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

module.exports = {
  logInEmployee,
  logInCustomer,
};
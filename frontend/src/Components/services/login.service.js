const api_url = import.meta.env.VITE_API_URL;

// A function to send the login request for an employee
const logInEmployee = async (formData) => {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  };
  console.log("Sending employee login request");
  console.log(requestOptions.body);
  const response = await fetch(`${api_url}/api/employee/login`, requestOptions);
  return response;
};

// A function to send the login request for a customer (email+password OR email+phone)
const logInCustomer = async (formData) => {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  };
  console.log("Sending customer login request");
  console.log(requestOptions.body);
  const response = await fetch(`${api_url}/api/customer/login`, requestOptions);
  return response;
};

/**
 * Log out the employee or customer.
 * If serverClear is true, also notify the backend to clear active session role state.
 */
const logOut = async (userType, serverClear = false) => {
  try {
    if (serverClear) {
      await fetch(`${api_url}/api/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: userType }),
      }).catch(() => {}); // ignore server errors on client logout
    }
  } finally {
    if (userType === "employee") {
      localStorage.removeItem("employee_token");
      localStorage.removeItem("employee"); // also clear stored employee object
    } else if (userType === "customer") {
      localStorage.removeItem("customer_token");
      localStorage.removeItem("customer");
    }
  }
};

// Export the functions
export const loginService = {
  logInEmployee,
  logInCustomer,
  logOut,
};

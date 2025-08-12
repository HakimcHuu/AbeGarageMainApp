// // Import from the env
// const api_url = import.meta.env.VITE_API_URL;
// // A function to send post request to create a new employee
// const createEmployee = async (formData, loggedInEmployeeToken) => {
//   const requestOptions = {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "x-access-token": loggedInEmployeeToken,
//     },
//     body: JSON.stringify(formData),
//   };
//   console.log(requestOptions);
//   const response = await fetch(`${api_url}/api/employee`, requestOptions);
//   return response;
// };

// // A function to send get request to get all employees
// const getAllEmployees = async (token) => {
//   // console.log(token);
//   const requestOptions = {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//       "x-access-token": token,
//     },
//   };
//   const response = await fetch(`${api_url}/api/employees`, requestOptions);
//   return response;
// };

// // A function to get an employee by ID
// const getEmployeeById = async (employeeId, token) => {
//   const requestOptions = {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//       "x-access-token": token, // Make sure the token is passed for authentication
//     },
//   };
  
//   try {
//     const response = await fetch(`${api_url}/api/employees/${employeeId}`, requestOptions);

//     if (!response.ok) {
//       throw new Error("Failed to fetch employee details.");
//     }

//     return response;
//   } catch (error) {
//     console.error("Error fetching employee by ID:", error);
//     throw error;
//   }
// };

// // A function to send DELETE request to remove an employee
// const deleteEmployee = async (employeeId, token) => {
//   const requestOptions = {
//     method: "DELETE",
//     headers: {
//       "Content-Type": "application/json",
//       "x-access-token": token,
//     },
//   };
//   const response = await fetch(
//     `${api_url}/api/employees/${employeeId}`,
//     requestOptions
//   );
//   return response;
// };

// // A function to send put request to update an employee
// const updateEmployee = async (employeeId, formData, loggedInEmployeeToken) => {
//   const requestOptions = {
//     method: "PUT",
//     headers: {
//       "Content-Type": "application/json",
//       "x-access-token": loggedInEmployeeToken,
//     },
//     body: JSON.stringify(formData),
//   };
//   const response = await fetch(
//     `${api_url}/api/employees/${employeeId}`,
//     requestOptions
//   );
//   return response;
// };

// // A function to send get request to get an employee by ID
// const getEmployee = async (employeeId, token) => {
//   const requestOptions = {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//       "x-access-token": token,
//     },
//   };
//   const response = await fetch(
//     `${api_url}/api/employees/${employeeId}`,
//     requestOptions
//   );
//   return response;
// };


// // Fetch tasks assigned to the employee
// const getEmployeeTasks = async (employee_id,token) => {
//   try {
//     const response = await fetch(`${api_url}/api/employees/${employee_id}`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`Error fetching tasks: ${response.statusText}`);
//     }

//     const data = await response.json(); // Ensure you're converting to JSON
//     return data.tasks || []; // Return the tasks array or an empty array
//   } catch (error) {
//     console.error("Error fetching employee tasks:", error);
//     throw error;
//   }
// };


// // Function to update task status with detailed logging
// const updateTaskStatus = async (task_id, status, token) => {
//   try {
//     console.log(`[UpdateTaskStatus] New status to send: ${status}`);
    

//     const response = await fetch(`${api_url}/api/employees/tasks/${task_id}/status`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ status: Number(status) }),  // Ensure it's a number
//     });
   
//     if (!response.ok) {
//       const errorMsg = `Failed to update task status. Status: ${response.status}, StatusText: ${response.statusText}`;
//       console.error(`[UpdateTaskStatus] ${errorMsg}`);
//       throw new Error(errorMsg);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error(`[UpdateTaskStatus] Error occurred while updating task status:`, error);
//     throw error;
//   }
// };



// // Export all the functions
// const employeeService = {
//   createEmployee,
//   getAllEmployees,
//   getEmployeeById,
//   deleteEmployee,
//   updateEmployee,
//   getEmployee,
//   // getEmployeesByRole,
//   getEmployeeTasks,
//   updateTaskStatus
// };
// export default employeeService;



// Import from the env (fallback to localhost:8000 if not set)
const api_url = import.meta.env.VITE_API_URL || "http://localhost:8000";

// A function to send post request to create a new employee
const createEmployee = async (formData, loggedInEmployeeToken) => {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": loggedInEmployeeToken,
    },
    body: JSON.stringify(formData),
  };
  console.log(requestOptions);
  const response = await fetch(`${api_url}/api/employee`, requestOptions);
  return response;
};

// A function to send get request to get all employees
const getAllEmployees = async (token) => {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  };
  const response = await fetch(`${api_url}/api/employees`, requestOptions);
  return response;
};

// A function to get an employee by ID
const getEmployeeById = async (employeeId, token) => {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token, // Make sure the token is passed for authentication
    },
  };

  try {
    const response = await fetch(`${api_url}/api/employees/${employeeId}`, requestOptions);

    if (!response.ok) {
      throw new Error("Failed to fetch employee details.");
    }

    return response;
  } catch (error) {
    console.error("Error fetching employee by ID:", error);
    throw error;
  }
};

// A function to send DELETE request to remove an employee
const deleteEmployee = async (employeeId, token) => {
  const requestOptions = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  };
  const response = await fetch(
    `${api_url}/api/employees/${employeeId}`,
    requestOptions
  );
  return response;
};

// A function to send put request to update an employee
const updateEmployee = async (employeeId, formData, loggedInEmployeeToken) => {
  const requestOptions = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": loggedInEmployeeToken,
    },
    body: JSON.stringify(formData),
  };
  const response = await fetch(
    `${api_url}/api/employees/${employeeId}`,
    requestOptions
  );
  return response;
};

// A function to send get request to get an employee by ID (duplicate, consider removing or consolidating with getEmployeeById)
const getEmployee = async (employeeId, token) => {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  };
  const response = await fetch(
    `${api_url}/api/employees/${employeeId}`,
    requestOptions
  );
  return response;
};


// Fetch tasks assigned to the employee
const getEmployeeTasks = async (employee_id, token) => {
  try {
    const response = await fetch(`${api_url}/api/employees/${employee_id}/tasks`, { // **Updated URL (assuming dedicated tasks endpoint)**
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token, // **Crucial: Added token for authentication**
      },
    });

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // If response is not JSON, use status text
        errorData.message = response.statusText;
      }
      console.error(`Error fetching tasks for employee ${employee_id}:`, response.status, errorData.message);
      throw new Error(`Error fetching tasks: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response; // **Return the raw response object**
  } catch (error) {
    console.error("Error fetching employee tasks:", error);
    throw error;
  }
};

// Function to update task status with detailed logging
const updateTaskStatus = async (taskIdWithPrefix, status, token, taskType = 'service') => {
  try {
    // Extract the numeric ID from the prefixed taskId
    const taskId = taskIdWithPrefix.split('_')[1];

    console.log(`[UpdateTaskStatus] URL: ${api_url}/api/employees/tasks/${taskId}/status`);
    console.log(`[UpdateTaskStatus] Token present:`, Boolean(token));
    console.log(`[UpdateTaskStatus] New status to send: ${status}`);
    console.log(`[UpdateTaskStatus] Task Type: ${taskType}`);

    const response = await fetch(`${api_url}/api/employees/tasks/${taskId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({ status: Number(status), task_type: taskType }), // Include task_type
    });

    if (!response.ok) {
      const errorMsg = `Failed to update task status. Status: ${response.status}, StatusText: ${response.statusText}`;
      console.error(`[UpdateTaskStatus] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    console.error(`[UpdateTaskStatus] Error occurred while updating task status:`, error);
    throw error;
  }
};

// Export all the functions
const employeeService = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  deleteEmployee,
  updateEmployee,
  getEmployee, // Consider if this is redundant with getEmployeeById
  getEmployeeTasks,
  updateTaskStatus
};

export default employeeService;

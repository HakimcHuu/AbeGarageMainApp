// import React, { useState, useEffect, useContext } from "react";

// // Create a context object
// const AuthContext = React.createContext();

// // Create a custom hook to use the context
// export const useAuth = () => {
//   return useContext(AuthContext);
// };

// // Create a provider component
// export const AuthProvider = ({ children }) => {
//   const [isLogged, setIsLogged] = useState(false);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [isEmployee, setIsEmployee] = useState(false);
//   const [employee, setEmployee] = useState(null);
//   const [customer, setCustomer] = useState(null);

//   // Function to check localStorage and update the auth state
//   useEffect(() => {
//     const storedEmployee = localStorage.getItem("employee");
//     const storedCustomer = localStorage.getItem("customer");

//     if (storedEmployee) {
//       const parsedEmployee = JSON.parse(storedEmployee);
//       console.log("Parsed Employee:", parsedEmployee); 
//       setIsLogged(true);

//       // Check if the employee is an admin
//       if (parsedEmployee.employee_role === 3) {
//         setIsAdmin(true);
//         console.log("User is an Admin."); 
//       }

//       // Check if the employee is a regular employee
//       if (parsedEmployee.employee_role === 1) {
//         setIsEmployee(true);
//         console.log("User is a Regular Employee."); 
//       }

//       // Store the employee token (if needed)
//       localStorage.setItem("employee_token", parsedEmployee.employee_token);
//       setEmployee(parsedEmployee);
//     } else if (storedCustomer) {
//       const parsedCustomer = JSON.parse(storedCustomer);
//       console.log("Parsed Customer in AuthContext:", parsedCustomer);
//       setIsLogged(true);
//       localStorage.setItem("customer_token", parsedCustomer.customer_token);
//       setCustomer(parsedCustomer);
//     } else {
//       // Clear the state if no user is logged in
//       console.log("No employee or customer found in localStorage."); 
//       setIsLogged(false);
//       setEmployee(null);
//       setCustomer(null);

//       // Optionally clear tokens
//       localStorage.removeItem("employee_token");
//       localStorage.removeItem("customer_token");
//     }
//   }, []);

//   // Provide the context value for other components
//   const value = {
//     isLogged,
//     isAdmin,
//     isEmployee,
//     setIsAdmin,
//     setIsLogged,
//     employee,
//     customer,
//     setEmployee,
//     setCustomer,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };


import React, { useState, useEffect, useContext } from "react";

// Create a context object
const AuthContext = React.createContext();

// Create a custom hook to use the context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false); // Indicates if any type of employee is logged in
  const [employee, setEmployee] = useState(null); // Stores the full employee object
  const [customer, setCustomer] = useState(null);

  // Function to check localStorage and update the auth state
  useEffect(() => {
    const storedEmployee = localStorage.getItem("employee");
    const storedCustomer = localStorage.getItem("customer");

    // Reset all auth states initially
    setIsLogged(false);
    setIsAdmin(false);
    setIsEmployee(false);
    setEmployee(null);
    setCustomer(null);

    if (storedEmployee) {
      try {
        const parsedEmployee = JSON.parse(storedEmployee);
        console.log(
          "AuthContext: Parsed Employee from localStorage:",
          parsedEmployee
        );

        setIsLogged(true);
        setEmployee(parsedEmployee); // Always set the full employee object

        if (parsedEmployee.employee_role === 3) {
          setIsAdmin(true);
          setIsEmployee(true); // An admin is also an employee
          console.log("AuthContext: User is an Admin (role 3).");
        } else if (parsedEmployee.employee_role === 1) {
          setIsEmployee(true); // A regular employee
          console.log("AuthContext: User is a Regular Employee (role 1).");
        } else {
          console.warn(
            "AuthContext: Unknown employee role:",
            parsedEmployee.employee_role
          );
          // Handle cases of invalid roles if necessary (e.g., log out)
        }

        // Store the employee token (if needed)
        localStorage.setItem("employee_token", parsedEmployee.employee_token);
      } catch (error) {
        console.error(
          "AuthContext: Error parsing employee data from localStorage:",
          error
        );
        // Clear corrupt data
        localStorage.removeItem("employee");
        localStorage.removeItem("employee_token");
      }
    } else if (storedCustomer) {
      try {
        const parsedCustomer = JSON.parse(storedCustomer);
        console.log(
          "AuthContext: Parsed Customer from localStorage:",
          parsedCustomer
        );
        setIsLogged(true);
        setCustomer(parsedCustomer);
        localStorage.setItem("customer_token", parsedCustomer.customer_token);
      } catch (error) {
        console.error(
          "AuthContext: Error parsing customer data from localStorage:",
          error
        );
        // Clear corrupt data
        localStorage.removeItem("customer");
        localStorage.removeItem("customer_token");
      }
    } else {
      console.log(
        "AuthContext: No employee or customer found in localStorage."
      );
      // Optional: Ensure tokens are cleared if no user is found
      localStorage.removeItem("employee_token");
      localStorage.removeItem("customer_token");
    }
  }, []); // Empty dependency array means this runs once on mount

  // Provide the context value for other components
  const value = {
    isLogged,
    isAdmin,
    isEmployee, // Exported to indicate any type of employee
    employee, // The full employee object
    customer,
    // Functions to update state from outside if needed (e.g., during login/logout)
    setIsLogged,
    setIsAdmin,
    setIsEmployee,
    setEmployee,
    setCustomer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
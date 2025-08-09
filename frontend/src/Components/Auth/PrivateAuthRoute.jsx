import React, { useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import getAuth from "../util/auth"; // Function to get authenticated user from localStorage

const PrivateAuthRoute = ({ roles, customerOnly = false, children }) => {
  const [isChecked, setIsChecked] = useState(false); // Indicates if auth check is done
  const [isLogged, setIsLogged] = useState(false); // Tracks if user is logged in
  const [isAuthorized, setIsAuthorized] = useState(false); // Tracks if user has access to the route
  const params = useParams();

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const loggedInUser = await getAuth(); // Await the getAuth function to ensure it's resolved
        console.log("Logged in user:", loggedInUser);
        console.log("Required roles for this route:", roles);
        console.log("Customer-only route:", customerOnly);

        // If this route is restricted to customers only
        if (customerOnly) {
          if (loggedInUser && loggedInUser.customer_token) {
            setIsLogged(true);
            const routeCustomerId = params?.customer_id;
            const tokenCustomerId = loggedInUser.customer_id;
            const idMatches = !routeCustomerId || Number(routeCustomerId) === Number(tokenCustomerId);
            if (idMatches) {
              setIsAuthorized(true);
            } else {
              console.warn("Customer ID mismatch between route and token");
            }
          } else if (loggedInUser && loggedInUser.employee_token) {
            // Employees are not allowed on customer-only routes
            setIsLogged(true);
            setIsAuthorized(false);
          } else {
            console.log("No valid user or token found for customer-only route");
          }
          return;
        }
        
        if (loggedInUser && loggedInUser.employee_token) {
          // User is logged in
          setIsLogged(true);
          console.log("User has employee token");

          // Normalize role to a number for reliable comparisons
          const role = Number(loggedInUser.employee_role);
          const isAdmin = role === 3;
          const requiredRoles = Array.isArray(roles) ? roles.map((r) => Number(r)) : [];

          console.log("User role (normalized):", role);
          console.log("Required roles for this route (normalized):", requiredRoles);
          console.log("Role check results:", {
            noRoles: !roles || requiredRoles.length === 0,
            roleIncluded: requiredRoles.includes(role),
            isAdminBypass: isAdmin
          });

          // Check if the user's role matches the required roles for the route,
          // or allow Admin (role 3) to bypass.
          if (!roles || requiredRoles.length === 0 || requiredRoles.includes(role) || isAdmin) {
            console.log("User is authorized for this route");
            setIsAuthorized(true);
          } else {
            console.log("User is NOT authorized for this route");
          }
        } else if (loggedInUser && loggedInUser.customer_token) {
          // Customer is logged in, but customers do not have employee roles
          setIsLogged(true);
          console.log("User has customer token");

          // If no roles are required for this route, allow access to logged-in customers
          const requiredRoles = Array.isArray(roles) ? roles.map((r) => Number(r)) : [];
          const noRoleRestriction = !roles || requiredRoles.length === 0;

          if (noRoleRestriction) {
            console.log("Customer is authorized for this route (no role restriction)");
            setIsAuthorized(true);
          } else {
            console.log("Customer is NOT authorized for this route (role-restricted)");
          }
        } else {
          console.log("No valid user or token found");
        }
      } catch (error) {
        console.error("Error during auth check:", error);
      } finally {
        setIsChecked(true); // Mark the check as done
      }
    };

    checkAuthorization();
  }, [roles, customerOnly, params?.customer_id]);

  if (!isChecked) {
    // Optionally, you can show a loading spinner or placeholder until the auth check is done
    return <div>Loading...</div>;
  }

  if (!isLogged) {
    // Redirect to login if not logged in
    return <Navigate to="/login" />;
  }

  if (!isAuthorized) {
    // Redirect to unauthorized page if the user doesn't have access
    return <Navigate to="/unauthorized" />;
  }

  // If everything is fine, render the children (the protected component)
  return children;
};

export default PrivateAuthRoute;

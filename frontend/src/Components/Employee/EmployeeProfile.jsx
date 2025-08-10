

// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import employeeService from "../../Components/services/employee.service";
// import { useAuth } from "../../Contexts/AuthContext";
// import {
//   Spinner,
//   Container,
//   Row,
//   Col,
//   Card,
//   Form,
//   Button,
// } from "react-bootstrap";
// import { FaEllipsisV } from "react-icons/fa";

// const EmployeeProfile = () => {
//   const { employee_id: paramEmployeeId } = useParams();
//   const { isLogged, isAdmin, isEmployee, employee: authEmployee } = useAuth(); // Destructure authEmployee here
//   const [employee, setEmployee] = useState(null);
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const token = localStorage.getItem("employee_token");
//   const [selectedStatus, setSelectedStatus] = useState({});
//   const [isEditingStatus, setIsEditingStatus] = useState({});

//   // Determine the employee_id to use for fetching.
//   // Prioritize URL param if present (for admin viewing others),
//   // otherwise use the logged-in employee's ID.
//   const currentEmployeeId = paramEmployeeId || (authEmployee ? authEmployee.employee_id : null);

//   useEffect(() => {
//     // Debugging logs to see the values
//     console.log("EmployeeProfile useEffect triggered.");
//     console.log("paramEmployeeId from URL:", paramEmployeeId);
//     console.log("authEmployee from AuthContext:", authEmployee);
//     console.log("Calculated currentEmployeeId:", currentEmployeeId);
//     console.log("Is Employee logged in:", isEmployee);
//     console.log("Is Admin logged in:", isAdmin);


//     const fetchEmployeeDetails = async () => {
//       // Don't set loading/error here, let loadAllData handle it
//       try {
//         const response = await employeeService.getEmployeeById(
//           currentEmployeeId,
//           token
//         );
//         const employeeData = await response.json();

//         if (employeeData.status !== "success" || !employeeData.data) {
//           setError("Employee not found or data invalid.");
//           return;
//         }
//         setEmployee(employeeData.data);
//       } catch (err) {
//         console.error("Error occurred fetching employee details:", err);
//         setError("An error occurred fetching employee details. Please try again.");
//       }
//     };

//     const fetchAssignedTasks = async () => {
//       // Don't set loading/error here, let loadAllData handle it
//       try {
//         const tasksResponse = await employeeService.getEmployeeTasks(
//           currentEmployeeId,
//           token
//         );
//         // Ensure to parse the JSON response
//         const tasksData = await tasksResponse.json(); 
//         console.log("EmployeeProfile: Parsed task data for emp profile:", tasksData);

//         if (tasksData.status === "success" && Array.isArray(tasksData.data)) {
//           setTasks(tasksData.data);
//           // Initialize selectedStatus for all tasks
//           const initialSelectedStatus = {};
//           tasksData.data.forEach(task => {
//             initialSelectedStatus[task.order_service_id] = task.order_status;
//           });
//           setSelectedStatus(initialSelectedStatus);
//         } else {
//           console.warn(
//             "EmployeeProfile: Tasks data is not in expected format or status not success:",
//             tasksData
//           );
//           setTasks([]); // Ensure tasks is an empty array if data is not as expected
//           // If the backend indicates no tasks, don't set a hard error, just show empty.
//           // If it's a real error (e.g., 500), the catch block will handle it.
//         }
//       } catch (err) {
//         console.error("EmployeeProfile: An error occurred fetching tasks:", err);
//         setError("Failed to load assigned tasks.");
//         setTasks([]); // Set tasks to empty array on error
//       }
//     };

//     const loadAllData = async () => {
//       setLoading(true); // Start loading for both operations
//       setError(null); // Clear previous errors

//       if (!currentEmployeeId) {
//         setError("No employee ID found to load profile.");
//         setLoading(false);
//         return;
//       }

//       try {
//         await fetchEmployeeDetails();
//         await fetchAssignedTasks();
//       } catch (err) {
//         // Errors from individual fetches are already set by their respective catch blocks
//         // This catch handles any unexpected errors during the await chain
//         console.error("EmployeeProfile: Error during combined data load:", err);
//       } finally {
//         setLoading(false); // Stop loading after both operations are done (or one fails)
//       }
//     };

//     // Only load data if currentEmployeeId is determined
//     if (currentEmployeeId) {
//       loadAllData();
//     } else {
//       setLoading(false);
//       // This else block is mostly for the initial render before authEmployee is populated
//       // or if an admin somehow lands on /employee-profile without an ID.
//       // The `No employee ID found` error above will catch this more explicitly.
//     }
//   }, [currentEmployeeId, token, isEmployee, isAdmin, authEmployee]); // Depend on authEmployee to re-run when its state changes

//   const handleStatusChange = (orderServiceId, newStatus) => {
//     setSelectedStatus((prevStatus) => ({
//       ...prevStatus,
//       [orderServiceId]: newStatus,
//     }));
//     setIsEditingStatus((prev) => ({
//       ...prev,
//       [orderServiceId]: true,
//     }));
//   };

//   const handleSaveStatus = async (orderServiceId) => {
//     // Ensure newStatus is a number for API consistency
//     const updatedStatus = parseInt(selectedStatus[orderServiceId], 10);

//     try {
//       const response = await employeeService.updateTaskStatus(
//         orderServiceId,
//         updatedStatus,
//         token
//       );

//       if (response.ok) {
//         setTasks((prevTasks) =>
//           prevTasks.map((task) =>
//             task.order_service_id === orderServiceId
//               ? { ...task, order_status: updatedStatus }
//               : task
//           )
//         );
//         setIsEditingStatus((prev) => ({
//           ...prev,
//           [orderServiceId]: false,
//         }));
//       } else {
//         const errorBody = await response
//           .json()
//           .catch(() => ({ message: response.statusText }));
//         console.error(
//           `[Frontend] Failed to update status for Order Service ID: ${orderServiceId}`,
//           errorBody
//         );
//         setError(
//           errorBody.message ||
//             `Failed to update status for task ${orderServiceId}.`
//         );
//       }
//     } catch (err) {
//       console.error(
//         `[Frontend] Failed to update status for Order Service ID: ${orderServiceId}`,
//         err
//       );
//       setError(
//         `An error occurred while saving task status for ${orderServiceId}.`
//       );
//     }
//   };

//   const getStatusBadge = (status) => {
//     switch (status) {
//       case 1:
//         return <span className="badge bg-secondary">Received</span>;
//       case 2:
//         return <span className="badge bg-warning text-dark">In progress</span>;
//       case 3:
//         return <span className="badge bg-success">Completed</span>;
//       default:
//         return <span className="badge bg-dark">Unknown</span>;
//     }
//   };

//   if (loading) {
//     return (
//       <Container className="d-flex justify-content-center mt-5">
//         <Spinner animation="border" />
//       </Container>
//     );
//   }

//   if (error) {
//     return (
//       <Container className="mt-5">
//         <h3 className="text-danger">{error}</h3>
//       </Container>
//     );
//   }

//   if (!employee) {
//     return (
//       <Container className="mt-5">
//         <h3 className="text-warning">Employee data not loaded or found.</h3>
//         {/* Potentially offer a retry button or redirect */}
//       </Container>
//     );
//   }

//   const orders = tasks.reduce((acc, task) => {
//     const { order_id } = task;

//     if (!acc[order_id]) {
//       acc[order_id] = {
//         customer: {
//           customer_first_name: task.customer_first_name,
//           customer_last_name: task.customer_last_name,
//           customer_email: task.customer_email,
//           customer_phone: task.customer_phone,
//         },
//         vehicle: {
//           vehicle_make: task.vehicle_make,
//           vehicle_model: task.vehicle_model,
//           vehicle_year: task.vehicle_year,
//           vehicle_mileage: task.vehicle_mileage,
//           vehicle_tag: task.vehicle_tag,
//         },
//         services: [],
//       };
//     }

//     acc[order_id].services.push(task);

//     return acc;
//   }, {});

//   return (
//     <Container className="mt-5">
//       <Row className="mb-4">
//         <Col md={12}>
//           <Card className="shadow">
//             <Card.Body>
//               <h5>Employee</h5>
//               <p>
//                 <strong>
//                   {employee.employee_first_name} {employee.employee_last_name}
//                 </strong>
//               </p>
//               <p>
//                 <strong>Email:</strong> {employee.employee_email}
//               </p>
//               <p>
//                 <strong>Phone:</strong> {employee.employee_phone}
//               </p>
//               <p>
//                 <strong>Active Employee:</strong>{" "}
//                 {employee.active_employee ? "Yes" : "No"}
//               </p>
//               <p>
//                 <strong>Added Date:</strong>{" "}
//                 {new Date(employee.added_date).toLocaleString()}
//               </p>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//       <h2>Your Tasks</h2>
//       {Object.keys(orders).length === 0 ? (
//         <p>No tasks assigned to this employee.</p>
//       ) : (
//         <Row>
//           {Object.keys(orders)
//             .sort((a, b) => b - a)
//             .map((order_id) => (
//               <Col key={order_id} md={12} className="mb-4">
//                 <Card className="shadow-sm w-100">
//                   <Card.Body>
//                     <h5 className="text-uppercase mb-3">
//                       Order ID: #{order_id}
//                     </h5>
//                     <div className="d-flex flex-wrap gap-4"> {/* Use d-flex and gap-4 for better spacing */}
//                       <div>
//                         <h6 className="text-uppercase">Customer</h6>
//                         <p>
//                           <strong>
//                             {orders[order_id].customer.customer_first_name}{" "}
//                             {orders[order_id].customer.customer_last_name}
//                           </strong>
//                         </p>
//                         <p>
//                           <strong>Email:</strong>{" "}
//                           {orders[order_id].customer.customer_email}
//                         </p>
//                         <p>
//                           <strong>Phone:</strong>{" "}
//                           {orders[order_id].customer.customer_phone}
//                         </p>
//                       </div>
//                       <div className="ms-auto"> {/* Use ms-auto for right alignment */}
//                         <h6 className="text-uppercase">Vehicle</h6>
//                         <p>
//                           <strong>
//                             {orders[order_id].vehicle.vehicle_make}{" "}
//                             {orders[order_id].vehicle.vehicle_model}
//                           </strong>
//                         </p>
//                         <p>
//                           <strong>Year:</strong>{" "}
//                           {orders[order_id].vehicle.vehicle_year}
//                         </p>
//                         <p>
//                           <strong>Mileage:</strong>{" "}
//                           {orders[order_id].vehicle.vehicle_mileage}
//                         </p>
//                         <p>
//                           <strong>Tag:</strong>{" "}
//                           {orders[order_id].vehicle.vehicle_tag}
//                         </p>
//                       </div>
//                     </div>
//                     <h5 className="mt-3">Requested Services</h5>
//                     {orders[order_id].services.length === 0 ? (
//                       <p>No services found for this order.</p>
//                     ) : (
//                       orders[order_id].services.map((service) => (
//                         <Card
//                           key={`${order_id}-${service.order_service_id}`}
//                           className="mb-2 shadow-sm"
//                         >
//                           <Card.Body className="d-flex justify-content-between align-items-center">
//                             <div>
//                               <h6 className="mb-0">{service.service_name}</h6>
//                             </div>
//                             <div className="d-flex align-items-center">
//                               <span className="me-1">
//                                 {getStatusBadge(service.order_status)}
//                               </span>
//                               {isLogged &&
//                                 isEmployee &&
//                                 service.order_status !== 3 && (
//                                   <>
//                                     {!isEditingStatus[
//                                       service.order_service_id
//                                     ] ? (
//                                       <div
//                                         className="d-inline-flex align-items-center cursor-pointer" // Add cursor-pointer for better UX
//                                         onClick={() =>
//                                           setIsEditingStatus((prev) => ({
//                                             ...prev,
//                                             [service.order_service_id]: true,
//                                           }))
//                                         }
//                                       >
//                                         <FaEllipsisV />
//                                       </div>
//                                     ) : (
//                                       <>
//                                         <Form.Select
//                                           value={
//                                             selectedStatus[
//                                               service.order_service_id
//                                             ] || service.order_status
//                                           }
//                                           onChange={(e) =>
//                                             handleStatusChange(
//                                               service.order_service_id,
//                                               e.target.value
//                                             )
//                                           }
//                                           className="form-select-sm ms-2"
//                                         >
//                                           <option value={1}>Received</option>
//                                           <option value={2}>In progress</option>
//                                           <option value={3}>Completed</option>
//                                         </Form.Select>
//                                         <Button
//                                           variant="success"
//                                           size="sm"
//                                           className="ms-2"
//                                           onClick={() =>
//                                             handleSaveStatus(
//                                               service.order_service_id
//                                             )
//                                           }
//                                         >
//                                           Save
//                                         </Button>
//                                       </>
//                                     )}
//                                   </>
//                                 )}
//                             </div>
//                           </Card.Body>
//                         </Card>
//                       ))
//                     )}
//                   </Card.Body>
//                 </Card>
//               </Col>
//             ))}
//         </Row>
//       )}
//     </Container>
//   );
// };

// export default EmployeeProfile;



import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import employeeService from "../../Components/services/employee.service";
import { useAuth } from "../../Contexts/AuthContext";
import {
  Spinner,
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
} from "react-bootstrap";
import { FaEllipsisV } from "react-icons/fa";

const EmployeeProfile = () => {
  const { employee_id: paramEmployeeId } = useParams();
  const { isLogged, isAdmin, isEmployee, employee: authEmployee } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("employee_token");
  const [selectedStatus, setSelectedStatus] = useState({});
  const [isEditingStatus, setIsEditingStatus] = useState({});

  // 1. currentEmployeeId is now a state variable
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);

  // 2. This useEffect updates currentEmployeeId whenever paramEmployeeId or authEmployee changes
  useEffect(() => {
    let idToUse = null;

    // Prioritize paramEmployeeId if it's a valid number
    if (paramEmployeeId && !isNaN(parseInt(paramEmployeeId, 10))) {
      idToUse = parseInt(paramEmployeeId, 10);
    }
    // If paramEmployeeId is not valid (e.g., undefined or 'undefined' string),
    // then fall back to authEmployee.employee_id if available.
    else if (authEmployee && authEmployee.employee_id) {
      idToUse = authEmployee.employee_id;
    }
    // console.log("paramEmployeeId raw:", paramEmployeeId); // For extra debug
    // console.log("authEmployee raw:", authEmployee);       // For extra debug
    setCurrentEmployeeId(idToUse);
    console.log("currentEmployeeId updated by effect to:", idToUse); // Debugging
  }, [paramEmployeeId, authEmployee]); // Depend on these values

  useEffect(() => {
    console.log("EmployeeProfile data-fetching useEffect triggered.");
    console.log("paramEmployeeId from URL (in effect):", paramEmployeeId);
    console.log("authEmployee from AuthContext (in effect):", authEmployee);
    console.log("Calculated currentEmployeeId (in effect):", currentEmployeeId);
    console.log("Is Employee logged in:", isEmployee);
    console.log("Is Admin logged in:", isAdmin);

    const fetchEmployeeDetails = async () => {
      try {
        const response = await employeeService.getEmployeeById(
          currentEmployeeId,
          token
        );
        const employeeData = await response.json();

        if (employeeData.status !== "success" || !employeeData.data) {
          setError("Employee not found or data invalid.");
          return;
        }
        setEmployee(employeeData.data);
      } catch (err) {
        console.error("Error occurred fetching employee details:", err);
        setError(
          "An error occurred fetching employee details. Please try again."
        );
      }
    };

    const fetchAssignedTasks = async () => {
      try {
        const tasksResponse = await employeeService.getEmployeeTasks(
          currentEmployeeId,
          token
        );
        const tasksData = await tasksResponse.json();
        console.log(
          "EmployeeProfile: Parsed task data for emp profile:",
          tasksData
        );

        if (tasksData.status === "success" && Array.isArray(tasksData.data)) {
          setTasks(tasksData.data);
          const initialSelectedStatus = {};
          tasksData.data.forEach((task) => {
            initialSelectedStatus[task.order_service_id] = task.order_status;
          });
          setSelectedStatus(initialSelectedStatus);
        } else {
          console.warn(
            "EmployeeProfile: Tasks data is not in expected format or status not success:",
            tasksData
          );
          setTasks([]);
        }
      } catch (err) {
        console.error(
          "EmployeeProfile: An error occurred fetching tasks:",
          err
        );
        setError("Failed to load assigned tasks.");
        setTasks([]);
      }
    };

    const loadAllData = async () => {
      setLoading(true);
      setError(null);

      // Crucial check: only proceed if currentEmployeeId has a valid number value
      if (
        currentEmployeeId === null ||
        currentEmployeeId === undefined ||
        isNaN(currentEmployeeId)
      ) {
        setError("Employee ID is missing or invalid. Cannot load profile.");
        setLoading(false);
        return;
      }

      try {
        await fetchEmployeeDetails();
        await fetchAssignedTasks();
      } catch (err) {
        console.error("EmployeeProfile: Error during combined data load:", err);
      } finally {
        setLoading(false);
      }
    };

    // This useEffect will now only trigger the data load when currentEmployeeId is valid
    if (
      currentEmployeeId !== null &&
      currentEmployeeId !== undefined &&
      !isNaN(currentEmployeeId)
    ) {
      loadAllData();
    } else {
      setLoading(false); // If no valid ID, stop loading state
    }
  }, [currentEmployeeId, token, isEmployee, isAdmin]);

  const handleStatusChange = (orderServiceId, newStatus) => {
    setSelectedStatus((prevStatus) => ({
      ...prevStatus,
      [orderServiceId]: newStatus,
    }));
    setIsEditingStatus((prev) => ({
      ...prev,
      [orderServiceId]: true,
    }));
  };

  // const handleSaveStatus = async (orderServiceId) => {
  //   const updatedStatus = parseInt(selectedStatus[orderServiceId], 10);

  //   try {
  //     const response = await employeeService.updateTaskStatus(
  //       orderServiceId,
  //       updatedStatus,
  //       token
  //     );

  //     if (response.ok) {
  //       setTasks((prevTasks) =>
  //         prevTasks.map((task) =>
  //           task.order_service_id === orderServiceId
  //             ? { ...task, order_status: updatedStatus }
  //             : task
  //         )
  //       );
  //       setIsEditingStatus((prev) => ({
  //         ...prev,
  //         [orderServiceId]: false,
  //       }));
  //       setError(null);
  //     } else {
  //       const errorBody = await response
  //         .json()
  //         .catch(() => ({ message: response.statusText }));
  //       console.error(
  //         `[Frontend] Failed to update status for Order Service ID: ${orderServiceId}`,
  //         errorBody
  //       );
  //       setError(
  //         errorBody.message ||
  //           `Failed to update status for task ${orderServiceId}.`
  //       );
  //     }
  //   } catch (err) {
  //     console.error(
  //       `[Frontend] Failed to update status for Order Service ID: ${orderServiceId}`,
  //       err
  //     );
  //     setError(
  //       `An error occurred while saving task status for ${orderServiceId}.`
  //     );
  //   }
  // };
const handleSaveStatus = async (orderServiceId) => {
  const updatedStatus = parseInt(selectedStatus[orderServiceId], 10);
  const task = tasks.find((t) => t.order_service_id === orderServiceId);
  if (task && Number(task.overall_order_status) === 5) {
    window.alert("Order is Done. You cannot change task status.");
    return;
  }

  try {
    const response = await employeeService.updateTaskStatus(
      orderServiceId,
      updatedStatus,
      token
    );

    // --- CRITICAL CHANGE START ---
    // Log the response to understand its structure
    console.log("Response from updateTaskStatus:", response);

    // Check if response is defined and has a .ok property (indicating a Fetch API Response)
    if (response && response.ok) {
      // Attempt to parse JSON only if it's a valid Response object
      const responseData = await response.json().catch(() => ({})); // Added .catch to prevent error if response is not JSON
      console.log("Parsed response data:", responseData);

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.order_service_id === orderServiceId
            ? { ...task, order_status: updatedStatus }
            : task
        )
      );
      setIsEditingStatus((prev) => ({
        ...prev,
        [orderServiceId]: false,
      }));
      setError(null);
    } else {
      // If response is not a valid Fetch API Response or response.ok is false
      let errorMessage = "Failed to update status. Unknown error.";
      if (response && typeof response.json === "function") {
        // Check if .json() exists before calling
        const errorBody = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        errorMessage = errorBody.message || response.statusText || errorMessage;
      } else if (response && response.message) {
        // If response is already an error object
        errorMessage = response.message;
      } else if (response) {
        // Generic fallback for any other non-standard response
        errorMessage = `Failed to update status. Server response: ${JSON.stringify(
          response
        )}`;
      }

      console.error(
        `[Frontend] Failed to update status for Order Service ID: ${orderServiceId}`,
        response || "No response object received"
      );
      setError(errorMessage);
    }
    // --- CRITICAL CHANGE END ---
  } catch (err) {
    console.error(
      `[Frontend] An error occurred while saving task status for Order Service ID: ${orderServiceId}`,
      err
    );
    setError(
      `An error occurred while saving task status for ${orderServiceId}.`
    );
  }
};
  const getStatusBadge = (status) => {
    switch (status) {
      case 1:
        return <span className="badge bg-secondary">Received</span>;
      case 2:
        return <span className="badge bg-warning text-dark">In progress</span>;
      case 3:
        return <span className="badge bg-success">Completed</span>;
      default:
        return <span className="badge bg-dark">Unknown</span>;
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (Number(status)) {
      case 5:
        return <span className="badge bg-success">Done</span>;
      case 4:
        return <span className="badge bg-info text-dark">Ready for Pick Up</span>;
      case 3:
        return <span className="badge bg-secondary">Completed</span>;
      case 2:
        return <span className="badge bg-warning text-dark">In progress</span>;
      default:
        return <span className="badge bg-light text-dark">Pending</span>;
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <h3 className="text-danger">{error}</h3>
      </Container>
    );
  }

  if (!employee) {
    return (
      <Container className="mt-5">
        <h3 className="text-warning">Employee data not loaded or found.</h3>
      </Container>
    );
  }

  const orders = tasks.reduce((acc, task) => {
    const { order_id } = task;

    if (!acc[order_id]) {
      acc[order_id] = {
        overall_order_status: task.overall_order_status,
        customer: {
          customer_first_name: task.customer_first_name,
          customer_last_name: task.customer_last_name,
          customer_email: task.customer_email,
          customer_phone: task.customer_phone,
        },
        vehicle: {
          vehicle_make: task.vehicle_make,
          vehicle_model: task.vehicle_model,
          vehicle_year: task.vehicle_year,
          vehicle_mileage: task.vehicle_mileage,
          vehicle_tag: task.vehicle_tag,
        },
        services: [],
      };
    }

    acc[order_id].services.push(task);

    return acc;
  }, {});

  return (
    <Container className="mt-5">
      <Row className="mb-4">
        <Col md={12}>
          <Card className="shadow">
            <Card.Body>
              <h5>Employee</h5>
              <p>
                <strong>
                  {employee.employee_first_name} {employee.employee_last_name}
                </strong>
              </p>
              <p>
                <strong>Email:</strong> {employee.employee_email}
              </p>
              <p>
                <strong>Phone:</strong> {employee.employee_phone}
              </p>
              <p>
                <strong>Active Employee:</strong>{" "}
                {employee.active_employee ? "Yes" : "No"}
              </p>
              <p>
                <strong>Added Date:</strong>{" "}
                {new Date(employee.added_date).toLocaleString()}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <h2>Your Tasks</h2>
      {Object.keys(orders).length === 0 ? (
        <p>No tasks assigned to this employee.</p>
      ) : (
        <Row>
          {Object.keys(orders)
            .sort((a, b) => b - a)
            .map((order_id) => (
              <Col key={order_id} md={12} className="mb-4">
                <Card className="shadow-sm w-100">
                  <Card.Body>
                    <h5 className="text-uppercase mb-3">
                      Order ID: #{order_id}
                      <span className="ms-2">{getOrderStatusBadge(orders[order_id].overall_order_status)}</span>
                    </h5>
                    <div className="d-flex flex-wrap gap-4">
                      {" "}
                      <div>
                        <h6 className="text-uppercase">Customer</h6>
                        <p>
                          <strong>
                            {orders[order_id].customer.customer_first_name}{" "}
                            {orders[order_id].customer.customer_last_name}
                          </strong>
                        </p>
                        <p>
                          <strong>Email:</strong>{" "}
                          {orders[order_id].customer.customer_email}
                        </p>
                        <p>
                          <strong>Phone:</strong>{" "}
                          {orders[order_id].customer.customer_phone}
                        </p>
                      </div>
                      <div className="ms-auto">
                        {" "}
                        <h6 className="text-uppercase">Vehicle</h6>
                        <p>
                          <strong>
                            {orders[order_id].vehicle.vehicle_make}{" "}
                            {orders[order_id].vehicle.vehicle_model}
                          </strong>
                        </p>
                        <p>
                          <strong>Year:</strong>{" "}
                          {orders[order_id].vehicle.vehicle_year}
                        </p>
                        <p>
                          <strong>Mileage:</strong>{" "}
                          {orders[order_id].vehicle.vehicle_mileage}
                        </p>
                        <p>
                          <strong>Tag:</strong>{" "}
                          {orders[order_id].vehicle.vehicle_tag}
                        </p>
                      </div>
                    </div>
                    <h5 className="mt-3">Requested Services</h5>
                    {orders[order_id].services.length === 0 ? (
                      <p>No services found for this order.</p>
                    ) : (
                      orders[order_id].services.map((service) => (
                        <Card
                          key={`${order_id}-${service.order_service_id}`}
                          className="mb-2 shadow-sm"
                        >
                          <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-0">{service.service_name}</h6>
                            </div>
                            <div className="d-flex align-items-center">
                              <span className="me-1">
                                {getStatusBadge(service.order_status)}
                              </span>
                              {isLogged &&
                                isEmployee &&
                                service.order_status !== 3 &&
                                orders[order_id].overall_order_status !== 5 && (
                                  <>
                                    {!isEditingStatus[
                                      service.order_service_id
                                    ] ? (
                                      <div
                                        className="d-inline-flex align-items-center cursor-pointer"
                                        onClick={() =>
                                          setIsEditingStatus((prev) => ({
                                            ...prev,
                                            [service.order_service_id]: true,
                                          }))
                                        }
                                      >
                                        <FaEllipsisV />
                                      </div>
                                    ) : (
                                      <>
                                        <Form.Select
                                          value={
                                            selectedStatus[
                                              service.order_service_id
                                            ] || service.order_status
                                          }
                                          onChange={(e) =>
                                            handleStatusChange(
                                              service.order_service_id,
                                              e.target.value
                                            )
                                          }
                                          className="form-select-sm ms-2"
                                        >
                                          <option value={1}>Received</option>
                                          <option value={2}>In progress</option>
                                          <option value={3}>Completed</option>
                                        </Form.Select>
                                        <Button
                                          variant="success"
                                          size="sm"
                                          className="ms-2"
                                          onClick={() =>
                                            handleSaveStatus(
                                              service.order_service_id
                                            )
                                          }
                                        >
                                          Save
                                        </Button>
                                      </>
                                    )}
                                  </>
                                )}
                            </div>
                          </Card.Body>
                        </Card>
                      ))
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
        </Row>
      )}
    </Container>
  );
};

export default EmployeeProfile;
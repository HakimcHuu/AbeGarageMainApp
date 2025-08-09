// Import the express module
const express = require("express");
// Call the router method from express to create the router
const router = express.Router();
// Import the employee controller
const employeeController = require("../controllers/employee.controller");
// Import middleware
const authMiddleware = require("../middlewares/auth.middleware");
// Create a route to handle the add employee request on post
router.post(
  "/employee",
  // [authMiddleware.verifyToken, authMiddleware.isAdmin],

  employeeController.createEmployee
);
// router.post("/employee", employeeController.createEmployee);


// Create a route to handle the get all employees request on get
router.get(
  "/employees",
  // [authMiddleware.verifyToken, authMiddleware.isAdmin],

  employeeController.getAllEmployees
);

// Create a route to handle getting an employee by ID
router.get(
  "/employees/:id", 
  // [authMiddleware.verifyToken, authMiddleware.isAdmin],
  employeeController.getEmployeeById
);

// Create a route to handle getting an employee by role
router.get("/employees/role/:roleId", employeeController.getEmployeesByRole);

// Fetch tasks assigned to the employee 
router.get(
  "/employees/:employee_id/tasks",
  [authMiddleware.verifyToken],
  employeeController.getEmployeeTasks
);

// Update task status
router.put(
  "/employees/tasks/:task_id/status",
  [authMiddleware.verifyToken],
  employeeController.updateTaskStatus
);

router.put(
  "/employees/:id",
  // [authMiddleware.verifyToken, authMiddleware.isAdmin],
  employeeController.updateEmployee
);

router.delete(
  "/employees/:id",
  // [authMiddleware.verifyToken, authMiddleware.isAdmin],
  employeeController.deleteEmployee
);

// Export the router
module.exports = router;

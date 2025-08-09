// Import the express module
const express = require("express");
// Call the router method from express to create the router
const router = express.Router();
// Import the customer controller
const customerController = require("../controllers/customer.controller");
// Import middleware
const authMiddleware = require("../middlewares/auth.middleware");

// Create a route to handle the add customer request on post
router.post(
    "/customer",
    [authMiddleware.verifyToken],
    customerController.createCustomer
);

// Create a route to handle the get all customers request on get
router.get(
    "/customers",
    [authMiddleware.verifyToken],
    customerController.getAllCustomers
);

// Create a route to handle updating a customer by ID on put
router.put(
    "/customers/:id",
    [authMiddleware.verifyToken],
    customerController.updateCustomer
);

// Create a route to handle deleting a customer by ID on delete
router.delete(
    "/customers/:id",
    [authMiddleware.verifyToken],
    customerController.deleteCustomer
);

// Create a route to handle getting customer profile by ID (includes basic info)
router.get(
    "/customers/:customerId",
    [authMiddleware.verifyToken],
    customerController.getCustomerProfile
);

// Create a route to handle getting vehicles for a customer by ID
router.get(
    "/customers/:customerId/vehicles",
    [authMiddleware.verifyToken],
    customerController.getCustomerVehicles
);

// Create a route to handle getting orders for a customer by ID
router.get(
    "/customers/:customerId/orders",
    [authMiddleware.verifyToken],
    customerController.getCustomerOrders
);

// Export the router
module.exports = router;

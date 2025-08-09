const express = require('express');
const router = express.Router();
const loginControllers = require("../controllers/login.controller");

// Employee login route
router.post("/employee/login", loginControllers.logInEmployee);

// Customer login route
router.post("/customer/login", loginControllers.logInCustomer);

// Logout route (clears exclusive active role on server)
router.post("/logout", loginControllers.logout);

module.exports = router;

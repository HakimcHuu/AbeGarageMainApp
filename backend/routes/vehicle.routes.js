const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicle.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Create a new vehicle
// router.post('/vehicle', authMiddleware.verifyToken, vehicleController.createVehicle);
router.post("/vehicle", vehicleController.createVehicle);

// Get all vehicles
// router.get('/vehicles', authMiddleware.verifyToken, vehicleController.getAllVehicles);
router.get("/vehicles", vehicleController.getAllVehicles);

// Get a specific vehicle by ID
router.get(
  "/vehicles/:id",
  authMiddleware.verifyToken,
  vehicleController.getVehicleById
);


router.put(
  "/vehicles/:id",

  vehicleController.updateVehicle
);


router.delete(
  "/vehicles/:id",

  vehicleController.deleteVehicle
);

module.exports = router;
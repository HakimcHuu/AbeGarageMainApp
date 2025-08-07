const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Create new order
router.post('/order', orderController.createOrder); 

// Get all orders
router.get('/orders', orderController.getAllOrders);

// Get single order by ID
router.get('/order/:id', orderController.getOrderById);

// Update an existing order
router.put('/order/:id', orderController.updateOrder);

// // Update order status of an existing order 
// router.put('/order/:id/status', orderController.updateOrderStatus);

// Delete an order by ID
router.delete('/order/:id', orderController.deleteOrderById); 

// Route to get the order ID based on the task ID (order_service_id)
router.get("/order/task/:orderServiceId/order-id", orderController.getOrderIdFromTask);

// Route to get all services for a specific order
router.get("/order/:orderId/services", orderController.getAllServicesForOrder);

// Route to update the overall order status
router.put("/order/:orderId/status", orderController.updateOrderStatus);
module.exports = router;

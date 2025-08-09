const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Create new order
router.post('/order', authMiddleware.verifyToken, orderController.createOrder); 

// Get all orders
router.get('/orders', authMiddleware.verifyToken, orderController.getAllOrders);

// Get single order by ID
router.get('/order/:id', authMiddleware.verifyToken, orderController.getOrderById);

// Update an existing order
router.put('/order/:id', authMiddleware.verifyToken, orderController.updateOrder);

// // Update order status of an existing order 
// router.put('/order/:id/status', orderController.updateOrderStatus);

// Delete an order by ID
router.delete('/order/:id', authMiddleware.verifyToken, orderController.deleteOrderById); 

// Route to get the order ID based on the task ID (order_service_id)
router.get("/order/task/:orderServiceId/order-id", authMiddleware.verifyToken, orderController.getOrderIdFromTask);

// Route to get all services for a specific order
router.get("/order/:orderId/services", authMiddleware.verifyToken, orderController.getAllServicesForOrder);

// Route to update the overall order status
router.put("/order/:orderId/status", authMiddleware.verifyToken, orderController.updateOrderStatus);

// Route to get order status history
router.get('/order/:orderId/status-history', authMiddleware.verifyToken, orderController.getOrderStatusHistory);
module.exports = router;

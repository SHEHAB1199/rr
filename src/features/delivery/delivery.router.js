const express = require('express');
const router = express.Router();
const DeliveryController = require('./delivery.controller');
const authenticateDel = require('../../middlewares/authincatedDelivery');

// Get available orders for delivery
router.get('/orders', authenticateDel, DeliveryController.getAvailableOrders);

// Take an order
router.patch('/orders/:id/take', authenticateDel, DeliveryController.takeOrder);

// Complete a delivery task
router.post('/orders/end-task/:orderId', authenticateDel, DeliveryController.endTask);

router.get('/myOrders', authenticateDel, DeliveryController.myOrders);
module.exports = router;
// routes/orderRouter.js
const express = require('express');
const doctorDashboard = require('./doctorController');
const authenticateDoctor = require("../../middlewares/authincateDoctor");
const router = express.Router();

// Create a new order
router.post('/create', doctorDashboard.createOrder);

// Get all orders for a doctor
router.get('/doctor', authenticateDoctor, doctorDashboard.getDoctorsorders);

// Get orders for a doctor based on date range
router.get('/date', authenticateDoctor, doctorDashboard.getOrdersBasedOnDate);

// Get orders for a doctor based on status
router.get('/status',authenticateDoctor, doctorDashboard.ordersBasedonStatus);
router.get('/contract/:id', authenticateDoctor, doctorDashboard.getMyContractsController);
router.get('/order/:orderId', authenticateDoctor, doctorDashboard.getOrderById)
module.exports = router;
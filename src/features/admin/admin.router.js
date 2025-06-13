const express = require('express');
const router = express.Router();
const AdminController = require('./admin.controller');
const authenticateAdmin = require('../../middlewares/authincatedAdmin');

// Admin routes with authentication middleware
router.post('/add-admin', authenticateAdmin, AdminController.addAdmin);
router.get('/labs', authenticateAdmin, AdminController.getAllLabs);
router.post('/register-delivery', authenticateAdmin, AdminController.registerDelivery);
router.post('/login', AdminController.loginAdmin);

module.exports = router;
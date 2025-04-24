const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage(); // or use diskStorage / Cloudinary logic
const upload = multer({ storage });
const authenticateDoctor = require("../../middlewares/authincateDoctor");
const authenticateLab = require("../../middlewares/authincatedLabs");
const {
    createOrder,
    updateOrderController,
    getMyLabs
} = require("./orders.controller");
router.post('/create', upload.fields([
    { name: 'media', maxCount: 10 } // for multiple file uploads
]), authenticateDoctor, createOrder);
router.put("/update/:id", authenticateLab, updateOrderController);
router.get('/getMyLabs', authenticateDoctor, getMyLabs);
module.exports = router;
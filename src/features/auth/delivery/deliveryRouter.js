const express = require("express");
const router = express.Router();

// Import Controllers
const {
    registerController,
    loginController,
    changePasswordController,
    forgetPasswordController,
    verifyOTPController,
    getDeliveryDataController // ✅ Corrected name
} = require("./deliveryController");

// Register Route
router.post("/register", registerController);

// Login Route
router.post("/login", loginController);

// Change Password Route
router.post("/change-password", changePasswordController);

// Forget Password Route
router.post("/forget-password", forgetPasswordController);

// Verify OTP Route
router.post("/verify-otp", verifyOTPController);

// Get Delivery Person Data Route
router.get("/get-delivery-data", getDeliveryDataController); // ✅ Corrected route and function name

module.exports = router;
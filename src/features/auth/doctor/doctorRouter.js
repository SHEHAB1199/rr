const express = require("express");
const router = express.Router();

// Import Controllers
const {
    registerController,
    loginController,
    changePasswordController,
    forgetPasswordController,
    verifyOTPController,
    getDoctordataController
} = require("./doctorController");

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
router.get('/get-doctor-data', getDoctordataController);
module.exports = router;
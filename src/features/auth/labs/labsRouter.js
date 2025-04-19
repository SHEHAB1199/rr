const express = require("express");
const router = express.Router();
const labsController = require("./labsController");

// Lab Routes
router.post("/register", labsController.registerLab); // Register a new lab
router.post("/login", labsController.loginLab); // Login a lab
router.get('/get-lab-data', labsController.getLabdata);
// Password Management Routes
router.post("/change-password", labsController.changePasswordController); // Change password
router.post("/forget-password", labsController.forgetPasswordController); // Forget password
router.post("/verify-otp", labsController.verifyOTPController); // Verify OTP
module.exports = router;
const labsService = require("./labsService");
const asyncHandler = require("express-async-handler");

// Utility function to validate required fields
const validateRequiredFields = (fields, res) => {
    const missingFields = Object.entries(fields)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missingFields.length > 0) {
        res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
        return true;
    }
    return false;
};

// Register Lab
const registerLab = asyncHandler(async (req, res) => {
    const { username, phoneNumber, email, buildNo, floorNo, address, password, coverImage, profileImage, subscribeDelivery, role, contracts } = req.body;

    if (validateRequiredFields({ username, phoneNumber, email, password }, res)) return;

    try {
        const response = await labsService.register(username, phoneNumber, email, buildNo, floorNo, address, password, coverImage, profileImage, subscribeDelivery, role, contracts);
        res.status(201).json(response);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Lab Login
const loginLab = asyncHandler(async (req, res) => {
    const { phoneNumber, email, password } = req.body;

    if (validateRequiredFields({ password }, res)) return;
    if (!phoneNumber && !email) {
        return res.status(400).json({ error: "Phone number or email is required" });
    }

    try {
        const response = await labsService.login(phoneNumber, email, password);
        res.status(200).json(response);
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Change Password
const changePasswordController = asyncHandler(async (req, res) => {
    const { phoneNumber, oldPassword, newPassword } = req.body;

    if (validateRequiredFields({ phoneNumber, oldPassword, newPassword }, res)) return;

    try {
        const result = await labsService.changePassword(phoneNumber, oldPassword, newPassword);
        res.status(200).json({ message: "Password changed successfully", result });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Forget Password
const forgetPasswordController = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;

    if (validateRequiredFields({ phoneNumber }, res)) return;

    try {
        const result = await labsService.forgetPassword(phoneNumber);
        res.status(200).json({ message: "Password reset initiated", result });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Verify OTP
const verifyOTPController = asyncHandler(async (req, res) => {
    const { phoneNumber, otp, newPassword } = req.body;

    if (validateRequiredFields({ phoneNumber, otp, newPassword }, res)) return;

    try {
        const result = await labsService.verifyOTP(phoneNumber, otp, newPassword);
        res.status(200).json({ message: "Password changed successfully", result });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

const getLabdata = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;

    // Validate required fields
    if (validateRequiredFields({ phoneNumber }, res)) return;

    try {
        const lab = await labsService.getLabDataService(phoneNumber); // Use the correct service function
        return res.status(200).json({ lab }); // Wrap the response in an object
    } catch (error) {
        console.log(error);
        return res.status(error.statusCode || 500).json({ message: error.message });
    }
});
module.exports = {
    registerLab,
    loginLab,
    changePasswordController,
    forgetPasswordController,
    verifyOTPController,
    getLabdata
};
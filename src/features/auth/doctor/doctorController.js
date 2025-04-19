const asyncHandler = require("express-async-handler");
const {
    register: registerDoctor,
    login,
    changePassword,
    forgetPassword,
    verifyOTP,
    getDoctordata
} = require("./doctorService.js");

// Utility function for validating required fields
const validateRequiredFields = (fields, res) => {
    for (const [key, value] of Object.entries(fields)) {
        if (!value) {
            return res.status(400).json({ message: `Please provide ${key}` });
        }
    }
    return null;
};

// Register Controller
const registerController = asyncHandler(async (req, res) => {
    const { username, phoneNumber, email, buildNo, floorNo, address, password } = req.body;

    const validationError = validateRequiredFields(
        { username, phoneNumber, email, buildNo, floorNo, address, password },
        res
    );
    if (validationError) return validationError;

    try {
        const doctor = await registerDoctor(username, phoneNumber, email, buildNo, floorNo, address, password);
        return res.status(201).json({ doctor });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ message: error.message || "Something went wrong" });
    }
});

// Login Controller
const loginController = asyncHandler(async (req, res) => {
    const { phoneNumber, email, password } = req.body;

    if ((!phoneNumber && !email) || !password) {
        return res.status(400).json({ message: "Please provide phoneNumber/email and password" });
    }

    try {
        const result = await login(phoneNumber, email, password);
        return res.status(200).json({ message: "Login Successful", result });
    } catch (error) {
        return res.status(error.statusCode || 401).json({ message: error.message });
    }
});

// Change Password Controller
const changePasswordController = asyncHandler(async (req, res) => {
    const { phoneNumber, oldPassword, newPassword } = req.body;

    const validationError = validateRequiredFields(
        { phoneNumber, oldPassword, newPassword },
        res
    );
    if (validationError) return validationError;

    try {
        const result = await changePassword(phoneNumber, oldPassword, newPassword);
        return res.status(200).json({ message: "Password changed successfully", result });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ message: error.message });
    }
});

// Forget Password Controller
const forgetPasswordController = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;

    const validationError = validateRequiredFields({ phoneNumber }, res);
    if (validationError) return validationError;

    try {
        const result = await forgetPassword(phoneNumber);
        return res.status(200).json({ message: "Password reset initiated", result });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ message: error.message });
    }
});

// Verify OTP Controller
const verifyOTPController = asyncHandler(async (req, res) => {
    const { phoneNumber, otp, newPassword } = req.body;

    const validationError = validateRequiredFields({ phoneNumber, otp, newPassword }, res);
    if (validationError) return validationError;

    try {
        const result = await verifyOTP(phoneNumber, otp, newPassword);
        return res.status(200).json({ message: "Password changed successfully", result });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ message: error.message });
    }
});

const getDoctordataController = asyncHandler(async (req, res) => {
    try{
        const doctor = await getDoctordata(req);
        return res.status(200).json({ doctor : doctor });
    }
    catch(error){
        return res.status(error.statusCode || 500).json({ message: error.message });
    }

})

module.exports = {
    registerController,
    loginController,
    changePasswordController,
    forgetPasswordController,
    verifyOTPController,
    getDoctordataController
};
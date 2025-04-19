const labs = require("../../../models/labs.model");
const bcrypt = require("bcryptjs");
const doctorsModel = require("../../../models/doctors.model");
const { sendWhatsAppOTP } = require("../../../config/whatsappClient");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const JWT_SECRET = process.env.jwt_secret_key;
// Utility function to hash passwords
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// Utility function to throw consistent errors
const throwError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
};

// Register a new lab
const register = async (username, phoneNumber, email, buildNo, floorNo, address, password, coverImage, profileImage, subscribeDelivery, role, contracts) => {
    const existLab = await labs.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existLab) throwError("Lab already exists", 400);

    const hashedPassword = await hashPassword(password);

    const newLab = new labs({
        username,
        phoneNumber,
        email,
        buildNo,
        floorNo,
        address,
        coverImage,
        profileImage,
        password: hashedPassword,
        favouritePosts: [],
        posts: [],
        subscribeDelivery: subscribeDelivery || false,
        role: role || "lab",
        contracts: contracts || [],
    });

    await newLab.save();

    return { message: "Lab Created Successfully", newLab };
};

// Login a lab
const login = async (phoneNumber, email, password) => {
    const lab = await labs.findOne(email ? { email } : { phoneNumber });
    if (!lab) throwError("Lab not found", 401);

    const isMatch = await bcrypt.compare(password, lab.password);
    if (!isMatch) throwError("Incorrect Password", 401);
    const token = jwt.sign(
        { id: lab._id, role: "lab" }, // Payload
        JWT_SECRET, // Secret key
        { expiresIn: "7d" } // Token expiration
    );
    return { message: "Login Successful", lab, token };
};

// Change password for a doctor
const changePassword = async (phoneNumber, oldPassword, newPassword) => {
    try {
        // Find doctor by phone number
        const doctor = await labs.findOne({ phoneNumber });
        if (!doctor) {
            throw Object.assign(new Error("Doctor not found"), { statusCode: 401 });
        }

        // Check if old password matches
        const isMatch = await bcrypt.compare(oldPassword, doctor.password);
        if (!isMatch) {
            throw Object.assign(new Error("Old password is incorrect"), { statusCode: 401 });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        doctor.password = hashedPassword;
        await doctor.save();

        return { success: true, message: "Password changed successfully" };
    } catch (error) {
        throw error;
    }
};

// Forget password and send OTP
const forgetPassword = async (phoneNumber) => {
    const lab = await labs.findOne({ phoneNumber });
    if (!lab) throwError("Doctor not found", 401);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    lab.otp = otp;
    lab.otpExpiresAt = otpExpiresAt;
    await lab.save();

    const message = `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`;
    await sendWhatsAppOTP(phoneNumber, message);

    return { success: true, message: "OTP sent via WhatsApp" };
};

// Verify OTP and reset password
const verifyOTP = async (phoneNumber, otp, newPassword) => {
    if (!phoneNumber || !otp || !newPassword) throwError("Phone number, OTP, and new password are required", 400);

    const lab = await labs.findOne({ phoneNumber });
    if (!lab) throwError("Doctor not found", 404);

    if (otp !== lab.otp) throwError("Invalid OTP", 401);

    lab.password = await hashPassword(newPassword);
    await lab.save();

    return { message: "Password changed successfully" };
};

const getLabDataService = async (phoneNumber) => {
    try {
        const lab = await labs.findOne({ phoneNumber });
        if (!lab) {
            const error = new Error("Lab not found");
            error.statusCode = 404;
            throw error;  // You must throw the error
        }
        return lab;
    } catch (error) {
        console.log(error);
        throw error;  // Re-throw the error to be handled by the caller
    }
};

module.exports = {
    register,
    login,
    changePassword,
    forgetPassword,
    verifyOTP,
    getLabDataService
};
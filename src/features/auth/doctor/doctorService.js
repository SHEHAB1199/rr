const doctorsModel = require("../../../models/doctors.model");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const {sendWhatsAppOTP} = require("../../../config/whatsappClient");
const generateUID = () => {
    return crypto.randomBytes(2).toString("hex").toUpperCase().slice(0, 3);
};

const JWT_SECRET = process.env.jwt_secret_key;

const register = async (username, phoneNumber, email, buildNo, floorNo, address, password) => {
    const existDoctor = await doctorsModel.findOne({
        $or: [{ email }, { phoneNumber }]
    });

    if (existDoctor) {
        const error = new Error("User already exists");
        error.statusCode = 400;
        throw error;
    }

    const UID = generateUID();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newDoctor = new doctorsModel({
        username,
        phoneNumber,
        email,
        buildNo,
        floorNo,
        address,
        password: hashedPassword,
        UID,
    });

    await newDoctor.save();

    return { message: "Doctor registered successfully", newDoctor };
};

const login = async (phoneNumber, email, password) => {
    let doctor = null;
    console.log(JWT_SECRET);
    if (email) {
        doctor = await doctorsModel.findOne({ email });
    } else {
        doctor = await doctorsModel.findOne({ phoneNumber });
    }

    if (!doctor) {
        const error = new Error("Doctor not found");
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
        const error = new Error("Incorrect Password");
        error.statusCode = 401;
        throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: doctor._id, role: "doctor" }, // Payload
        JWT_SECRET, // Secret key
        { expiresIn: "7d" } // Token expiration
    );

    return { message: "Login Successful", doctor, token };
};

const changePassword = async (phoneNumber, oldPassword, newPassword) => {
    try {
        // Find doctor by phone number
        const doctor = await doctorsModel.findOne({ phoneNumber });
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

const forgetPassword = async (phoneNumber) => {
    try {
        const doctor = await doctorsModel.findOne({ phoneNumber });
        if (!doctor) {
            throw Object.assign(new Error("Doctor not found"), { statusCode: 401 });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

        // // Store OTP in database
        doctor.otp = otp;
        doctor.otpExpiresAt = otpExpiresAt;
        await doctor.save();

        // Send OTP via WhatsApp
        const message = `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`;
        await sendWhatsAppOTP(phoneNumber, message);

        return { success: true, message: "OTP sent via WhatsApp" };
    } catch (error) {
        throw error;
    }
};

const verifyOTP = async (phoneNumber, otp, newPassword) => {
    try {
        // Validate required fields
        if (!phoneNumber || !otp || !newPassword) {
            const error = new Error("Phone number, OTP, and new password are required");
            error.statusCode = 400;
            throw error;
        }

        // Find the doctor by phone number
        const doctor = await doctorsModel.findOne({ phoneNumber });
        if (!doctor) {
            const error = new Error("Doctor not found");
            error.statusCode = 404;
            throw error;
        }

        // Verify OTP
        if (otp !== doctor.otp) {
            const error = new Error("Invalid OTP");
            error.statusCode = 401;
            throw error;
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the doctor's password
        doctor.password = hashedPassword;
        await doctor.save(); // Ensure to await the save operation

        return {
            message: "Password changed successfully",
        };
    } catch (err) {
        console.error("Error in verifyOTP:", err);
        throw err; // Rethrow the error for the controller to handle
    }
};

const getDoctordata = async(phoneNumber)=>{
    const token = req.doctor
    try{
        const doctor = await doctorsModel.findOne({phoneNumber});
        if(!doctor){
            const error = new Error("Doctor not found");
            error.statusCode = 404;
            throw error;
        }
        return doctor;
    }
    catch(error){
        console.log(error);
        throw error;
    }
}

module.exports = { register, login, changePassword, forgetPassword, verifyOTP, getDoctordata };

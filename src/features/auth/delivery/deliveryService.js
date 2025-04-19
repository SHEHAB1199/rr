const deliveryModel = require("../../../models/delivery.model");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { sendWhatsAppOTP } = require("../../../config/whatsappClient");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.jwt_secret_key;

// Utility function to generate a unique ID
const generateUID = () => {
    return crypto.randomBytes(2).toString("hex").toUpperCase().slice(0, 3);
};

// Utility function to hash passwords
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// Register a new delivery person
const register = async (username, phoneNumber, email, buildNo, floorNo, address, password) => {
    const existDelivery = await deliveryModel.findOne({
        $or: [{ email }, { phoneNumber }],
    });

    if (existDelivery) {
        const error = new Error("Delivery person already exists");
        error.statusCode = 400;
        throw error;
    }

    const UID = generateUID();
    const hashedPassword = await hashPassword(password);

    const newDelivery = new deliveryModel({
        username,
        phoneNumber,
        email,
        buildNo,
        floorNo,
        address,
        password: hashedPassword,
        UID,
    });

    await newDelivery.save();
    return { message: "Delivery person registered successfully", newDelivery };
};

// Login a delivery person
const login = async (phoneNumber, email, password) => {
    let delivery = null;

    if (email) {
        delivery = await deliveryModel.findOne({ email });
    } else {
        delivery = await deliveryModel.findOne({ phoneNumber });
    }

    if (!delivery) {
        const error = new Error("Delivery person not found");
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, delivery.password);
    if (!isMatch) {
        const error = new Error("Incorrect Password");
        error.statusCode = 401;
        throw error;
    }
    // Generate JWT token
    const token = jwt.sign(
        { id: delivery._id, role: "del" }, // Payload
        JWT_SECRET, // Secret key
        { expiresIn: "7d" } // Token expiration
    );
    return { message: "Login Successful", delivery, token };
};

// Change password for a delivery person
const changePassword = async (phoneNumber, oldPassword, newPassword) => {
    try {
        const delivery = await deliveryModel.findOne({ phoneNumber });
        if (!delivery) {
            throw Object.assign(new Error("Delivery person not found"), { statusCode: 401 });
        }

        const isMatch = await bcrypt.compare(oldPassword, delivery.password);
        if (!isMatch) {
            throw Object.assign(new Error("Old password is incorrect"), { statusCode: 401 });
        }

        const hashedPassword = await hashPassword(newPassword);
        delivery.password = hashedPassword;
        await delivery.save();

        return { success: true, message: "Password changed successfully" };
    } catch (error) {
        throw error;
    }
};

// Forget password and send OTP
const forgetPassword = async (phoneNumber) => {
    try {
        const delivery = await deliveryModel.findOne({ phoneNumber });
        if (!delivery) {
            throw Object.assign(new Error("Delivery person not found"), { statusCode: 401 });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

        // Store OTP in database
        delivery.otp = otp;
        delivery.otpExpiresAt = otpExpiresAt;
        await delivery.save();

        // Send OTP via WhatsApp
        const message = `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`;
        await sendWhatsAppOTP(phoneNumber, message);

        return { success: true, message: "OTP sent via WhatsApp" };
    } catch (error) {
        throw error;
    }
};

// Verify OTP and reset password
const verifyOTP = async (phoneNumber, otp, newPassword) => {
    try {
        // Validate required fields
        if (!phoneNumber || !otp || !newPassword) {
            const error = new Error("Phone number, OTP, and new password are required");
            error.statusCode = 400;
            throw error;
        }

        // Find the delivery person by phone number
        const delivery = await deliveryModel.findOne({ phoneNumber });
        if (!delivery) {
            const error = new Error("Delivery person not found");
            error.statusCode = 404;
            throw error;
        }

        // Verify OTP
        if (otp !== delivery.otp) {
            const error = new Error("Invalid OTP");
            error.statusCode = 401;
            throw error;
        }

        // Hash the new password
        const hashedPassword = await hashPassword(newPassword);

        // Update the delivery person's password
        delivery.password = hashedPassword;
        await delivery.save();

        return { message: "Password changed successfully" };
    } catch (error) {
        console.error("Error in verifyOTP:", error);
        throw error;
    }
};

// Get delivery person data by phone number
const getDeliveryData = async (phoneNumber) => {
    try {
        const delivery = await deliveryModel.findOne({ phoneNumber });
        if (!delivery) {
            const error = new Error("Delivery person not found");
            error.statusCode = 404;
            throw error;
        }
        return delivery;
    } catch (error) {
        console.error("Error in getDeliveryData:", error);
        throw error;
    }
};

module.exports = {
    register,
    login,
    changePassword,
    forgetPassword,
    verifyOTP,
    getDeliveryData,
};
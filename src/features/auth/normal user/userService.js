const userModel = require("../../../models/user.model");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { sendWhatsAppOTP } = require("../../../config/whatsappClient");

// Utility function to generate a unique ID
const generateUID = () => {
    return crypto.randomBytes(2).toString("hex").toUpperCase().slice(0, 3);
};

// Utility function to hash passwords
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// Register a new user
const register = async (username, phoneNumber, email, password) => {
    const existUser = await userModel.findOne({
        $or: [{ email }, { phoneNumber }],
    });

    if (existUser) {
        const error = new Error("User already exists");
        error.statusCode = 400;
        throw error;
    }

    const UID = generateUID();
    const hashedPassword = await hashPassword(password);

    const newUser = new userModel({
        username,
        phoneNumber,
        email,
        password: hashedPassword,
        UID,
        role: "user"
    });

    await newUser.save();
    return { message: "User registered successfully", newUser };
};

// Login a user
const login = async (phoneNumber, email, password) => {
    let user = null;

    if (email) {
        user = await userModel.findOne({ email });
    } else {
        user = await userModel.findOne({ phoneNumber });
    }

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const error = new Error("Incorrect Password");
        error.statusCode = 401;
        throw error;
    }

    return { message: "Login Successful", user };
};

// Change password for a user
const changePassword = async (phoneNumber, oldPassword, newPassword) => {
    try {
        const user = await userModel.findOne({ phoneNumber });
        if (!user) {
            throw Object.assign(new Error("User not found"), { statusCode: 401 });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw Object.assign(new Error("Old password is incorrect"), { statusCode: 401 });
        }

        const hashedPassword = await hashPassword(newPassword);
        user.password = hashedPassword;
        await user.save();

        return { success: true, message: "Password changed successfully" };
    } catch (error) {
        throw error;
    }
};

// Forget password and send OTP
const forgetPassword = async (phoneNumber) => {
    try {
        const user = await userModel.findOne({ phoneNumber });
        if (!user) {
            throw Object.assign(new Error("User not found"), { statusCode: 401 });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

        // Store OTP in database
        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();

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

        // Find the user by phone number
        const user = await userModel.findOne({ phoneNumber });
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        // Verify OTP
        if (otp !== user.otp) {
            const error = new Error("Invalid OTP");
            error.statusCode = 401;
            throw error;
        }

        // Hash the new password
        const hashedPassword = await hashPassword(newPassword);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        return { message: "Password changed successfully" };
    } catch (error) {
        console.error("Error in verifyOTP:", error);
        throw error;
    }
};

// Get user data by phone number
const getUserData = async (phoneNumber) => {
    try {
        const user = await userModel.findOne({ phoneNumber });
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        return user;
    } catch (error) {
        console.error("Error in getUserData:", error);
        throw error;
    }
};

module.exports = {
    register,
    login,
    changePassword,
    forgetPassword,
    verifyOTP,
    getUserData,
};
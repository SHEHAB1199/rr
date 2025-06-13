const adminModel = require('../../models/admin.model');
const labs = require("../../models/labs.model");
const orders = require("../../models/order.model");
const deliveryModel = require('../../models/delivery.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

const generateUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

class AdminService {
    static async addAdmin(username, password) {
        try {
            const hashedPass = await hashPassword(password);
            const newAdmin = await adminModel.create({ username, password: hashedPass });
            return {
                status: 200,
                message: 'Admin created successfully',
                data: newAdmin
            };
        } catch (error) {
            console.error(error);
            return {
                status: 500,
                message: error.message,
            };
        }
    }

    static async getAllLabs() {
        try {
            const labList = await labs.find().lean();
            const orderList = await orders.find().lean();

            // Map labs with their associated orders
            const labsWithOrders = labList.map(lab => ({
                ...lab,
                orders: orderList.filter(order =>
                    order.labId.toString() === lab._id.toString()
                )
            }));

            return {
                status: 200,
                message: 'Labs retrieved successfully',
                data: labsWithOrders
            };
        } catch (error) {
            console.error(error);
            return {
                status: 500,
                message: error.message,
            };
        }
    }

    static async registerDelivery(username, phoneNumber, email, buildNo, floorNo, address, password) {
        try {
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

            const newDelivery = await deliveryModel.create({
                username,
                phoneNumber,
                email,
                buildNo,
                floorNo,
                address,
                password: hashedPassword,
                UID,
            });

            return {
                status: 200,
                message: "Delivery person registered successfully",
                data: newDelivery
            };
        } catch (error) {
            console.error(error);
            return {
                status: error.statusCode || 500,
                message: error.message,
            };
        }
    }

    static async loginAdmin(username, password) {
        try {
            const admin = await adminModel.findOne({ username }).lean();
            if (!admin) {
                const error = new Error("Admin not found");
                error.statusCode = 404;
                throw error;
            }

            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                const error = new Error("Invalid credentials");
                error.statusCode = 401;
                throw error;
            }

            const token = jwt.sign(
                { id: admin._id, username: admin.username, role: "admin" },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            return {
                status: 200,
                message: 'Login successful',
                data: { token }
            };
        } catch (error) {
            console.error(error);
            return {
                status: error.statusCode || 500,
                message: error.message,
            };
        }
    }
}

module.exports = AdminService;
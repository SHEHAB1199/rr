const redisClient = require('../../config/redis.config');
const {
    generateOrderKey,
    generateDoctorOrdersKey,
    generateDateBasedOrdersKey,
    generateStatusBasedOrdersKey,
} = require('../../utility/redis.utility'); // Ensure the correct path
const orders = require('../../models/order.model');
const labs = require('../../models/labs.model');
const crypto = require("crypto");

const generateUID = () => {
    return crypto.randomBytes(2).toString("hex").toUpperCase().slice(0, 3);
};

const createOrder = async (doctorId, patientName, age, teethNo, sex, color, type, description, price, prova, deadline, labId) => {
    try {
        // Validate required fields
        if (!doctorId || !patientName || !teethNo || !sex || !color || !type || prova === undefined || !deadline || !labId) {
            throw new Error("All required fields must be provided");
        }

        // Check if the doctor is associated with the lab
        const lab = await labs.findOne({ _id: labId }).select("doctors");
        if (!lab || !lab.doctors.includes(doctorId)) {
            throw new Error("You are not subscribed to this lab");
        }

        // Create a new order
        const newOrder = new orders({
            UID: generateUID(),
            patientName,
            doctorId,
            age,
            teethNo,
            sex,
            color,
            type,
            description,
            price,
            status: prova ? "DoctorReady(p)" : "DoctorReady(f)",
            labId,
            doc_id: doctorId,
            deadline,
            prova,
            media: [],
            date: new Date(),
        });

        // Save to database
        await newOrder.save();

        // Cache the order in Redis
        await redisClient.set(generateOrderKey(newOrder._id), JSON.stringify(newOrder));

        return {
            success: true,
            message: "Order created successfully",
            order: newOrder,
            fromCache: false, // Data is not from cache
        };
    } catch (error) {
        console.error("Error in createOrder:", error);
        return {
            success: false,
            message: error.message,
        };
    }
};

const getDoctorsorders = async (req) => {
    try {
        console.log("req", req.doctor);
        const doctorId = req.doctor.id;
        const cacheKey = generateDoctorOrdersKey(doctorId);

        // Check if orders are cached in Redis
        const cachedOrders = await redisClient.get(cacheKey);
        if (cachedOrders) {
            return {
                orders: JSON.parse(cachedOrders),
                fromCache: true, // Data is from cache
            };
        }

        // Fetch from database if not cached
        const ordersD = await orders.find({ doctorId: doctorId });

        // Cache the orders in Redis
        await redisClient.set(cacheKey, JSON.stringify(ordersD));

        return {
            orders: ordersD,
            fromCache: false, // Data is not from cache
        };
    } catch (error) {
        console.log(error);
        throw new Error("Error in getDoctorsorders");
    }
};

const getOrdersBasedOnDate = async (req, startDate, endDate) => {
    try {
        if (!req || !startDate || !endDate) {
            throw new Error("Doctor ID, Start Date, and End Date are required");
        }
        const doctorId = req.doctor.id;
        console.log("doctorId", doctorId);
        const cacheKey = generateDateBasedOrdersKey(doctorId, startDate, endDate);

        // Check if orders are cached in Redis
        const cachedOrders = await redisClient.get(cacheKey);
        if (cachedOrders) {
            return {
                orders: JSON.parse(cachedOrders),
                fromCache: true, // Data is from cache
            };
        }

        // Convert dates to JavaScript Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Query orders for the given doctor between the selected dates
        const ordersList = await orders.find({
            doc_id: doctorId,
            date: {
                $gte: start,
                $lte: end,
            },
        });

        // Cache the orders in Redis
        await redisClient.set(cacheKey, JSON.stringify(ordersList));

        return {
            orders: ordersList,
            fromCache: false, // Data is not from cache
        };
    } catch (error) {
        console.error("Error in getOrdersBasedOnDate:", error);
        throw new Error("Error fetching orders based on date");
    }
};

const ordersBasedonStatus = async (req, status) => {
    try {
        const doctorId = req.doctor.id;
        const cacheKey = generateStatusBasedOrdersKey(doctorId, status);

        // Check if orders are cached in Redis
        const cachedOrders = await redisClient.get(cacheKey);
        if (cachedOrders) {
            return {
                orders: JSON.parse(cachedOrders),
                fromCache: true, // Data is from cache
            };
        }

        let query = { doctorId: doctorId };

        // If status is "docready", include both "DoctorReady(f)" and "DoctorReady(p)"
        if (status === "docready") {
            query.status = { $in: ["DoctorReady(f)", "DoctorReady(p)"] };
        } else {
            // Use regex to search for statuses that include the given status string
            query.status = { $regex: status, $options: 'i' }; // 'i' for case-insensitive search
        }

        const ordersD = await orders.find(query);

        // Cache the orders in Redis
        await redisClient.set(cacheKey, JSON.stringify(ordersD));

        return {
            orders: ordersD,
            fromCache: false, // Data is not from cache
        };
    } catch (error) {
        console.error("Error in ordersBasedonStatus:", error);
        throw new Error("Error fetching orders based on status");
    }
};

const getMyContracts = async (req) => {
    const labId = req.params.id;
    const doctorId = req.doctor.id;

    try {
        const cachedContract = await redisClient.get(`contract:${doctorId}`);
        if (cachedContract) {
            return {
                status: 200,
                message: "Contract retrieved from cache",
                contract: JSON.parse(cachedContract),
                fromCache: true
            };
        }
        const lab = await labs.findById(labId);
        if (!lab) {
            return { status: 404, message: "Lab not found", contract: null, fromCache: false };
        }
        const contract = lab.contracts.find(c => c.doctorId.toString() === doctorId);
        if (!contract) {
            return { status: 400, message: "You are not subscribed with this lab", contract: null, fromCache: false };
        }
        await redisClient.setEx(`contract:${doctorId}`, 3600, JSON.stringify(contract));
        return {
            status: 200,
            message: "Contract retrieved successfully",
            contract,
            fromCache: false
        };
    } catch (error) {
        console.error("Error in getMyContracts service:", error);
        return { status: 500, message: error.message, contract: null, fromCache: false };
    }
};

const getOrderById = async(req)=>{
    const orderId = req.params.orderId;
    const role = req.doctor.role;
    const doctorId = req.doctor.id;
    try{
        console.log(role)
        if(role !== "doctor"){
            const error = new Error("Unauthorized");
            error.status = 401;
            throw error;
        }
        const orderData = await orders.findOne({ _id: orderId });
        if(doctorId !== orderData.doctorId){
            const error = new Error("Unauthorized");
            error.status = 401;
            throw error;
        }
        if(!orderData){
            const error = new Error("Order Not Found");
            error.status = 400;
            throw error;
        }
        return {
            status: 200,
            order: orderData
        }
    }
    catch (error){
        console.log(error);
        throw new Error(error.message);
    }
}

module.exports = { createOrder, getDoctorsorders, getOrderById, getOrdersBasedOnDate, ordersBasedonStatus, getMyContracts };

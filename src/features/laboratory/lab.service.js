const labsModel = require("../../models/labs.model");
const doctorsModel = require("../../models/doctors.model");
const jwt = require("jsonwebtoken");
const redisClient = require('../../config/redis.config');
const crypto = require("crypto");
const orders = require("../../models/order.model");
const { generateLabOrdersKey, generateOrderKey } = require("../../utility/redis.utility");
const { getLabDataService } = require("../auth/labs/labsService");

const getAllOrders = async (req) => {
    try {
        const labId = req.lab.id;
        console.log("Lab ID:", labId);

        // 1. Verify Lab Exists
        const lab = await labsModel.findById(labId).populate({
            path: "doctors",
            select: "_id username"
        }).lean();

        if (!lab) {
            return {
                status: 404,
                message: "Lab not found",
                orders: []
            };
        }

        // 2. Check for Associated Doctors
        const labDoctors = lab.doctors.map(doc => doc._id);
        if (labDoctors.length === 0) {
            return {
                status: 200,
                message: "No doctors found for this lab",
                orders: []
            };
        }

        // 3. Check Redis Cache
        const cacheKey = `lab:${labId}:orders`;
        const cachedOrders = await redisClient.get(cacheKey);

        // Optionally clear cache for testing
        if (req.query.clearCache === 'true') {
            await redisClient.del(cacheKey);
            console.log("Cache cleared");
        }

        if (cachedOrders && req.query.clearCache !== 'true') {
            console.log("Returning cached orders");
            return {
                status: 200,
                message: "Orders retrieved from cache",
                orders: JSON.parse(cachedOrders),
                cached: true
            };
        }

        // 4. Fetch from Database with doctor population
        const labOrders = await orders.find({
            // doctorId: { $in: labDoctors },
            labId
        })
            .populate({
                path: 'doctorId',
                select: 'username',
                model: 'doctors'
            })
            .sort({ createdAt: -1 })
            .lean();
        console.log("???????????", labOrders);
        // Transform orders to include doctor username
        const transformedOrders = labOrders.map(order => ({
            ...order,
            doctorUsername: order.doctorId?.username || 'Unknown'
        }));

        // 5. Cache Results
        if (transformedOrders.length > 0) {
            await redisClient.set(
                cacheKey,
                JSON.stringify(transformedOrders),
                "EX",
                600 // 10 minutes
            );
        }

        return {
            status: 200,
            message: "Orders retrieved successfully",
            orders: transformedOrders,
            cached: false
        };

    } catch (error) {
        console.error("Error in getAllOrders service:", error);
        return {
            status: 500,
            message: "Failed to retrieve orders: " + error.message,
            orders: [],
            error: error.stack
        };
    }
};
const getOrdersFilter = async (req) => {
    try {
        const labId = req.lab.id;
        const status = req.params.status;
        console.log("Status from query:", status);

        const cacheKey = generateLabOrdersKey(labId);

        const cachedOrders = await redisClient.get(cacheKey);
        if (cachedOrders) {
            console.log("Returning filtered orders from Redis cache");
            const orders = JSON.parse(cachedOrders);

            const filteredOrders = status ? orders.filter(order => {
                console.log(`Order status: ${order.status}, Filter status: ${status}`);
                return order.status === status;
            }) : orders;

            return { status: 200, message: "Filtered orders retrieved from cache", orders: filteredOrders };
        }

        console.log("Cache miss! Fetching orders from MongoDB...");
        const lab = await labsModel.findById(labId).select("doctors").lean();
        if (!lab) {
            return { status: 404, message: "Lab not found", orders: [] };
        }

        const labDoctors = lab.doctors;
        if (!labDoctors || labDoctors.length === 0) {
            return { status: 200, message: "No doctors found", orders: [] };
        }

        const labOrders = await orders.find({ doctorId: { $in: labDoctors }, labId }).lean();
        console.log("Sample order status:", labOrders[0]?.status);

        await redisClient.set(cacheKey, JSON.stringify(labOrders), "EX", 600);

        const filteredOrders = status ? labOrders.filter(order => {
            console.log(`Order status: ${order.status}, Filter status: ${status}`);
            return order.status === status;
        }) : labOrders;

        return { status: 200, message: "Filtered orders retrieved successfully", orders: filteredOrders.sort({ createdAt: -1 }) };
    } catch (error) {
        console.error("Error in getOrdersFilter:", error.message);
        return { status: 500, message: error.message, orders: [] };
    }
};

const getOrderById = async (req) => {
    try {
        const orderId = req.params.id;
        const labId = req.lab.id;
        const cacheKey = generateOrderKey(orderId);
        const cachedOrder = await redisClient.get(cacheKey);
        if (cachedOrder) {
            console.log("Cache hit");
            return { status: 200, message: "Order retrieved from cache", order: JSON.parse(cachedOrder) };
        }
        console.log("Cache miss");
        const order = await orders.findOne({ _id: orderId, labId: labId });
        if (!order) {
            console.error(`Order not found: ${orderId}`);
            return { status: 404, message: "Order not found", order: null };
        }
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(order));
        return { status: 200, message: "Order retrieved successfully", order };
    } catch (error) {
        console.error("Error fetching order:", error.message);
        return { status: 500, message: error.message, order: null };
    }
};

const updateTeethNumber = async (req) => {
    try {
        const orderId = req.params.id;
        const labId = req.lab.id;
        const labRole = req.lab.role;
        const teethNumber = req.body.teethNumber;
        console.log("orderId:", orderId);
        console.log("labId:", labId);
        console.log("teethNumber:", teethNumber);
        const order = await orders.findOne({ _id: orderId });
        if (!order) {
            return { status: 404, message: "Order not found", order: null };
        }
        if (order.labId.toString() !== labId || labRole !== "lab") {
            return { status: 403, message: "Unauthorized", order: null };
        }
        order.teethNo = teethNumber;
        await order.save();
        const cacheKey = generateOrderKey(orderId);
        await redisClient.del(cacheKey);
        return { status: 200, message: "Teeth number updated successfully", order };
    } catch (error) {
        console.error("Error in updateTeethNumber:", error.message);
        return { status: 500, message: error.message, order: null };
    }
};

const addDoctor = async (req) => {
    const labId = req.lab.id;
    const UID = req.params.UID;
    try {
        const lab = await labsModel.findOne({ _id: labId });
        const doctor = await doctorsModel.findOne({ UID: UID });
        if (!doctor) {
            return { status: 400, message: "Doctor not found", addDoctorResult: null };
        }
        if (lab.doctors.includes(doctor._id)) {
            return { status: 400, message: "You already have this doctor", addDoctorResult: null };
        }
        lab.doctors.push(doctor._id);
        await lab.save();
        return { status: 200, message: "Doctor added successfully", addDoctorResult: doctor };
    } catch (error) {
        console.log("Error in addDoctor:", error);
        return { status: 500, message: error.message, addDoctorResult: null };
    }
}
const removeDoctor = async (req) => {
    try {
        const labId = req.lab?.id;
        const UID = req.params.UID;
        if (!labId) {
            return { status: 400, message: "Lab authentication data is missing." };
        }
        const doctor = await doctorsModel.findOne({ UID: UID });
        if (!doctor) {
            return { status: 404, message: "Doctor not found." };
        }
        const lab = await labsModel.findOne({ _id: labId });
        if (!lab) {
            return { status: 404, message: "Lab not found." };
        }
        lab.doctors = lab.doctors.filter(docId => docId.toString() !== doctor._id.toString());
        lab.contracts = lab.contracts.filter(contract => contract.doctorId.toString() !== doctor._id.toString());
        await lab.save();

        return { status: 200, message: "Doctor and associated contract removed successfully.", removedDoctor: doctor };
    } catch (error) {
        console.error("Error in removeDoctor:", error);
        return { status: 500, message: error.message };
    }
};

const addContractForDoctor = async (req) => {
    const { uid, teethTypes } = req.body;
    const labId = req.lab.id;

    try {
        console.log(uid, teethTypes);
        // Validate inputs
        if (!uid || !teethTypes || typeof teethTypes !== 'object') {
            return { status: 400, message: "Doctor UID and teethTypes are required", contract: null };
        }

        // Convert teethTypes to Map if it's a plain object
        const teethTypesMap = teethTypes instanceof Map ?
            teethTypes :
            new Map(Object.entries(teethTypes));

        // Validate prices
        for (const [toothType, price] of teethTypesMap) {
            if (typeof price !== 'number' || price < 0) {
                return {
                    status: 400,
                    message: `Invalid price for ${toothType}: must be positive number`,
                    contract: null
                };
            }
        }

        // Find doctor by UID
        const doctor = await doctorsModel.findOne({ UID: uid });
        if (!doctor) {
            return { status: 404, message: "Doctor not found", contract: null };
        }

        // Find and update lab
        const lab = await labsModel.findById(labId);
        if (!lab) {
            return { status: 404, message: "Lab not found", contract: null };
        }

        // Find existing contract index
        const existingIndex = lab.contracts.findIndex(
            c => c.doctorId.toString() === doctor._id.toString()
        );

        // Update or create contract
        if (existingIndex !== -1) {
            // Merge existing types with new ones
            const existingTypes = lab.contracts[existingIndex].teethTypes || new Map();
            teethTypesMap.forEach((value, key) => existingTypes.set(key, value));
            lab.contracts[existingIndex].teethTypes = existingTypes;
        } else {
            // Add new contract
            lab.contracts.push({
                doctorId: doctor._id,
                teethTypes: teethTypesMap
            });
        }

        await lab.save();
        await redisClient.del(`contract:${doctor._id}`);

        return {
            status: 200,
            message: "Contract saved successfully",
            contract: {
                doctorId: doctor._id,
                teethTypes: Object.fromEntries(teethTypesMap)
            }
        };

    } catch (error) {
        console.error("Error in addContractForDoctor:", error);
        return {
            status: 500,
            message: error.message || "Internal server error",
            contract: null
        };
    }
};

const myDoctors = async (req) => {
    try {
        const labId = req.lab?.id;
        if (!labId) {
            return { status: 400, message: "Lab authentication data is missing." };
        }
        const lab = await labsModel
            .findOne({ _id: labId })
            .populate({
                path: "doctors",
                select: "UID username phoneNumber profileImage"
            })
            .select("username email doctors")
            .exec();

        if (!lab) {
            return { status: 404, message: "Lab not found." };
        }
        return { status: 200, message: "Doctors retrieved successfully.", doctors: lab.doctors };
    } catch (error) {
        console.error("Error in myDoctors:", error);
        return { status: 500, message: error.message };
    }
};

const updateContractForDoctor = async (req) => {
    const { doctorId, teethTypes } = req.body;
    const labId = req.lab.id;
    try {
        if (!doctorId || !teethTypes || typeof teethTypes !== "object") {
            return { status: 400, message: "Invalid input: doctorId and teethTypes are required", contract: null };
        }
        for (const [toothType, price] of Object.entries(teethTypes)) {
            if (typeof price !== "number" || price < 0) {
                return { status: 400, message: `Invalid price for tooth type: ${toothType}`, contract: null };
            }
        }
        const lab = await labsModel.findById(labId);
        if (!lab) return { status: 404, message: "Lab not found", contract: null };
        const contractIndex = lab.contracts.findIndex(c => c.doctorId.toString() === doctorId);
        if (contractIndex === -1) return { status: 404, message: "Contract not found", contract: null };
        lab.contracts[contractIndex].teethTypes = teethTypes;
        await lab.save();
        await redisClient.del(`contract:${doctorId}`);
        const updatedContract = lab.contracts[contractIndex];
        await redisClient.setEx(`contract:${doctorId}`, 3600, JSON.stringify(updatedContract));
        return { status: 200, message: "Contract updated successfully", contract: updatedContract };
    } catch (error) {
        console.error("Error in updateContractForDoctor service:", error);
        return { status: 500, message: error.message, contract: null };
    }
};

const getDoctorContract = async (req) => {
    const uid = req.params.doctorId;
    const role = req.lab.role;
    const labId = req.lab.id;

    try {
        if (role !== "lab") {
            return { status: 401, message: "Unauthorized" };
        }
        console.log("uid", uid);
        const doctor = await doctorsModel.findOne({ UID: uid }).select("_id");
        console.log(doctor)
        if (!doctor) {
            return { status: 404, message: "Doctor not found" };
        }

        const doctorIdStr = doctor._id.toString();

        const lab = await labsModel.findById(labId).select('contracts').lean();

        if (!lab) {
            return { status: 404, message: "Lab not found" };
        }

        const contract = lab.contracts.find(
            (d) => d.doctorId?.toString() === doctorIdStr
        );

        return {
            status: 200,
            contract: contract || null,
        };
    } catch (error) {
        console.error(error);
        return {
            status: 500,
            message: error.message,
            contract: null
        };
    }
};

const markOrder = async (req) => {
    const labId = req.lab.id;
    const role = req.lab.role;
    const orderId = req.params.orderId; // Changed from doctorId to orderId
    try {
        // 1. Authorization Check
        if (role !== "lab") {
            return {
                status: 401,
                message: "Unauthorized",
                success: false
            };
        }

        // 2. Find the Order
        const order = await orders.findById(orderId);
        if (!order) {
            return {
                status: 404,
                message: "Order not found",
                success: false
            };
        }

        // 3. Verify Lab Ownership (optional - uncomment if needed)
        // if (order.labId.toString() !== labId.toString()) {
        //     return {
        //         status: 403,
        //         message: "Not authorized to modify this order",
        //         success: false
        //     };
        // }

        // 4. Update Status
        if (order.status.includes("(p)")) {
            order.status = "lab ready(p)";
        } else if (order.status.includes("(f)")) {
            order.status = "lab ready(f)";
        } else {
            return {
                status: 400,
                message: "Invalid order status for this operation",
                success: false
            };
        }

        // 5. Save the Updated Order
        const updatedOrder = await order.save();

        // 6. Clear Redis Cache
        const cacheKeys = [
            `lab:${labId}:orders`, // Lab's orders cache
            generateOrderKey(orderId), // Specific order cache if you have it
            generateLabOrdersKey(labId) // If you use this utility
        ];

        await Promise.all(
            cacheKeys.map(key => redisClient.del(key).catch(err => {
                console.error(`Error deleting cache key ${key}:`, err);
            }))
        );

        // 7. Return Success Response
        return {
            status: 200,
            message: "Order marked as Lab Ready and cache cleared",
            success: true,
            order: updatedOrder
        };

    } catch (error) {
        console.error("Error in markOrder:", error);
        return {
            status: 500,
            message: error.message || "Internal server error",
            success: false,
            error: error.stack
        };
    }
};

const updatePrice = async (req) => {
    try {
        const { role, id: labId } = req.lab;
        const { orderId, paied } = req.body;

        // 1. Validate input
        if (!orderId) {
            return {
                status: 400,
                success: false,
                message: "Order ID is required",
            };
        }
        if (typeof paied !== "number" || paied < 0) {
            return {
                status: 400,
                success: false,
                message: "Paid amount must be a non-negative number",
            };
        }
        if (role !== "lab") {
            return {
                status: 401,
                success: false,
                message: "Unauthorized access",
            };
        }

        // 2. Find and validate order
        const order = await orders.findOne({ _id: orderId, labId });
        if (!order) {
            return {
                status: 404,
                success: false,
                message: "Order not found or not associated with this lab",
            };
        }

        // 3. Validate payment amount
        if (paied > order.price) {
            return {
                status: 400,
                success: false,
                message: "Paid amount cannot exceed total price",
            };
        }

        // 4. Update order
        order.paid = paied;
        order.rest = order.price - paied;
        const updatedOrder = await order.save();

        // 5. Clear Redis cache
        const cacheKeys = [
            `lab:${labId}:orders`, // Cache for getAllOrders
            generateOrderKey(orderId), // Cache for getOrderById
            generateLabOrdersKey(labId), // Cache for getOrdersFilter
        ];

        await Promise.all(
            cacheKeys.map((key) =>
                redisClient.del(key).catch((err) => {
                    console.error(`Error deleting cache key ${key}:`, err);
                })
            )
        );

        // 6. Return success response
        return {
            status: 200,
            success: true,
            message: "Order price updated successfully and cache cleared",
            order: updatedOrder,
        };
    } catch (error) {
        console.error("Error updating price:", error);
        return {
            status: 500,
            success: false,
            message: error.message || "Internal server error",
            error: error.stack,
        };
    }
};

const billingService = async (req) => {
    const labId = req.lab.id;
    const role = req.lab.role;
    const { startDate, endDate } = req.query;

    try {
        // Validate role
        if (role !== 'lab') {
            return {
                status: 401,
                message: "Unauthorized - Lab access only"
            };
        }

        // Build date filter if provided
        const dateFilter = {};
        if (startDate) {
            dateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.$lte = new Date(endDate);
            // Include the entire end day by setting time to 23:59:59
            dateFilter.$lte.setHours(23, 59, 59, 999);
        }

        // Build the query
        const query = { labId: labId };
        if (startDate || endDate) {
            query.createdAt = dateFilter;
        }

        // Get all orders for this lab with optional date filtering
        const labOrders = await orders.find(query).select("price paid rest doctorId createdAt");

        // Extract unique doctor IDs
        const doctorIds = [...new Set(labOrders.map(order => order.doctorId.toString()))];

        // Get doctor details
        const doctorsData = await doctorsModel.find({
            _id: { $in: doctorIds }
        }).select("username phoneNumber");

        // Create a map for quick doctor lookup
        const doctorMap = {};
        doctorsData.forEach(doctor => {
            doctorMap[doctor._id.toString()] = doctor;
        });

        // Calculate totals
        const billSummary = {
            totalOrders: labOrders.length,
            totalRevenue: labOrders.reduce((sum, order) => sum + (order.price || 0), 0),
            totalPaid: labOrders.reduce((sum, order) => sum + (order.paid || 0), 0),
            totalRest: labOrders.reduce((sum, order) => sum + (order.rest || 0), 0),
            byDoctor: {},
            dateRange: {
                startDate: startDate || null,
                endDate: endDate || null
            }
        };

        // Group by doctor
        labOrders.forEach(order => {
            const doctorId = order.doctorId.toString();
            if (!billSummary.byDoctor[doctorId]) {
                billSummary.byDoctor[doctorId] = {
                    doctor: doctorMap[doctorId] || { username: 'Unknown Doctor', phoneNumber: 'N/A' },
                    totalOrders: 0,
                    totalAmount: 0,
                    totalPaid: 0,
                    totalRest: 0
                };
            }

            billSummary.byDoctor[doctorId].totalOrders++;
            Math.round(billSummary.byDoctor[doctorId].totalAmount += order.price) || 0;
            Math.round(billSummary.byDoctor[doctorId].totalPaid += order.paid) || 0;
            Math.round(billSummary.byDoctor[doctorId].totalRest += order.price - order.paid) || 0;
        });

        return {
            status: 200,
            message: "Bill data retrieved successfully",
            data: billSummary
        };
    } catch (error) {
        console.error("Error in getBill:", error);
        return {
            status: 500,
            message: error.message
        };
    }
};
module.exports = {
    getAllOrders,
    getOrdersFilter,
    getOrderById,
    updateTeethNumber,
    addDoctor,
    removeDoctor,
    addContractForDoctor,
    myDoctors,
    updateContractForDoctor,
    getDoctorContract,
    markOrder,
    updatePrice,
    billingService
}
const labs = require("../../models/labs.model");
const orders = require("../../models/order.model");
const redisClient = require("../../config/redis.config");
const crypto = require("crypto");
const { generateOrderKey, generateDoctorOrdersKey, generateLabOrdersKey } = require("../../utility/redis.utility");

const generateUID = () => {
    return crypto.randomBytes(2).toString("hex").toUpperCase().slice(0, 3);
};

const createOrder = async (req, patientName, age, teethNo, sex, color, type, description, prova, deadline, labId) => {
    try {
        const doctorId = req.doctor.id;
        console.log("doctorId", doctorId);

        // Validate required fields
        if (!patientName || !teethNo || !sex || !color || !type || prova === undefined || !deadline || !labId) {
            throw { status: 400, message: "All required fields must be provided" };
        }

        // Check lab subscription
        const lab = await labs.findOne({ _id: labId }).select("doctors");
        if (!lab || !lab.doctors.includes(doctorId)) {
            throw { status: 403, message: "You are not subscribed to this lab" };
        }

        // Get contract data
        const labData = await labs.findById(labId).select('contracts').lean();
        if (!labData) {
            throw { status: 404, message: "Lab not found" };
        }

        // Find the doctor's contract
        const doctorContract = labData.contracts.find(
            (c) => c.doctorId?.toString() === doctorId.toString()
        );
        if (!doctorContract) {
            throw { status: 403, message: "No contract found with this lab" };
        }

        // Validate price from contract (using object access, not Map)
        if (!doctorContract.teethTypes || doctorContract.teethTypes[type] === undefined) {
            throw {
                status: 400,
                message: `No price defined for type: ${type}. Contact the lab.`
            };
        }
        const calculatedPrice = doctorContract.teethTypes[type]*teethNo;

        // Create the order
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
            price: calculatedPrice,
            status: prova ? "DoctorReady(p)" : "DoctorReady(f)",
            labId,
            doc_id: doctorId,
            delivery: [],
            deadline,
            prova,
            taked: false,
            media: [],
            date: new Date(),
        });

        await newOrder.save();

        // Cache operations
        await redisClient.set(generateOrderKey(newOrder._id), JSON.stringify(newOrder));
        await redisClient.del(generateDoctorOrdersKey(doctorId));
        await redisClient.del(generateLabOrdersKey(labId));

        // Socket emission
        if (global.io) {
            global.io.emit(`get-orders/${labId}`, { orders: newOrder });
        }

        return {
            status: 201,
            success: true,
            message: "Order created successfully",
            order: newOrder,
            fromCache: false,
        };
    } catch (error) {
        console.error("Error in createOrder:", error);
        return {
            status: error.status || 500,
            success: false,
            message: error.message,
        };
    }
};

const updateOrders = async (req, orderId, updateData) => {
    try {
        console.log("Doctor ID:", req.doctor?.id);
        console.log("Updating Order ID:", orderId);
        const doctorId = req.doctor.id;
        const cacheKey = generateOrderKey(orderId);
        const order = await orders.findById(orderId);
        if (!order) {
            console.error("Order not found in DB:", orderId);
            throw new Error("Order not found");
        }
        console.log("Order doctor ID:", order.doctorId);
        if (order.doctorId.toString() !== doctorId) {
            throw new Error("Unauthorized");
        }
        const updatedOrder = await orders.findOneAndUpdate(
            { _id: orderId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        console.log("Updated order:", updatedOrder);
        try {
            await redisClient.del(cacheKey);
            console.log(`Deleted cache for order: ${orderId}`);
        } catch (redisError) {
            console.error("Redis cache deletion error:", redisError.message);
        }

        return updatedOrder;
    } catch (error) {
        console.error("Error updating order:", error.message);
        throw new Error(error.message || "Error in updateOrders");
    }
};


const getMyLabs = async (req) => {
    const doctorId = req.doctor.id;
    try {
        const myLabs = await labs.find({ doctors: doctorId }).select("username phoneNumber contracts");

        // Flatten contracts from all labs
        const allContracts = myLabs.flatMap(lab => lab.contracts);

        // Find the specific contract related to this doctor
        const doctorContract = allContracts.find(contract => contract.doctorId.toString() === doctorId.toString());

        return {
            myLabs,
            contract: doctorContract,
        };
    } catch (error) {
        console.log(error);
        throw new Error("Error in getMyLabs");
    }
};



module.exports = {
    createOrder,
    updateOrders,
    getMyLabs
};
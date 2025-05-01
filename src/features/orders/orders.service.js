const labs = require("../../models/labs.model");
const orders = require("../../models/order.model");
const redisClient = require("../../config/redis.config");
const doctors = require("../../models/doctors.model");
const crypto = require("crypto");
const {sendWhatsAppOTP} = require("../../config/whatsappClient");
const { generateOrderKey, generateDoctorOrdersKey, generateLabOrdersKey } = require("../../utility/redis.utility");
const savedOrders = require("../../models/svaedOrders.model");
const deliverOrders = require("../../models/deliveryOrders");
const generateUID = () => {
    return crypto.randomBytes(2).toString("hex").toUpperCase().slice(0, 3);
};


const createOrder = async (req, save, patientName, age, teethNo, sex, color, type, description, prova, deadline, labId, scanFile) => {
    try {
        const doctorId = req.doctor.id;
        console.log("asdkjl", req.doctor.id);
        console.log("doctorId", doctorId);
        // Validate required fields
        if (!patientName || !teethNo || !sex  || !type || prova === undefined || !deadline || !labId) {
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

        // Validate price from contract
        if (!doctorContract.teethTypes || doctorContract.teethTypes[type] === undefined) {
            throw {
                status: 400,
                message: `No price defined for type: ${type}. Contact the lab.`
            };
        }
        const calculatedPrice = doctorContract.teethTypes[type] * teethNo;

        // Get doctor's username - FIXED THIS PART
        const doctor = await doctors.findById(doctorId).select("username").lean();
        if (!doctor) {
            throw { status: 404, message: "Doctor not found" };
        }

        // Determine order status - FIXED THIS LOGIC
        let status;
        console.log("333333333", prova);
        console.log(typeof prova);
        if (prova === "true") {
            status = "DoctorReady(p)";
        } else {
            status = "DoctorReady(f)";
        }
        console.log("333333333", status);

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
            status: status,
            labId,
            doc_id: doctorId,
            delivery: [],
            deadline,
            prova,
            taked: false,
            media: [],
            save: save || false,
            scanFile: scanFile || false,
            date: new Date(),
        });

        await newOrder.save();

        // Socket emission - FIXED THE DATA BEING SENT
        if (global.io) {
            global.io.emit(`get-orders/${labId}`, {
                orders: newOrder,
                doctorUsername: doctor.username
            });
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
            message: error.message || "Internal server error",
        };
    }
};
const updateOrders = async (req, orderId, updateData) => {
    try {
        console.log("Doctor ID:", req.doctor?.id);
        console.log("Updating Order ID:", orderId);
        const labId = req.lab.id;
        const order = await orders.findById(orderId);
        if (!order) {
            console.error("Order not found in DB:", orderId);
            throw new Error("Order not found");
        }
        console.log("Order doctor ID:", order.labId);
        // if (order.labId.toString() !== labId) {
        //     throw new Error("Unauthorized");
        // }
        const updatedOrder = await orders.findOneAndUpdate(
            { _id: orderId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        console.log("Updated order:", updatedOrder);

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
const orderService = require("./orders.service");
const {sendWhatsAppOTP, sendWhatsAppOTP2} = require("../../config/whatsappClient");
const savedOrders = require("../../models/svaedOrders.model");
const deliverOrders = require("../../models/deliveryOrders");
const mongoose = require('mongoose');
async function addsaveOrder(orderId, doctorId, labId) {
    try {
        console.log("asddddd")
        const existDocument = await savedOrders.findOne({ doctorId, labId, status: 'pending' });

        if (existDocument) {
            // If order already exists in the document
            if (existDocument.orders.includes(orderId)) {
                return { status: 400, message: "Order already saved" };
            }

            existDocument.orders.push(orderId);
            await existDocument.save();
            return { status: 200, message: "Order saved successfully" };
        }

        // If no document exists for the doctor and lab, create a new one
        const newDocument = new savedOrders({ doctorId, labId, orders: [orderId], status: "pending" });
        await newDocument.save();
        return { status: 200, message: "Order created and saved successfully" };

    } catch (error) {
        console.error("Error in addsaveOrder:", error);
        return { status: 500, message: "Failed to save order" };
    }
}

const createOrder = async (req, res) => {
    try {
        const {
            patientName,
            age,
            teethNo,
            sex,
            color,
            type,
            description,
            prova,
            deadline,
            labId,
            scanFile,
            save
        } = req.body;

        // Validate required fields and identify which ones are missing
        const missingFields = [];

        if (!patientName) missingFields.push("patientName");
        if (!teethNo) missingFields.push("teethNo");
        if (!sex) missingFields.push("sex");
        if (!type) missingFields.push("type");
        if (prova === undefined) missingFields.push("prova");
        if (!deadline) missingFields.push("deadline");
        if (!labId) missingFields.push("labId");

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required field(s): ${missingFields.join(", ")}`
            });
        }

        // Call the service to create the order
        const response = await orderService.createOrder(
            req,
            save || false,
            patientName,
            age,
            teethNo,
            sex,
            color,
            type,
            description,
            prova,
            deadline,
            labId,
            scanFile || false
        );
        const state = save;
        // If order creation was successful and save flag is true, save the order
        if (response.success) {
            console.log("save", save)
            console.log(typeof(state))

            if (state === 'true') {
                const doctorId = req.doctor.id;  // Assuming doctor ID is in the user object
                const orderId = response.data._id; // Assuming the created order ID is in the response
                const saveResponse = await addsaveOrder(orderId, doctorId, labId);

                if (saveResponse.status !== 200) {
                    // Handle save error
                    console.warn("Order was created but could not be saved:", saveResponse.message);
                }
            }
        }

        res.status(response.status).json({
            success: response.success,
            message: response.message,
            data: response.data,
        });

    } catch (error) {
        console.error("Error in createOrder controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

 const getMyLabs = async (req, res) => {
     try{
         const labs = await orderService.getMyLabs(req);
         res.status(200).json({labs: labs});
     }catch(error){
         console.log(error);
         res.status(500).json({ success: false, message: "Error getMyLabs" });
     }
 }
const updateOrderController = async (req, res) => {
    try {
        const orderId = req.params.id; // Get order ID from URL
        const updateData = req.body; // Get fields to update from request body
        console.log(orderId);
        // Call the service function to update order
        const updatedOrder = await orderService.updateOrders(req, orderId, updateData);

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({
            success: true,
            message: "Order updated successfully",
            order: updatedOrder,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createOrder,
    updateOrderController,
    getMyLabs
};
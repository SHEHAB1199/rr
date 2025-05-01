const orderService = require("./orders.service");
const {sendWhatsAppOTP, sendWhatsAppOTP2} = require("../../config/whatsappClient");
const savedOrders = require("../../models/svaedOrders.model");
const deliverOrders = require("../../models/deliveryOrders");
const mongoose = require('mongoose');
async function addsaveOrder(orderId, doctorId, labId){

    const existDocument = await savedOrders.findOne({ doctorId, labId });

    if (existDocument) {
        if (existDocument.orders.includes(orderId)) {
            return {
                status: 400,
                message: "Order already saved",
            }
        }
        existDocument.orders.push(orderId);
        await existDocument.save();
        return { status: 200, message: "Order saved successfully" };
    }

    const newDocument = new savedOrders({ doctorId, labId, orders: [orderId] });
    await newDocument.save();
    return { status: 200, message: "Order created and saved successfully" };
} {}
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

        // Validate required fields at controller level too
        if (!patientName || !teethNo || !sex  || !type || prova === undefined || !deadline || !labId) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided"
            });
        }

        const response = await orderService.createOrder(
            req,
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
            scanFile || false,
            save || false
        );

        // If order creation was successful and save flag is true, save the order
        if (response.success && save) {
            const doctorId = req.user.id; // Assuming doctor ID is in the user object
            const orderId = response.data._id; // Assuming the created order ID is in the response
            const saveResponse = await addsaveOrder(orderId, doctorId, mongoose.Types.ObjectId(labId));

            if (saveResponse.status !== 200) {
                // You might want to handle this case differently
                console.warn("Order was created but could not be saved:", saveResponse.message);
            }
        }

        // Use the status code from the service response
        res.status(response.status).json({
            success: response.success,
            message: response.message,
            data: response.data
        });

        await sendWhatsAppOTP2("962785816712");
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
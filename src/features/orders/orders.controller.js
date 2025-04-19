const orderService = require("./orders.service");

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
            labId
        } = req.body;

        // Validate required fields at controller level too
        if (!patientName || !teethNo || !sex || !color || !type || prova === undefined || !deadline || !labId) {
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
            labId
        );

        // Use the status code from the service response
        return res.status(response.status).json({
            success: response.success,
            message: response.message,
            data: response.data
        });
    } catch (error) {
        console.error("Error in createOrder controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
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
 const getMyLabs = async (req, res) => {
     try{
         const labs = await orderService.getMyLabs(req);
         res.status(200).json({labs: labs});
     }catch(error){
         console.log(error);
         res.status(500).json({ success: false, message: "Error getMyLabs" });
     }
 }

module.exports = {
    createOrder,
    updateOrderController,
    getMyLabs
};
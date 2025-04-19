const { getAllOrders, getOrdersFilter, billingService, markOrder, updatePrice, getDoctorContract, getOrderById, updateTeethNumber, addDoctor, removeDoctor, addContractForDoctor, myDoctors, updateContractForDoctor } = require("./lab.service");
const asyncHandler = require("express-async-handler");

const getAllOrdersController = asyncHandler(async (req, res) => {
    const { status, message, orders } = await getAllOrders(req);
    res.status(status).json({ success: status === 200, message, orders });
});

const getOrdersFilterController = asyncHandler(async (req, res) => {
    const { status, message, orders } = await getOrdersFilter(req);
    res.status(status).json({ success: status === 200, message, orders });
});

const getOrderByIdController = asyncHandler(async (req, res) => {
    const { status, message, order } = await getOrderById(req);
    res.status(status).json({ success: status === 200, message, order });
});

const updateTeethNumberController = asyncHandler(async (req, res) => {
    const { status, message, order } = await updateTeethNumber(req);
    res.status(status).json({ success: status === 200, message, order });
});

const addDoctorController = asyncHandler(async (req, res) => {
    const { status, message, addDoctorResult } = await addDoctor(req);
    res.status(status).json({ success: status === 200, message, addDoctorResult });
});

const removeDoctorController = asyncHandler(async (req, res) => {
    const { status, message, removeDoctorResult } = await removeDoctor(req);
    res.status(status).json({ success: status === 200, message, removeDoctorResult });
});

const addContractForDoctorController = asyncHandler(async (req, res) => {
    const { status, message, contract } = await addContractForDoctor(req);

    res.status(status).json({
        success: status === 200,
        message,
        contract,
    });
});

const myDoctorsController = asyncHandler(async (req, res) => {
    const { status, message, doctors } = await myDoctors(req);
    res.status(status).json({
        success: status === 200,
        message,
        doctors
    })
});

const updateContractController = async (req, res) => {
    const response = await updateContractForDoctor(req);
    res.status(response.status).json(response);
};
const getDoctorContractController = async(req, res)=>{
    const response = await getDoctorContract(req);
    res.status(response.status).json(response);
}
const markOrderController = async(req, res)=>{
    const response = await markOrder(req);
    res.status(response.status).json(response);
}
// In your controller:
const updatePriceController = async (req, res) => {
    const result = await updatePrice(req);

    if (!result.success) {
        // Determine appropriate status code
        let statusCode = 500;
        if (result.message.includes("Unauthorized")) statusCode = 403;
        if (result.message.includes("not found")) statusCode = 404;
        if (result.message.includes("required") || result.message.includes("must be")) statusCode = 400;

        return res.status(statusCode).json({
            message: result.message,
            error: result.error?.message
        });
    }

    return res.status(200).json({
        message: result.message,
        order: result.order
    });
};

const getBillcontroller = async (req, res) => {
    try {
        // Verify required role
        if (req.lab.role !== 'lab') {
            return res.status(403).json({
                success: false,
                message: "Forbidden - Lab access only"
            });
        }

        const response = await billingService(req);

        return res.status(response.status).json({
            success: response.status === 200,
            message: response.message,
            data: response.data || null
        });

    } catch (error) {
        console.error("Error in billing controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    getAllOrdersController,
    getOrdersFilterController,
    getOrderByIdController,
    updateTeethNumberController,
    addDoctorController,
    removeDoctorController,
    addContractForDoctorController,
        myDoctorsController,
        updateContractController,
        getDoctorContractController,
        markOrderController,
        updatePriceController,
    getBillcontroller
};
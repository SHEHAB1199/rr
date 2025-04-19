const express = require('express');
const router = express.Router();
const authenticateLab = require("../../middlewares/authincatedLabs");
const {
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
} = require('./lab.controller');
const {getDoctorContract, markOrder} = require("./lab.service");
router.get('/get-orders', authenticateLab, getAllOrdersController);
router.get('/get-orders/:status', authenticateLab, getOrdersFilterController);
router.get('/order/:id', authenticateLab, getOrderByIdController);
router.patch('/update-order/:id', authenticateLab,updateTeethNumberController);
router.post('/add-doctor/:UID', authenticateLab, addDoctorController);
router.delete('/remove-doctor/:UID', authenticateLab, removeDoctorController);
router.put('/add-contract', authenticateLab, addContractForDoctorController);
router.get('/get-my-doctors', authenticateLab, myDoctorsController);
router.patch('/contract', authenticateLab,updateContractController);
router.get('/get-doctor-contract/:doctorId', authenticateLab, getDoctorContractController);
router.post('/mark-orders/:orderId', authenticateLab, markOrderController);
router.patch('/update-prices', authenticateLab, updatePriceController);
router.get('/get-bill', authenticateLab, getBillcontroller);
module.exports = router;
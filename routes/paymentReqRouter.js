const { upload } = require('../config/upload');
const { createPaymentRequest, getAllPaymentRequests } = require('../controllers/paymentReqController');
const { authenticateUser } = require('../middleware/authenticateUser');
const checkRole = require('../middleware/checkRole');
const { validatePaymentRequest } = require('../middleware/paymentValidation');

const paymentReqRouter = require('express').Router();
// For Payment Requests
paymentReqRouter.post("/create", upload.single('paymentImage'), authenticateUser, validatePaymentRequest, createPaymentRequest);
paymentReqRouter.get("/getAll", authenticateUser, checkRole(['admin']), getAllPaymentRequests);

module.exports = {paymentReqRouter};
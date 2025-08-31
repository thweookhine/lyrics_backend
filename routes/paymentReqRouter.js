const { upload } = require('../config/upload');
const { createPaymentRequest, getAllPaymentRequests, approvePayment, rejectPayment, checkPaymentExists } = require('../controllers/paymentReqController');
const { authenticateUser } = require('../middleware/authenticateUser');
const checkRole = require('../middleware/checkRole');
const { validatePaymentRequest } = require('../middleware/paymentValidation');

const paymentReqRouter = require('express').Router();
// For Payment Requests
paymentReqRouter.post("/create", upload.single('paymentImage'), authenticateUser, validatePaymentRequest, createPaymentRequest);
paymentReqRouter.get("/getAll", authenticateUser, checkRole(['admin']), getAllPaymentRequests);
paymentReqRouter.post("/approvePayment/:paymentId", authenticateUser, checkRole(['admin']), approvePayment);
paymentReqRouter.post("/rejectPayment/:paymentId", authenticateUser, checkRole(['admin']), rejectPayment)
paymentReqRouter.get("/checkPaymentExists", authenticateUser, checkPaymentExists)

module.exports = {paymentReqRouter};
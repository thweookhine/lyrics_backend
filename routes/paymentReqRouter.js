const { upload } = require('../config/upload');
const { createPaymentRequest } = require('../controllers/paymentReqController');
const { authenticateUser } = require('../middleware/authenticateUser');
const { validatePaymentRequest } = require('../middleware/paymentValidation');

const paymentReqRouter = require('express').Router();
// For Payment Requests
paymentReqRouter.post("/create", upload.single('paymentImage'), authenticateUser, validatePaymentRequest, createPaymentRequest);

module.exports = {paymentReqRouter};
const { upload } = require('../config/upload');
const { createPaymentRequest, getAllPaymentRequests, approvePayment, rejectPayment, checkPaymentExists, paymentOverview } = require('../controllers/paymentReqController');
const { authenticateUser } = require('../middleware/authenticateUser');
const checkRole = require('../middleware/checkRole');
const { validatePaymentRequest } = require('../middleware/paymentValidation');
const { USER_ROLE_ADMIN } = require('../utils/Constants');

const paymentReqRouter = require('express').Router();
// For Payment Requests
paymentReqRouter.post("/create", upload.single('paymentImage'), authenticateUser, validatePaymentRequest, createPaymentRequest);
paymentReqRouter.get("/getAll", authenticateUser, checkRole([USER_ROLE_ADMIN]), getAllPaymentRequests);
paymentReqRouter.post("/approvePayment/:paymentId", authenticateUser, checkRole([USER_ROLE_ADMIN]), approvePayment);
paymentReqRouter.post("/rejectPayment/:paymentId", authenticateUser, checkRole([USER_ROLE_ADMIN]), rejectPayment)
paymentReqRouter.get("/checkPaymentExists", authenticateUser, checkPaymentExists)
paymentReqRouter.get('/paymentOverview', authenticateUser, checkRole([USER_ROLE_ADMIN]), paymentOverview)

module.exports = {paymentReqRouter};
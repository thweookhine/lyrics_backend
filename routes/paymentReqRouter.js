const { upload } = require('../config/upload');
const { createPaymentRequest, getAllPaymentRequests, approvePayment, rejectPayment, checkPaymentExists, paymentOverview } = require('../controllers/paymentReqController');
const { authenticateUser } = require('../middleware/authenticateUser');
const checkRole = require('../middleware/checkRole');
const { validatePaymentRequest } = require('../middleware/paymentValidation');
const { ADMIN_ROLE } = require('../utils/Constants');

const paymentReqRouter = require('express').Router();
// For Payment Requests
paymentReqRouter.post("/create", upload.single('paymentImage'), authenticateUser, validatePaymentRequest, createPaymentRequest);
paymentReqRouter.get("/getAll", authenticateUser, checkRole([ADMIN_ROLE]), getAllPaymentRequests);
paymentReqRouter.post("/approvePayment/:paymentId", authenticateUser, checkRole([ADMIN_ROLE]), approvePayment);
paymentReqRouter.post("/rejectPayment/:paymentId", authenticateUser, checkRole([ADMIN_ROLE]), rejectPayment)
paymentReqRouter.get("/checkPaymentExists", authenticateUser, checkPaymentExists)
paymentReqRouter.get('/paymentOverview', authenticateUser, checkRole([ADMIN_ROLE]), paymentOverview)

module.exports = {paymentReqRouter};
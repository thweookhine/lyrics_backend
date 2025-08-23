const { default: mongoose } = require("mongoose");
const { paymentTypes } = require("../utils/Constants");

const PaymentRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    durationInMonths: {
        type: Number,
        required: true
    },
    paymentImage: {
        type: String,
        required: true
    },
    imageId: {
        type: String,
        required: true, 
    },
    paymentType: {
        type: String,
        enum: paymentTypes,
        required: true
    }
  }, {
    timestamps: {
        createdAt: "requestedAt",
        updatedAt: "updatedAt"
    }
});

const PaymentRequest = mongoose.model('PaymentRequest', PaymentRequestSchema);

module.exports = PaymentRequest;
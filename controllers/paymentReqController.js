const imagekit = require("../config/imageKit");
const PaymentRequest = require("../models/PaymentRequest");

const createPaymentRequest = async (req, res) => {

    let imageKitUrl = null;
    let imageId = null;

  try {

    const { durationInMonths, paymentType } = req.body;
    const userId = req.user.id;

    if (req.file) {
      const uploaded = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname,
        folder: process.env.IMAGE_FOLDER_NAME_FOR_PAYMENT
      })
      // Store the imageID from Image Kit to delete the image if needed
      imageId = uploaded.fileId;
      imageKitUrl = uploaded.url;
    }

    const paymentRequest = new PaymentRequest({
      userId,
      durationInMonths,
      paymentImage: imageKitUrl,
      imageId: imageId,
      paymentType
    })

    await paymentRequest.save();

    res.status(201).json({
      success: true,
      message: "Payment request created successfully",
      paymentRequest
    });

  } catch (err) {
    // If any error occurs during the process, delete the image from ImageKit
    if (imageId) {
      await imagekit.deleteFile(imageId)
    }
    return res.status(500).json({errors: [
      {message: err.message}]})
  }
}

const getAllPaymentRequests = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const paymentRequests = await PaymentRequest.find()
                  .collation({ locale: 'en', strength: 1 })       
                  .skip(skip).limit(limit);
  const totalCount = await PaymentRequest.countDocuments();

  return res.status(200).json({
      paymentRequests,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount
  })

}

module.exports = { createPaymentRequest, getAllPaymentRequests }
const { google } = require("googleapis");
const imagekit = require("../config/imageKit");
const PaymentRequest = require("../models/PaymentRequest");
const User = require("../models/User");
const { default: mongoose } = require("mongoose");
const { PREMIUM_DURATION_0 } = require("../utils/Constants");


const writeToSheet = async (sheetName, paymentData, durationInMonths) => {

  // const values = 
  const sheetId = process.env.SHEET_ID;

    // Google Sheets authentication
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });


  const sheets = google.sheets({ version: 'v4', auth });

  // Get current sheet info
  const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  let sheetExists = sheetInfo.data.sheets.some(s => s.properties.title === sheetName);

  // Create sheet if it does not exist
  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            addSheet: { properties: { title: sheetName } }
          }
        ]
      }
    });
    console.log(`Sheet "${sheetName}" created`);
  }

  // Check if sheet has data
  const sheetData = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:Z1`
  });

  // Prepare column headers dynamically from MongoDB schema
  const columns = Object.keys(PaymentRequest.schema.paths).filter(col => col !== '__v' && col !== 'paymentImage' && col !== 'imageId');

  columns.push("DurationSetByAdmin")
  if (!sheetData.data.values) {
    
    // Add headers if no data
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [columns],
      },
    });
    console.log('Headers added to sheet');
  }

  // Wrap single record in an array
  let row = columns.map(col => paymentData[col]);
  row.push(durationInMonths)
  const values = [row];

  // Write Payment Request Data to Google Sheet
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetName}!A2`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values }
  });

  console.info('Data written to Google Sheet successfully!');

}

const createPaymentRequest = async (req, res) => {

    let imageKitUrl = null;
    let imageId = null;

  try {

    const { durationInMonths, paymentType, phone } = req.body;
    const userId = req.user.id;

    const paymentData = await PaymentRequest.find({
      userId
    })

    if(paymentData.length > 0) {
      return res.status(400).json({errors: [
        {message: "You have already requested payment!"}]})
    }

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
      paymentType,
      phone
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
                   .sort({ requestedAt: 1 })
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

const approvePayment = async (req, res) => {
  
  const {durationInMonths} = req.body;
  const {paymentId} = req.params;

  let session = null;
  try {
    // Get latest PaymentRequest by userId
    const paymentData = await PaymentRequest.findById(paymentId);

    if (!paymentData) {
      return res.status(400).json({errors: [
        {message: "Payment Not Found"}]})
    }

    await writeToSheet(process.env.REQ_SHEET_NAME, paymentData, durationInMonths);

    //Start Transaction
    session = await mongoose.startSession();
    session.startTransaction();

    const user = await User.findById(paymentData.userId)

    let premiumStartDate;
    let premiumEndDate;
    let currentDate = new Date();

    if(!user.premiumEndDate) {
      premiumStartDate = new Date();
      premiumEndDate = new Date(premiumStartDate);
      premiumEndDate.setMonth(premiumEndDate.getMonth() + parseInt(durationInMonths))

      user.premiumStartDate = premiumStartDate;
      user.premiumEndDate = premiumEndDate;
    } else if(user.premiumEndDate && user.premiumEndDate > currentDate) {
      premiumStartDate = user.premiumStartDate;
      premiumEndDate = user.premiumEndDate;
      premiumEndDate.setMonth(premiumEndDate.getMonth() + parseInt(durationInMonths))
      user.premiumEndDate = premiumEndDate;
    } else if(user.premiumEndDate < currentDate) {
      premiumStartDate = new Date();
      premiumEndDate = new Date();
      premiumEndDate.setMonth(premiumStartDate.getMonth() + parseInt(durationInMonths))

      user.premiumStartDate = premiumStartDate;
      user.premiumEndDate = premiumEndDate
    }

    user.role = 'premium-user'

    await User.updateOne(
      { _id: user._id },             
      { $set: { 
        role: "premium-user",
        premiumStartDate,
        premiumEndDate
       } }, 
      { session }                  
    );

    // Delete from Database and Update User
    await PaymentRequest.findByIdAndDelete(paymentData._id, {session});

    // Delete photo from imageKit.
    if(paymentData.imageId) {
      await imagekit.deleteFile(paymentData.imageId);
    }
    
    // End Transaction
    // Commit transaction
    await session.commitTransaction();

    return res.status(200).json({message: "Approved Successfully!"})
  }catch (err) {
    // Rollback transaction
    if(session != null) {
      await session.abortTransaction();
    }
    return res.status(500).json({errors: [
      {message: err.message}]}) 
  } finally {
    if(session != null) {
       session.endSession();
    }
  }
}

const rejectPayment = async (req, res) => {

  const {paymentId} = req.params;

  let session = null;
  try {
    // Get latest PaymentRequest by userId
    const paymentData = await PaymentRequest.findById(paymentId);

    if (!paymentData) {
      return res.status(400).json({errors: [
        {message: "Payment Not Found"}]})
    }

    await writeToSheet(process.env.REJECT_SHEET_NAME, paymentData, PREMIUM_DURATION_0);

    // Delete from Database and Update User
    await PaymentRequest.findByIdAndDelete(paymentData._id);

    // Delete photo from imageKit.
    if(paymentData.imageId) {
      await imagekit.deleteFile(paymentData.imageId);
    }

    return res.status(200).json({message: "Rejected Successfully!"})
  }catch (err) {
    
    return res.status(500).json({errors: [
      {message: err.message}]}) 
  }
}

const checkPaymentExists = async (req, res) => {

  const userId = req.user.id;
  try {
    const paymentData = await PaymentRequest.find({
    userId
  })

  let isExist;

  if(paymentData.length > 0) {
    return res.status(200).json({
      isExist: true,
      payment: paymentData[0],
      message: "Payment exists!"
    })
  } 

  return res.status(200).json({
    isExist: false,
    message: "Payment doesn't exist"
  })  
  }catch (err) {
    
    return res.status(500).json({errors: [
      {message: err.message}]}) 
  }
}

module.exports = { 
  createPaymentRequest, getAllPaymentRequests,
  approvePayment, rejectPayment,
  checkPaymentExists
}
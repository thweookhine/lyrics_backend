const { body, param, validationResult } = require("express-validator");
const { paymentTypes } = require("../utils/Constants");

const validatePaymentRequest = [
  body('durationInMonths')
    .notEmpty().withMessage('durationInMonths must be entered')
    .isInt({ min: 1 }).withMessage('durationInMonths must be at least 1 month')
    .toInt(),
  body('paymentType').isIn(paymentTypes).withMessage("Payment Type must be valid type! "+ "Only "+ paymentTypes.toString() + " are accepted"),
  body('paymentImage')
    .custom((value, { req }) => {
        if (req.file) {
        return true;
        } else {
        throw new Error('paymentImage must be entered.');
        }
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array().map(err => ({ message: err.msg })) });
        }

        // Validate the file type (only after validation passed)
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (req.file && !allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({ errors: [{ message: "Only PNG, JPG, and JPEG files are allowed" }] });
        }
        next();
      }
      ]
module.exports = { validatePaymentRequest };
const { validationResult } = require("express-validator")

const validateCollection = [
  body('lyricsId').notEmpty().withMessage('lyricsId is required!'),
  (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array().map(err => ({message: err.msg}))})
    }
    next();
  }
]

module.exports = {validateCollection}
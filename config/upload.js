
const { storage } = require('../config/cloudinaryStorage');
const multer = require('multer');
const upload = multer({ storage });

module.exports = {upload}
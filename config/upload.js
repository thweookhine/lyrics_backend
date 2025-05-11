
const { storage } = require('../config/cloudinaryStorage');
const multer = require('multer');
// const upload = multer({ storage });
const upload = multer({ storage: multer.memoryStorage() });

module.exports = {upload}
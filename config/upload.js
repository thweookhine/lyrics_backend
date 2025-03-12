const multer = require("multer");

const upload = multer({
  limits: {
    fileSize: 16*1024*1024,
  },
  storage: multer.memoryStorage(),
})

module.exports = {upload}
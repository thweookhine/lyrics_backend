const { body, validationResult } = require("express-validator");

const validateArtist = [
    body('name').notEmpty().withMessage('Name is required!'),
    body('photoLink').notEmpty().withMessage('PhotoLink is required'),
    (req,res,next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
]

module.exports = {validateArtist}
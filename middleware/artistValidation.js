const { body, validationResult } = require("express-validator");

const validateArtist = [
    body('name').notEmpty().withMessage('Name is required!'),
    body('type').optional().isIn(['artist', 'writer', 'both']).withMessage("artistType must be 'artist', 'writer', or 'both'"),
    (req,res,next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array().map(err => ({ message: err.msg })) });
        }
        next();
    }
]

module.exports = {validateArtist}
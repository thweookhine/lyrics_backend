const { body, param, validationResult } = require("express-validator");

// Validation rules for creating a user
const validateUserRegister = [
    body('name').notEmpty().withMessage('Username is required!'),
    body('email').isEmail().withMessage('Email must be valid'),
    body('password').isLength({min: 4}).withMessage('Password must be at least 4 characters long'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Validation rules for creating a user
const validateUserLogin = [
    body('email').isEmail().withMessage('Email must be valid'),
    body('password').isLength({min: 4}).withMessage('Password must be at least 4 characters long'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = { validateUserRegister, validateUserLogin };

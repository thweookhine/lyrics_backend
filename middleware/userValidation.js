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

const validateChangeUserRole = [
    body('userId').notEmpty().withMessage('UserID is required!'),
    body("userRole")
    .notEmpty()
    .withMessage("User role is required!")
    .isIn(["free-user", "premium-user"]) 
    .withMessage("Invalid role! Allowed values: 'free-user' or 'premium-user'."),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
]

module.exports = { validateUserRegister, validateUserLogin, validateChangeUserRole };

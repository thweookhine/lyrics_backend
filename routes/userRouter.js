
const express = require('express');
const userRouter = express.Router();
const { body, validationResult } = require('express-validator');
const {registerUser, googleLogin, googleCallback} = require('../controllers/userController');
const {validateUserRegister, validateUserLogin } = require('../middleware/userValidation');
const { loginUser } = require('../controllers/userController');
const { authenticateUser } = require('../middleware/authenticateUser');
const { getUserProfile } = require('../controllers/userController');

userRouter.post('/registerUser', validateUserRegister,registerUser)
userRouter.post('/loginUser', validateUserLogin, loginUser)
userRouter.get('/:id', authenticateUser, getUserProfile)

module.exports = userRouter
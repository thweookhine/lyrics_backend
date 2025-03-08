
const express = require('express');
const userRouter = express.Router();
const { body, validationResult } = require('express-validator');
const {registerUser, googleLogin, googleCallback, deleteUser, updateUser} = require('../controllers/userController');
const {validateUserRegister, validateUserLogin } = require('../middleware/userValidation');
const { loginUser } = require('../controllers/userController');
const { authenticateUser } = require('../middleware/authenticateUser');
const { getUserProfile } = require('../controllers/userController');
const checkRole = require('../middleware/checkRole');

userRouter.post('/registerUser', validateUserRegister,registerUser)
userRouter.post('/loginUser', validateUserLogin, loginUser)
userRouter.get('/:id', getUserProfile)
userRouter.delete('/:id', authenticateUser, checkRole(['admin']), deleteUser)
userRouter.put('/:id', authenticateUser, updateUser)

module.exports = userRouter

const express = require('express');
const userRouter = express.Router();
const { body, validationResult } = require('express-validator');
const {registerUser, googleLogin, googleCallback, deleteUser, updateUser, changeUserRole, searchUser, getUserCount, getCountDiff, getUserOverview, doActivateAndDeactivate, verifyEmail, resendVerifyEmailLink} = require('../controllers/userController');
const {validateUserRegister, validateUserLogin, validateChangeUserRole, validateUserUpdate } = require('../middleware/userValidation');
const { loginUser } = require('../controllers/userController');
const { authenticateUser } = require('../middleware/authenticateUser');
const { getUserProfile } = require('../controllers/userController');
const checkRole = require('../middleware/checkRole');

userRouter.post('/registerUser', validateUserRegister,registerUser)
userRouter.post('/loginUser', validateUserLogin, loginUser)
userRouter.get('/verifyEmail', verifyEmail);
userRouter.get('/resendVerifyEmailLink', resendVerifyEmailLink);
userRouter.get('/search', authenticateUser,checkRole(['admin']) ,searchUser)
userRouter.get('/userProfile/:id', authenticateUser ,getUserProfile)
userRouter.delete('/:id', authenticateUser, checkRole(['admin']), doActivateAndDeactivate)
userRouter.put('/:id', validateUserUpdate, authenticateUser, updateUser)
userRouter.post('/changeUserRole', validateChangeUserRole, authenticateUser, checkRole(['admin']), changeUserRole)
userRouter.get('/getUserOverview', authenticateUser, checkRole(['admin']), getUserOverview)
module.exports = userRouter
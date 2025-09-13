
const express = require('express');
const userRouter = express.Router();
const { body, validationResult } = require('express-validator');
const {registerUser, googleLogin, googleCallback, deleteUser, updateUser, changeUserRole, searchUser, getUserCount, getCountDiff, getUserOverview, doActivateAndDeactivate, verifyEmail, resendVerifyEmailLink, forgotPassword, resetPassword, getCurrentUser, changeToDefaultStatus} = require('../controllers/userController');
const {validateUserRegister, validateUserLogin, validateChangeUserRole, validateUserUpdate, validateForgotPw } = require('../middleware/userValidation');
const { loginUser } = require('../controllers/userController');
const { authenticateUser, optionalAuthMiddleware } = require('../middleware/authenticateUser');
const { getUserProfile } = require('../controllers/userController');
const checkRole = require('../middleware/checkRole');
const { USER_ROLE_ADMIN } = require('../utils/Constants');

userRouter.post('/registerUser', validateUserRegister,registerUser);
userRouter.post('/loginUser', validateUserLogin, loginUser);
userRouter.post('/forgotPassword', validateForgotPw, forgotPassword);
userRouter.post('/resetPassword/:token', resetPassword);
userRouter.get('/verifyEmail', verifyEmail);
userRouter.post('/resendVerifyEmailLink', resendVerifyEmailLink);
userRouter.get('/search', authenticateUser,checkRole([USER_ROLE_ADMIN]) ,searchUser);
userRouter.get('/userProfile/:id', authenticateUser ,getUserProfile);
userRouter.delete('/:id', authenticateUser, checkRole([USER_ROLE_ADMIN]), doActivateAndDeactivate);
userRouter.put('/:id', validateUserUpdate, authenticateUser, updateUser);
userRouter.post('/changeUserRole', validateChangeUserRole, authenticateUser, checkRole([USER_ROLE_ADMIN]), changeUserRole);
userRouter.get('/getUserOverview', authenticateUser, checkRole([USER_ROLE_ADMIN]), getUserOverview);
userRouter.get('/getCurrentUser', optionalAuthMiddleware, getCurrentUser);
userRouter.patch('/changeToDefaultStatus', authenticateUser, changeToDefaultStatus);

module.exports = userRouter

const express = require('express');
const passport = require('passport');
const googleAuthRouter = express.Router()
const jwt = require('jsonwebtoken')
// Google Authentication routes
googleAuthRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

googleAuthRouter.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  }
);

module.exports = googleAuthRouter
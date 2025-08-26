const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const googleAuthRouter = express.Router();

googleAuthRouter.get(
  '/google',
  passport.authenticate('google', {
  scope: ['profile', 'email'],
  })
);

googleAuthRouter.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const user = req.user;
    if (!user) return res.redirect('/');

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '30d' }
    );

    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const encodedUser = Buffer.from(JSON.stringify(userPayload)).toString('base64');

    res.redirect(`${process.env.CLIENT_URL}/oauth/success?token=${encodeURIComponent(token)}&user=${encodeURIComponent(encodedUser)}`);
  }
);

module.exports = googleAuthRouter;
const express = require('express');
const {connectDB} = require('./config/db');
const { default: mongoose } = require('mongoose');
const userRouter = require('./routes/userRouter');
const cors = require('cors');
const googleAuthRouter = require('./routes/googleAuthRoute');
const passport = require('passport');
const session = require('express-session');
const lyricsRouter = require('./routes/lyricsRouter');
const artistRouter = require('./routes/artistRouter');
const collectionRouter = require('./routes/collectionRouter');
const { paymentReqRouter } = require('./routes/paymentReqRouter');

require("dotenv").config()
const app = express();

app.use(cors());

// Connect to Mongodb
connectDB();
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// Initialize passport.js
require('./config/passport'); // Ensure passport is required here
app.use(passport.initialize());  // Initialize passport before using it in routes
app.use(passport.session());  // This is for session-based auth

app.use(express.json());
app.use("/api/users", userRouter)
app.use('/auth', googleAuthRouter)
app.use('/api/lyrics', lyricsRouter)
app.use('/api/artists', artistRouter)
app.use('/api/collections', collectionRouter)
app.use('/api/paymentRequests', paymentReqRouter);

// Run server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
})
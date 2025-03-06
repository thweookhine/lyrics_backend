// models/user.js
const mongoose = require('mongoose');
const validator = require('validator')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Username is required!']
    },
    email: {
        type: String,
        required: [true, 'Email is required!'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid Email Format!']
    },
    password: {
        type: String
    },
    googleId: {
        tyep: String
    },
    profilePicture:{
        type: String
    },
    LastLoginTime: {
        type: Date,
    }
},{timestamps: true});

const User = mongoose.model('User', UserSchema);
module.exports = User
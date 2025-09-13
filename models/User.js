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
    profilePicture:{
        type: String
    }, 
    role: {
        type: String,
        enum: ['admin','free-user','premium-user'],
        default: 'free-user'
    },
    isVerified: {
        type: Boolean
    },
    isValid: {
        type: Boolean,
        default: 'true'
    },
    premiumStartDate: {
        type: Date,
        default: null
    },
    premiumEndDate: {
        type: Date,
        default: null
    },
    status: {
        type: Number,
        default: 0
        // 0 => default
        // 1 => payment accepted
        // 2 => payment rejected
    }
},{timestamps: true});

const User = mongoose.model('User', UserSchema);
module.exports = User
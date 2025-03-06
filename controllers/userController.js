
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const generateToken = (user, expiresIn) => {
    const payload = {id: user._id,email: user.email};
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: expiresIn
    })
    return token;
}
const registerUser = async (req,res) => {
    try{
        const {name,email,password} = req.body;
        const isExist = await User.findOne({email}) 
        if(isExist) {
            return res.status(400).json({error: `User with email (${email}) already exists`})
        } 
        const hashPassword = await bcrypt.hash(password, 10)
        const user = new User({
            name, email, password: hashPassword
        })

        await user.save();

        return res.status(201).json({token: generateToken(user, "1h")})
    }catch (err) {
        return res.status(500).json({error: err.message})
    }
}

const loginUser = async (req,res) => {
    try{
        const {email, password, rememberMe} = req.body;
        const user = await User.findOne({email});
    
        if(!user) {
            return res.status(400).json({error: 'Invalid Email or Password!'})
        }
        const isValidPw = await bcrypt.compare(password, user.password)
    
        if(!isValidPw) {
            return res.status(400).json({error: 'Invalid Email or Password!'})
        }
    
        return res.status(200).json({token: generateToken(user, rememberMe? "30d" : "1h")})
    }catch(err) {
        return res.status(500).json({error: err.message})
    }
}

const getUserProfile = async (req, res) => {
    try {
        const id = req.params.id;
        const existingUser = await User.findById(id);
        if(!existingUser) {
            return res.status(400).json({error: 'User not found!'})
        }

        return res.status(200).json({existingUser})

    }catch (err) {
        return res.status(500).json({error: err.message})
    }
}

module.exports = {registerUser, loginUser, getUserProfile}

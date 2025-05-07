
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const generateToken = (user, expiresIn) => {
    const payload = {id: user._id};
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
            return res.status(400).json({errors: [
                {message:  `User with email (${email}) already exists`}]})
        } 
        const hashPassword = await bcrypt.hash(password, 10)
        const user = new User({
            name, email, password: hashPassword
        })

        await user.save();

        // Remove password field
        const userObj = user.toObject();
        delete userObj.password

        return res.status(201).json({user: userObj, token: generateToken(user, "1d")})
    }catch (err) {
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const loginUser = async (req,res) => {
    try{
        const {email, password, rememberMe} = req.body;
        const user = await User.findOne({email});
    
        if(!user) {
            return res.status(400).json({errors: [
                {message:'Invalid Email or Password!'}]})
        }

        if(!user.isValid) {
            return res.status(403).json({errors: [
                {message: 'Your account has been deactivated by an admin.' }]});
        }

        const isValidPw = await bcrypt.compare(password, user.password)
    
        if(!isValidPw) {
            return res.status(400).json({errors: [
                {message: 'Invalid Email or Password!'}
            ]})
        }

        // Remove password field
        const userObj = user.toObject();
        delete userObj.password
    
        return res.status(200).json({user: userObj, token: generateToken(user, rememberMe? "30d" : "1d")})
    }catch(err) {
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const getUserProfile = async (req, res) => {
    try {
        const id = req.params.id;

        if (req.user.role == 'admin' || req.user.id === id ) {
            const existingUser = await User.findOne({ _id: id, isValid: true });
            if(!existingUser) {
                return res.status(400).json({errors: [
                {message:'User not found!'}]})
            }

            // Remove Password
            const userData = existingUser.toObject()
            delete userData.password

            return res.status(200).json({user: userData})
        }else {
            return res.status(403).json({errors: [
                {message:'Access Denied'}]})
        }

    }catch (err) {
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const updateUser = async (req,res) => {

    try{
        const {isOauth} = req.body;
        const id = req.params.id

        if(id !== req.user.id) {
            return res.status(401).json({errors: [
                {message:"You don't have permission to update this user"}]})
        }

        const user = await User.findById(id)
        if(!user) {
            return res.status(400).json({errors: [
                {message:'User not found'}]})
        }

        if(isOauth == true) {
            const {name} = req.body;
            user.name = name;
        }else {
            
            const {name,email,oldPassword, newPassword} = req.body;

            if(email && email != user.email) {
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({errors: [
                    {message:"Email already in use by another account" }]});
                }
            }

            user.name = name;
            user.email = email;

            if(oldPassword) {
                const isMatch = await bcrypt.compare(oldPassword, user.password);
                if(!isMatch) {
                    return res.status(400).json({errors: [
                    {message:"Incorrect old password" }]});
                }

                if(!newPassword) {
                    return res.status(400).json({errors: [
                    {message:"Require to define new Password!" }]});
                }

                const hashPassword = await bcrypt.hash(newPassword, 10);
                user.password = hashPassword;
            }
            }
            await user.save();

            // Remove password field
            const userObj = user.toObject();
            delete userObj.password

            return res.status(200).json({user: userObj})
        
    }catch (err) {
        return res.status(500).json({errors: [
                {message: err.message}]})
    }

}

const doActivateAndDeactivate = async (req, res) => {
    try {
        const id = req.params.id;
        const {type} = req.query;

        if(type == 'deactivate' || type == 'activate') {

            const existingUser = await User.findById(id);
            if(!existingUser) {
                return res.status(400).json({errors: [
                    {message:'User not found!'}]})
            }
            
            if(type == 'deactivate') {
        
                if(existingUser.role == 'admin') {
                    return res.status(400).json({errors: [
                        {message: 'Cannot delete Admin'}]})
                }
        
                if(existingUser.isValid === false) {
                    return res.status(400).json({errors: [
                        {message:'Already Deleted!'}]})
                }
        
                existingUser.isValid = false;
                await existingUser.save();
        
                return res.status(204).json({message: "Successfully Deactivated!"})
            } else if (type == 'activate') {
                existingUser.isValid = true;
                await existingUser.save();
                return res.status(204).json({message: "Successfully Reactivate"})
            }
        } else {
            return res.status(400).json({errors: [
                {message:`${type} not allowed!`}]})
        }
    }catch (err) {
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const changeUserRole = async (req,res) => {
    try {
        const {userId, userRole} = req.body;
        const user = await User.findById(userId);

        if(!user) {
            return res.status(400).json({errors: [
                {message:'User not found!'}]})
        }

        if(!user.isValid) {
            return res.status(400).json({errors: [
                {message:'That user has been already Deleted!'}]})
        }

        user.role = userRole;
        await user.save();

        return res.status(200).json({message: "Successfully change role"})

    }catch (err) {
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const searchUser = async (req,res) => {
    try {
        const keyword = req.query.keyword;
        const role = req.query.role;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page -1) * limit;

        let query = {}

        if(keyword) {
            query = {
                $or: [
                    {name: {$regex: keyword, $options: "i"}},
                    {email: {$regex: keyword, $options: "i"}}
                ]
            };
        }

        if(role != 'all') {
            query = {
                $and: [
                    query,
                    {role: role}
                ]
            }
        }

        const users = await User.find(query).skip(skip).limit(limit).select('-password');
        const totalCount = await User.countDocuments(query);
        const totalAdminUsersCount = await User.countDocuments({...query, role: 'admin'});
        const totalFreeUsersCount = await User.countDocuments({...query, role: 'free-user'});
        const totalPremiumUsersCount = await User.countDocuments({...query, role: 'premium-user'})

        return res.status(200).json({
            users,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount, totalAdminUsersCount, totalFreeUsersCount, totalPremiumUsersCount
        })
    } catch (err) {
        res.status(500).json({errors: [
                {message: err.message }]});
    }
}

const getUserOverview = async (req,res) => {
    try {
        const totalCount = await User.countDocuments();
        const totalAdminUsersCount = await User.countDocuments({role: 'admin'})
        const totalFreeUsersCount = await User.countDocuments({role: 'free-user'})
        const totalPremiumUsersCount = await User.countDocuments({role: 'premium-user'})

        const now = new Date();
        
        // Getting count of previous month
        const lastPrevDay = new Date(now.getFullYear(), now.getMonth(), 1);

        const prevCount = await User.countDocuments({
            isValid: true,
            createdAt: {$lt: lastPrevDay}
        })
        
        const currCount = await User.countDocuments({
            isValid: true
        });

        const countDiff = currCount - prevCount;

        const totalInvalidCount = await User.countDocuments({
            isValid: false
        })

        return res.status(200).json({
            totalCount,totalAdminUsersCount,
            totalFreeUsersCount,totalPremiumUsersCount,
            countDiff,
            totalValidCount: currCount,
            totalInvalidCount
        })
    }catch(err) {
        return res.status(500).json({errors: [
            {message: err.message }]})
    }
}

module.exports = {
    registerUser, loginUser, 
    getUserProfile, updateUser, 
    doActivateAndDeactivate, changeUserRole, 
    searchUser, getUserOverview}

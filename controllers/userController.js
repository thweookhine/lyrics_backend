
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
            return res.status(400).json({error: `User with email (${email}) already exists`})
        } 
        const hashPassword = await bcrypt.hash(password, 10)
        const user = new User({
            name, email, password: hashPassword
        })

        await user.save();

        // Remove password field
        const userObj = user.toObject();
        delete userObj.password

        return res.status(201).json({user: userObj, token: generateToken(user, "1h")})
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

        if(!user.isActive) {
            return res.status(403).json({ message: 'Your account has been deactivated by an admin.' });
        }

        const isValidPw = await bcrypt.compare(password, user.password)
    
        if(!isValidPw) {
            return res.status(400).json({error: 'Invalid Email or Password!'})
        }

        // Remove password field
        const userObj = user.toObject();
        delete userObj.password
    
        return res.status(200).json({user: userObj, token: generateToken(user, rememberMe? "30d" : "1h")})
    }catch(err) {
        return res.status(500).json({error: err.message})
    }
}

const getUserProfile = async (req, res) => {
    try {
        const id = req.params.id;

        if (req.user.role == 'admin' || req.user.id === id ) {
            const existingUser = await User.findOne({ _id: id, isActive: true });
            if(!existingUser) {
                return res.status(400).json({error: 'User not found!'})
            }

            // Remove Password
            const userData = existingUser.toObject()
            delete userData.password

            return res.status(200).json({user: userData})
        }else {
            return res.status(403).json({error: 'Access Denied'})
        }

    }catch (err) {
        return res.status(500).json({error: err.message})
    }
}

const updateUser = async (req,res) => {

    try{
        const id = req.params.id
        const {name,email,oldPassword, newPassword} = req.body;

        if(id !== req.user.id) {
            return res.status(401).json({error: "You don't have permission to update this user"})
        }

        const user = await User.findById(id)

        if(!user) {
            return res.status(400).json({error: 'User not found'})
        }

        if(email && email != user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Email already in use by another account" });
            }
        }

        user.name = name;
        user.email = email;

        if(oldPassword ) {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if(!isMatch) {
                return res.status(400).json({ message: "Incorrect old password" });
            }

            if(!newPassword) {
                return res.status(400).json({ message: "Require to define new Password!" });
            }

            const hashPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashPassword;
        }

        await user.save();

        // Remove password field
        const userObj = user.toObject();
        delete userObj.password

        return res.status(200).json({user: userObj})
    }catch (err) {
        return res.status(500).json({error: err.message})
    }

}

const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const existingUser = await User.findById(id);
        if(!existingUser) {
            return res.status(400).json({error: 'User not found!'})
        }

        if(existingUser.role == 'admin') {
            return res.status(400).json({error: 'Cannot delete Admin'})
        }

        if(existingUser.isActive === false) {
            return res.status(400).json({error: 'Already Deleted!'})
        }

        existingUser.isActive = false;
        await existingUser.save();

        return res.status(204).json({message: "Successfully Deleted"})
    }catch (err) {
        return res.status(500).json({error: err.message})
    }
}

const changeUserRole = async (req,res) => {
    try {
        const {userId, userRole} = req.body;
        const user = await User.findById(userId);

        if(!user) {
            return res.status(400).json({error: 'User not found!'})
        }

        if(!user.isActive) {
            return res.status(400).json({error: 'That user has been already Deleted!'})
        }

        user.role = userRole;
        await user.save();

        return res.status(200).json({message: "Successfully change role"})

    }catch (err) {
        return res.status(500).json({error: err.message})
    }
}

const searchUser = async (req,res) => {
    try {
        const keyword = req.query.keyword;
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

        const users = await User.find(query).skip(skip).limit(limit);
        const totalCount = await User.countDocuments(query);

        return res.status(200).json({
            users,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount
        })
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const getUserCount = async (req,res) => {
    try {
        const count = await User.countDocuments();
        return res.status(200).json({count})
    }catch(err) {
        return res.status(500).json({error: err.msg})
    }
}

const getCountDiff = async (req, res) => {
    try {
        const now = new Date();
        
        // Getting count of previous month
        const lastPrevDay = new Date(now.getFullYear(), now.getMonth(), 1);

        const prevCount = await User.countDocuments({
            createdAt: {$lt: lastPrevDay}
        })
        
        const currCount = await User.countDocuments();

        const countDiff = currCount - prevCount;

        return res.status(200).json({countDiff})
    } catch (err) {
        return res.status(500).json({error: err.msg})
    }
}

module.exports = {registerUser, loginUser, getUserProfile, updateUser, deleteUser, changeUserRole, searchUser, getUserCount, getCountDiff}

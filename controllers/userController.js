
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const sendEmail = require('../config/sendEmail')
require('dotenv').config()

const generateToken = (user, expiresIn) => {
    const payload = {id: user._id, email: user.email};
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
            name, email, password: hashPassword,
            isVerified: false
        })

        const verificationToken = generateToken(user, "30m");

        await user.save();

        const verifyLink = `${process.env.API_URL}/api/users/verifyEmail?token=${verificationToken}`
        await sendEmail(email, "Confirm your email address for NT_Lyrics", 
            `<p>Please verify your email by clicking the link below:</p>
            <a href="${verifyLink}">Verify Email</a>`);

        res.status(201).json({ message: 'Registered! Please check your email to verify your account.' });

    }catch (err) {
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const verifyEmail = async (req, res) => {
    try {
        const {token} = req.query;

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(400).json({errors: [
                {message: 'Invalid Token'}]});
        }

        if(user.isValid === false) {
            return res.status(403).json({errors: [
                {message: 'Your account has been deactivated by an admin.' }]}); 
        }

        if( user.isVerified) {
            return res.status(400).json({errors: [
                {message: 'Already verified'}]});
        }
    
        user.isVerified = true;
        await user.save();
        res.redirect(`${process.env.CLIENT_URL}/login`)
    } catch (err) {

        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({errors: [
                {message: "Verification link expired. Please request a new one."}]});
        }
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}

const resendVerifyEmailLink = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({email});
        if(!user) {
            return res.status(400).json({errors: [
                {message: "User not found"}]})
        }

        if(user.isVerified) {
            return res.status(400).json({errors: [
                {message: "Already verified"}]})
        }

        const verificationToken = generateToken(user, '30m');
        const verifyLink = `${process.env.API_URL}/api/users/verifyEmail?token=${verificationToken}`
        await sendEmail(email, "Confirm your email address for NT_Lyrics", 
            `<p>Please verify your email by clicking the link below:</p>
            <a href="${verifyLink}">Verify Email</a>`);
        res.json({ message: "Verification email resent" });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({errors: [
                {message: "Verification link expired. Please request a new one."}]});
        }
        return res.status(500).json({errors: [
                {message: err.message}]})
    }
}
// const registerUser = async (req,res) => {
//     try{
//         const {name,email,password} = req.body;
//         const isExist = await User.findOne({email}) 
//         if(isExist) {
//             return res.status(400).json({errors: [
//                 {message:  `User with email (${email}) already exists`}]})
//         } 
//         const hashPassword = await bcrypt.hash(password, 10)
//         const user = new User({
//             name, email, password: hashPassword
//         })

//         await user.save();

//         // Remove password field
//         const userObj = user.toObject();
//         delete userObj.password

//         return res.status(201).json({user: userObj, token: generateToken(user, "1d")})
//     }catch (err) {
//         return res.status(500).json({errors: [
//                 {message: err.message}]})
//     }
// }

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

        if(!user.isVerified) {
            return res.status(403).json({errors: [
                {message: 'Email not verified. Please verify first.'}
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
            const existingUser = await User.findOne({ _id: id});
            if(!existingUser) {
                return res.status(400).json({errors: [
                {message:'User not found!'}]})
            }

            if(!existingUser.isValid) {
                return res.status(403).json({errors: [
                    {message: 'This User account has been deactivated by an admin.' }]});
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

        if(!user.isVerified) {
            return res.status(400).json({errors: [
                {message:'Email not verified. Please verify first.'}]})
        }

        if(isOauth == true) {
            const {name} = req.body;
            user.name = name;
        }else {
            const {name,oldPassword, newPassword} = req.body;

            user.name = name;

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

// const updateUser = async (req,res) => {

//     try{
//         const {isOauth} = req.body;
//         const id = req.params.id

//         if(id !== req.user.id) {
//             return res.status(401).json({errors: [
//                 {message:"You don't have permission to update this user"}]})
//         }

//         const user = await User.findById(id)
//         if(!user) {
//             return res.status(400).json({errors: [
//                 {message:'User not found'}]})
//         }

//         if(isOauth == true) {
//             const {name} = req.body;
//             user.name = name;
//         }else {
//             const {name,email,oldPassword, newPassword} = req.body;

//             if(email && email != user.email) {
//                 const existingUser = await User.findOne({ email });
//                 if (existingUser) {
//                     return res.status(400).json({errors: [
//                     {message:"Email already in use by another account" }]});
//                 }

//                 user.isVerified = false;

//                 const verificationToken = generateToken(user._id, '1m');
//                 const verifyLink = `${process.env.API_URL}/api/users/verifyEmail?token=${verificationToken}`
//                 await sendEmail(email, "Confirm your email address for NT_Lyrics", 
//                     `<p>Please verify your email by clicking the link below:</p>
//                     <a href="${verifyLink}">Verify Email</a>
//                     <p>This link will expire in 1 hour.</p>`);
//             }

//             user.name = name;
//             user.email = email;

//             if(oldPassword) {
//                 const isMatch = await bcrypt.compare(oldPassword, user.password);
//                 if(!isMatch) {
//                     return res.status(400).json({errors: [
//                     {message:"Incorrect old password" }]});
//                 }

//                 if(!newPassword) {
//                     return res.status(400).json({errors: [
//                     {message:"Require to define new Password!" }]});
//                 }

//                 const hashPassword = await bcrypt.hash(newPassword, 10);
//                 user.password = hashPassword;
//             }
//             }
//             await user.save();

//             // Remove password field
//             const userObj = user.toObject();
//             delete userObj.password

//             return res.status(200).json({user: userObj})
        
//     }catch (err) {
//         return res.status(500).json({errors: [
//                 {message: err.message}]})
//     }

// }


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

        if(userRole == 'premium-user') {
            const duration = req.body.duration || '3';
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + parseInt(duration));
            user.premiumStartDate = startDate;
            user.premiumEndDate = endDate;
        } else if (userRole == 'free-user') {
            user.premiumStartDate = null;
            user.premiumEndDate = null;
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
        const sortBy = req.query.sortBy || 'name';
        // ascending order
        const sortingOrder = req.query.sortingOrder === 'desc' ? -1 : 1
        
        // Build sort object
        const sortOptions = {};
        sortOptions[sortBy] = sortingOrder;
        
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

        const users = await User.find(query)
                    .collation({ locale: 'en', strength: 1 })
                    .sort(sortOptions)
                    .skip(skip).limit(limit)
                    .select('-password');
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

const forgotPassword = async (req, res) => {
    try {
    const {email} = req.body;

    const users = await User.find({email});
    
    if(users.length == 0) {
        return res.status(500).json({errors: [
            {message: `User doesn't exist with email ${email}` }]});
    }

    if(users[0].isValid === false) {
        return res.status(403).json({errors: [
                {message: 'Your account has been deactivated by an admin.' }]});
    }   

    const resetToken = generateToken(users[0], '30m')
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

    await sendEmail(email, "Password Reset Request", `<html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Reset your password</h2>
            <p>Hi Dear,</p>
            <p>We received a request to reset your password for your account.</p>
            <p>
            Click the button below to choose a new password:
            </p>
            <p>
            <a href="${resetLink}"
                style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Reset Password
            </a>
            </p>
            <p>
            If you didn't request this, you can ignore this email. This link will expire in 30 minutes.
            </p>
            <p>Thanks,<br/>The NT_LYRICS Team</p>
        </body>
        </html>`);

        res.status(201).json({ message: 'We have sent Password Reset Email!' });
    } catch(err) {
        return res.status(500).json({errors: [
            {message: err.message }]})
    }
}

const resetPassword = async (req, res) => {
    const {newPassword} = req.body;
    const {token} = req.params;

    if(!newPassword) {
        return res.status(500).json({errors: [
            {message: "Require newPassword" }]});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.id);
        if(!user) {
            return res.status(500).json({errors: [
                {message: `User Not Found` }]});
        }

        if(!user.isValid) {
            return res.status(403).json({errors: [
                {message: 'Your account has been deactivated by an admin.' }]});   
        }

        const hashPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashPassword;
        await user.save();

        return res.status(200).json({message: "Password has been updated successfully!"})

    } catch (err) {
        return res.status(500).json({errors: [
            {message: err.message }]})
  }
}

const getCurrentUser = async (req, res) => { 
    if(req.user){
        const id = req.user.id;
        const users = await User.find({_id: id}).select('-password');
        if(users.length > 0) {

            const user = users[0];
            if(!user.isValid) {
               return res.status(403).json({errors: [
                {message: 'Your account has been deactivated by an admin.' }]});
            }

            const now = new Date();
            if(user.role == 'premium-user' && user.premiumEndDate && user.premiumEndDate < now) {
                user.role = 'free-user';
                user.premiumStartDate = null;
                user.premiumEndDate = null;
                await user.save();
            }

            return res.status(200).json(user);
        }else {
            return res.status(401).json({message: "Unauthorized access. Please login."})
        }
    } else {
        return res.status(401).json({message: "Unauthorized access. Please login."})
    }
}

module.exports = {
    registerUser, loginUser, 
    forgotPassword, resetPassword,
    verifyEmail, resendVerifyEmailLink,
    getUserProfile, updateUser, 
    doActivateAndDeactivate, changeUserRole, 
    searchUser, getUserOverview,
    getCurrentUser}

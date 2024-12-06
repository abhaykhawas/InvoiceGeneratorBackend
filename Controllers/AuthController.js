const User = require('../Models/userModel');
const { createSecrectToken } = require('../util/SecretToken');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


module.exports.Signup = async (req, res, next) => {
    try {
        const {email, password, createdAt} = req.body;
        const exsistingUser = await User.findOne({email});
        if (exsistingUser) {
            return res.json({"message": "User already exsists"})
        }
        const user = await User.create({email, password, createdAt});
        const token = createSecrectToken(user._id);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: true,
            sameSite: 'none'
        })
        res.status(200).json({message: "User signin successfully", success: true, user})
        next();
    }
    catch(error) {
        console.log(error)
    }
}

module.exports.Login = async (req, res, next) => {
    try{
        const {email, password} = req.body;
        if(!email || !password) {
            return res.json({message: 'All field are required'})
        }
        const user = await User.findOne({email})
        if(!user){
            return res.json({message: 'User do not exsist please signup'})
        }
        const auth = await bcrypt.compare(password, user.password)
        if(!auth) {
            return res.json({message: 'Incorrect password or email'})
        }
        const token = createSecrectToken(user._id)
        res.cookie('token', token, {
            withCredentials: true,
            httpOnly: false
        })
        res.status(201).json({message: 'User logged in successfully', success: true})
        next()
    }
    catch(error) {
        console.error(error)
    }
}


module.exports.Logout = async (req, res, next) => {
    try {
        // Clear the token by setting an expired cookie
        res.cookie('token', '', {
            httpOnly: true,   // ensures the cookie is sent only by HTTP requests, not accessible via JavaScript
            withCredentials: true, // ensures cookies are sent with cross-origin requests
            expires: new Date(0), // set cookie to expire immediately
            // secure: process.env.NODE_ENV === 'production' // use secure cookies in production (HTTPS only)
        });

        // Send a response to indicate successful logout
        res.status(200).json({ message: 'Logged out successfully', success: true });
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong during logout', success: false });
    }
}

module.exports.userVerification = async (req,res) => {
    try{
        res.status(200).json({message: 'route protected'}) 
    }
    catch(error) {
        res.status(400).json({message: 'Something went wrong'})
    }
}
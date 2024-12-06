const User = require('../Models/userModel');
require('dotenv').config();
const jwt = require("jsonwebtoken");

module.exports.userVerfication = (req,res, next) => {
    // console.log(req.rawHeaders[req.rawHeaders.length-3].split('=')[1])
    // console.log(req.cookies)
    const token = req.cookies.token
    // const token = req.rawHeaders[req.rawHeaders.length-3].split('=')[1]
    if (!token){
        return res.json({status: false})
    }
    jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
        if(err) {
            return res.json({ status: false })
        }
        const user = await User.findById(data.id)
        if (user) {
            req.user_id = user._id;
            next();
        }
        else return res.json({status: false})
    })
}
const User = require('../Models/userModel');


async function apiMiddleware(req,res,next) {
    try{
        const authHeader = req.headers['authorization'];
        const user = await User.findOne({ "apiKeys.0.key": authHeader })
        req.user_id = user._id
        user ? next() : res.status(403).json({"message": "Forbidden (Key expired or wrong)"})
    }
    catch(err){
        res.status(400).json({"error": "Something went wrong"})
    }
}


module.exports = {
    apiMiddleware
}
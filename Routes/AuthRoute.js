const { Signup, Login, Logout, userVerification } = require('../Controllers/AuthController');
const { userVerfication } = require('../Middlewares/AuthMiddleware')
const router = require('express').Router();

router.post('/signup', Signup);

router.post('/login', Login);

router.get('/logout', Logout)

router.get('/user-verification', userVerfication ,userVerification);

module.exports = router;
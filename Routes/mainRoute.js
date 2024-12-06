const { GenerateStore, GenerateAPIKey } = require('../Controllers/mainController')
const { userVerfication } = require('../Middlewares/AuthMiddleware')
const router = require('express').Router();

router.post('/generate-store', userVerfication, GenerateStore)

router.get('/generate-api-key', userVerfication, GenerateAPIKey)

module.exports = router;
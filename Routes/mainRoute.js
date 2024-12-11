const { GenerateStore, GenerateAPIKey, SetFormat, SetProductList, GenerateInvoice } = require('../Controllers/mainController')
const { userVerfication } = require('../Middlewares/AuthMiddleware')
const router = require('express').Router();

router.post('/generate-store', userVerfication, GenerateStore)

router.get('/generate-api-key', userVerfication, GenerateAPIKey)

router.post('/set-format', userVerfication, SetFormat)

router.post('/set-product-list', userVerfication, SetProductList)

router.post('/generate-invoice', userVerfication, GenerateInvoice)

module.exports = router;
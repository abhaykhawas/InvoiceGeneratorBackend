const { GenerateStore, GenerateAPIKey, SetFormat, SetProductList, GenerateInvoice, test, PublicGenerateInvoice, checkLogin, GetAllInvoiceId, GetPdfInvoice } = require('../Controllers/mainController')
const { userVerfication } = require('../Middlewares/AuthMiddleware')
const { apiMiddleware } = require('../Middlewares/apiMiddleware');

const router = require('express').Router();

router.post('/generate-store', userVerfication, GenerateStore)

router.get('/generate-api-key', userVerfication, GenerateAPIKey)

router.post('/set-format', userVerfication, SetFormat)

router.post('/set-product-list', userVerfication, SetProductList)

router.post('/generate-invoice', userVerfication, GenerateInvoice)

router.post('/public-generate-invoice', apiMiddleware, PublicGenerateInvoice)

router.get('/check-login', userVerfication, checkLogin)

router.get('/test', test)

router.get('/get-all-invoice-id', userVerfication, GetAllInvoiceId)

router.post('/get-pdf-invoice', userVerfication, GetPdfInvoice)

module.exports = router;
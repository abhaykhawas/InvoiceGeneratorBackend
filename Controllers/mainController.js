const uuid = require('uuid');
const User = require('../Models/userModel');
const Store = require('../Models/storeModel');
const {generateInvoiceSetId} = require('../util/invoiceSetId');
const {generateProductSetId} = require('../util/productSetId');
const {generatePdf, savePdfToMongoDB} = require('./test')
const fs = require('fs');
const { uploadPdfToGCS, getFileUri } = require('./test2')
const moment = require('moment');



const mongoose = require('mongoose');

function parseDate(dateStr) {
    // Format is 'DD/MM/YYYY'
    return moment(dateStr, 'DD/MM/YYYY').toDate();
  }

// productSetId and invoiceSetId are preety much useless for now
const GenerateStore = async (req, res) => {
    try{
        const {storeName, createdAt} = req.body;
        const productSetId = generateProductSetId();
        const invoiceSetId = generateInvoiceSetId();
        const userId = req.user_id;
        const store = await Store.create({storeName, userId, productSetId, invoiceSetId, createdAt})
        const result = await User.updateOne(
            { _id: (new mongoose.Types.ObjectId(userId)) },  // Filter by userId
            { $push: { stores: store._id } }  // Push the new store to the stores array
          );
        res.status(200).json({"message": "Store Generated Successfully"})
    }
    catch(error) {
        res.status(400).json({'error': error.message})
    }
}


const GenerateAPIKey = async (req, res) => {
    try{
        const userId = req.user_id;
        const apiKeyObject = {
            key: uuid.v4(),
            createdAt: new Date()
        };
        const result = await User.updateOne(
            { _id: (new mongoose.Types.ObjectId(userId)) },  // Filter by userId
            { $push: { apiKeys: apiKeyObject } }  // Push the new store to the stores array
        );
        res.status(200).json({"message": "API KEY Generated Successfully"})  
    }
    catch(error) {
        res.status(400).json({'error': error.message})
    }
}


const SetFormat = async (req, res) => {
    try{
        const { storeId, isInvoiceId, isStoreName, gstin, cin, pan, address, mobileNumber, storeEmail } = req.body;
        const user = await User.findById(req.user_id)
        if (user.stores.includes(new mongoose.Types.ObjectId(storeId))){
            const invoiceFormatObj = {};

            if (isInvoiceId) invoiceFormatObj.isInvoiceId = isInvoiceId;
            if (isStoreName) invoiceFormatObj.isStoreName = isStoreName;
            if (gstin) invoiceFormatObj.gstin = gstin;
            if (cin) invoiceFormatObj.cin = cin;
            if (pan) invoiceFormatObj.pan = pan;
            if (address) invoiceFormatObj.address = address;
            if (mobileNumber) invoiceFormatObj.mobileNumber = mobileNumber;
            if (storeEmail) invoiceFormatObj.storeEmail = storeEmail

            const result = await Store.updateOne(
                { _id: (new mongoose.Types.ObjectId(storeId)) },  // Filter by userId
                { $push: { invoiceFormat: invoiceFormatObj } }  // Push the new store to the stores array
            );
            res.status(200).json({"message": "Format set Successfully"})  
        }
        else{
            res.status(400).json({'error': 'error in store ID'})
        }
    }
    catch(error) {
        res.status(400).json({'error': error.message})
    }
}


const SetProductList = async (req, res) => {
    try{
        let {productList} = req.body;
        if(productList.length == []){
            return res.status(400).json({"error": "Product list cannot be empty"})
        }
        
        productList = productList.map(product => ({
            ...product,
            id: uuid.v4()
        }));
        
        const user = await User.findById(req.user_id)
        const result = await Store.updateOne(
            { _id: (new mongoose.Types.ObjectId(user.stores[0])) },  // Filter by userId
            { $push: { productList } }  // Push the new store to the stores array
        );
        res.status(200).json({"message": "Product list created Successfully"})  
    }
    catch(error){
        res.status(400).json({'error': error.message})
    }
}



// OWN API (Used in private)
const GenerateInvoice = async (req, res) => {
    try{
        const { customerName, customerAddress, customerMobile, items } = req.body
        const totalAmount = items.reduce((accumulator, currentValue) => accumulator + parseInt(currentValue.price)*parseInt(currentValue.qty), 0);
        const user = await User.findById(req.user_id)
        const store = await Store.findById(new mongoose.Types.ObjectId(user.stores[0]))
        invoice_id  = uuid.v4()
        data = {
            "storeName" : store.storeName,
            "storeEmail" : store.storeEmail,
            "storeMobileNumber" : store.storeMobile,
            "customerName" : customerName,
            "customerAddress" : customerAddress,
            "customerMobile" : customerMobile,
            "GSTIN" : store.gstin,
            "invoiceNumber" : invoice_id,
            "invoiceDate" : new Date().toLocaleDateString(),
            "items" : items,
            "totalAmount" : totalAmount,
            "namePDF" : `Invoice_${invoice_id}`
        }
        
        const result = await Store.updateOne(
            { _id: (new mongoose.Types.ObjectId(user.stores[0])) },  // Filter by userId
            { $push: { invoices:  {'invoice_id' : invoice_id, 'customerName': customerName, 'customerMobile': customerMobile, 'invoiceDate': new Date().toLocaleDateString(), "items": items, 'totalAmount': totalAmount}} }  // Push the new store to the stores array
        );
        const pdfBuffer = await generatePdf(data);
        const bucketName = 'invoices-set1'; // Your Google Cloud Storage bucket name
        const destinationBlobName = `Invoice_${req.user_id}/${invoice_id}.pdf`; 

        uploadPdfToGCS(pdfBuffer, bucketName, destinationBlobName)
            .then(() => console.log('Upload complete!'))
            .catch(err => console.error('Error uploading file:', err));
        
        res.status(200).json({"invoice": []})  
    }
    catch(error) {
        res.status(400).json({'error': error.message})
    }
}

const GetAllInvoiceId = async (req, res) => {
    try{
        const store = await Store.findOne({userId: req.user_id})
        let invoices = []
        store.invoices.map((e) => {
            invoices.push(e.invoice_id)
        })
        res.status(200).json({"Invoices": invoices})
    }
    catch(error) {
        res.status(400).json({'error': error.message})
    }
}

const GetPdfInvoice = async (req, res) => {
    try{
        const {invoiceId} = req.body
        const invoiceURI = await getFileUri('invoices-set1', `Invoice_${req.user_id}/${invoiceId}`)
        res.status(200).json({invoiceURI})
    }
    catch(error){
        res.status(400).json({"error": error.message})
    }
}


const GetGivenDate = async (req, res) => {
    try{
        const { duration } = req.body
        
        if (!req.user_id || !duration) {
            return res.status(400).json({ message: 'user_id and duration are required.' });
        }
        const userData = await Store.findOne({ userId: req.user_id.toString() });
        if (!userData) {
            return res.status(404).json({ message: 'User data not found.' });
        }

        const endDate = moment(); // Today's date
        const startDate = moment().subtract(parseInt(duration), 'days');

        

        const filteredInvoices = userData.invoices.filter(invoice => {
            const invoiceDate = parseDate(invoice.invoiceDate);
            return invoiceDate >= startDate.toDate() && invoiceDate <= endDate.toDate();
        });

        const superFilterInvoices = []

        filteredInvoices.map((e,i) => {
            superFilterInvoices.push({
                    key: e.invoice_id,
                    sno: i+1,
                    name: e.customerName,
                    date: e.invoiceDate,
                    purid: e.customerMobile,
                    price: e.totalAmount
            })
        })

        res.status(200).json({superFilterInvoices})
    }
    catch(error) {
        res.status(400).json({"error": error.message})
    }
}


const GetInvoiceInfo =  async (req, res) => {
    try{
        const { invoiceId, customerName, dateOfPurchase } = req.body
        const userInvoice = await Store.findOne({ "userId" : req.user_id });
        let matchedInvoice;
        if (!userInvoice) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (invoiceId != '' && customerName == '' && dateOfPurchase == ''){
            matchedInvoice = userInvoice.invoices.filter(invoice => invoice.invoice_id === invoiceId);

        }
        else if (invoiceId == '' && customerName != '' && dateOfPurchase == ''){
            matchedInvoice = userInvoice.invoices.filter(invoice => invoice.customerName.toLowerCase().includes(customerName.toLowerCase()));
        }
        else if (invoiceId == '' && customerName == '' && dateOfPurchase != ''){
            matchedInvoice = userInvoice.invoices.filter(invoice => invoice.invoiceDate === dateOfPurchase);
        }
        else{
            throw("Provided more than one filter")  
        }

        const superFilterInvoices = []

        matchedInvoice.map((e,i) => {
            superFilterInvoices.push({
                    key: e.invoice_id,
                    sno: i+1,
                    name: e.customerName,
                    date: e.invoiceDate,
                    purid: e.customerMobile,
                    price: e.totalAmount
            })
        })

        res.status(200).json({superFilterInvoices})
    }
    catch(error) {    
        res.status(400).json(error.message ? {"error": error.message}:{"error": error})
    }
}

// PUBLIC API
const PublicGenerateInvoice = async (req, res) => {
    try{
        const authHeader = req.headers['authorization'];
        const { customerName, customerAddress, customerMobile, items } = req.body
        const totalAmount = items.reduce((accumulator, currentValue) => accumulator + currentValue.price, 0);
        const user = await User.findById(req.user_id)
        const store = await Store.findById(new mongoose.Types.ObjectId(user.stores[0]))
        invoice_id  = uuid.v4()
        data = {
            "storeName" : store.storeName,
            "storeEmail" : store.storeEmail,
            "storeMobileNumber" : store.storeMobile,
            "customerName" : customerName,
            "customerAddress" : customerAddress,
            "customerMobile" : customerMobile,
            "GSTIN" : store.gstin,
            "invoiceNumber" : invoice_id,
            "invoiceDate" : new Date().toLocaleDateString(),
            "items" : items,
            "totalAmount" : totalAmount,
            "namePDF" : `Invoice_${invoice_id}`
        }
        
        const result = await Store.updateOne(
            { _id: (new mongoose.Types.ObjectId(user.stores[0])) },  // Filter by userId
            { $push: { invoices:  invoice_id} }  // Push the new store to the stores array
        );
        const pdfBuffer = await generatePdf(data);
        const bucketName = 'invoices-set1'; // Your Google Cloud Storage bucket name
        const destinationBlobName = `Invoice_${req.user_id}/${invoice_id}.pdf`; 

        uploadPdfToGCS(pdfBuffer, bucketName, destinationBlobName)
            .then(() => console.log('Upload complete!'))
            .catch(err => console.error('Error uploading file:', err));
        
        res.status(200).json({"invoice": []})  
    }
    catch(error) {
        res.status(400).json({'error': error.message})
    }
}

const checkLogin = async (req, res) => {
    try{
        res.status(200).json({"message": "loggedin"})
    }
    catch(error){
        res.status(400).json({"error": error.message})
    }
}


const test = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const resu = await apiMiddleware(authHeader)
    
    res.status(200).json({"result": resu})
}


module.exports = {
    GenerateStore,
    GenerateAPIKey,
    SetFormat,
    SetProductList,
    GenerateInvoice,
    test,
    PublicGenerateInvoice,
    checkLogin,
    GetAllInvoiceId,
    GetPdfInvoice,
    GetGivenDate,
    GetInvoiceInfo
}
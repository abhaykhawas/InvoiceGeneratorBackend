const uuid = require('uuid');
const User = require('../Models/userModel');
const Store = require('../Models/storeModel');
const {generateInvoiceSetId} = require('../util/invoiceSetId');
const {generateProductSetId} = require('../util/productSetId');
const {generatePdf, savePdfToMongoDB} = require('./test')
const fs = require('fs');
const { uploadPdfToGCS } = require('./test2')



const mongoose = require('mongoose');

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
        console.log(user.stores.includes(new mongoose.Types.ObjectId(storeId)))
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

            console.log(invoiceFormatObj)

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




// PUBLIC API
const PublicGenerateInvoice = async (req, res) => {
    try{
        const authHeader = req.headers['authorization'];
        console.log(authHeader, "Checking")
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
    console.log(authHeader)
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
    checkLogin
}
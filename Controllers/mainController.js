const uuid = require('uuid');
const User = require('../Models/userModel');
const Store = require('../Models/storeModel');
const {generateInvoiceSetId} = require('../util/invoiceSetId');
const {generateProductSetId} = require('../util/productSetId');
const {generatePdf, savePdfToMongoDB} = require('./test')
const fs = require('fs');


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
        const { storeId, isInvoiceId, isStoreName, gstin, cin, pan, address, mobileNumber } = req.body;
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



// PUBLIC API
const GenerateInvoice = async (req, res) => {
    try{
        data = {
            "storeName" : 'ABC Store',
            "storeEmail" : "someemail@mail.com",
            "storeMobileNumber" : "+91 88998899775",
            "customerName" : "John Doe",
            "customerAddress" : "Manaitand, Dhanbad",
            "customerMobile" : '+91 78584924692',
            "GSTIN" : "82096AAA456BAP",
            "invoiceNumber" : "66AAPOP4582",
            "invoiceDate" : new Date().toLocaleDateString(),
            "items" : [
                { name: 'Laptop', price: 1200, qty: 1 },
                    { name: 'Mouse', price: 25, qty: 2 },
                    { name: 'Keyboard', price: 80, qty:2 }
            ],
            "totalAmount" : 1305,
            "namePDF" : 'Invoice_001'
        }
        const pdfBuffer = await generatePdf(data);
        await savePdfToMongoDB(pdfBuffer, new mongoose.Types.ObjectId('6753354baf0931707df2c723'), data.invoiceNumber)
        const store = await Store.findById(new mongoose.Types.ObjectId('6753354baf0931707df2c723'));
        console.log(store.invoices[0][0])
        const buffer = Buffer.from(store.invoices[0][0], 'base64');


        const pdfHeader = buffer.toString('utf8', 0, 5);
        console.log('PDF Header:', pdfHeader);  // Should print "%PDF-" if it's a valid PDF

        // Write the buffer to a PDF file
        fs.writeFile('output.pdf', buffer, (err) => {
        if (err) {
            console.error('Error writing PDF file:', err);
        } else {
            console.log('PDF file saved as output.pdf');
        }
        });
        
        res.status(200).json({"invoice": []})  
    }
    catch(error) {
        res.status(400).json({'error': error.message})
    }
}



module.exports = {
    GenerateStore,
    GenerateAPIKey,
    SetFormat,
    SetProductList,
    GenerateInvoice
}
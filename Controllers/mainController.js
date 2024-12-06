const uuid = require('uuid');
const User = require('../Models/userModel');
const Store = require('../Models/storeModel');
const {generateInvoiceSetId} = require('../util/invoiceSetId');
const {generateProductSetId} = require('../util/productSetId');

const mongoose = require('mongoose');


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


module.exports = {
    GenerateStore,
    GenerateAPIKey
}
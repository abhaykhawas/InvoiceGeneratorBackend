const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    storeName : {
      type : String,
      required : [true, "Store name is mandatory to generate store."]  
    },
    userId : {
        type : String,
        required : [true, "User ID is missing, cannot generate store."],
    },
    productSetId : {
        type : String,
        required : [true, "Required Product SET ID to generate store."]
    },
    invoiceSetId : {
        type: String,
        required : [true, "Required Invoice SET ID to generate store."]
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
    invoiceFormat: {
        type: Array,
        required : false
    },
    productList: {
        type: Array,
        required : false
    },
    invoices : {
        type: Array,
        required: false
    },
    storeEmail : {
        type: String,
        required : true
    },
    storeMobile: {
        type: String,
        required : true
    }
})

module.exports = mongoose.model("Store", storeSchema);
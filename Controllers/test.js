const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const Store = require('../Models/storeModel');
const mongoose = require('mongoose');

// Function to generate the HTML content with variables
async function generateHtml(mainData) {
    data = {
        "storeName" : mainData.storeName,
        "storeEmail" : mainData.storeEmail,
        "storeMobileNumber" : mainData.storeMobileNumber,
        "customerName" : mainData.customerName,
        "customerAddress" : mainData.customerAddress,
        "customerMobile" : mainData.customerMobile,
        "GSTIN" : mainData.GSTIN,
        "invoiceNumber" : mainData.invoiceNumber,
        "invoiceDate" : mainData.invoiceDate,
        "items" : mainData.items,
        "totalAmount" : mainData.totalAmount
    }
    // Path to the template file
    const templatePath = path.join(__dirname, 'new.ejs');

    // Read and compile the EJS template with data
    const html = await ejs.renderFile(templatePath, data);
    return html;
}

// Function to convert HTML to PDF
async function generatePdf(mainData) {
    const htmlContent = await generateHtml(mainData);

    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the HTML content in the page
    await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded'
    });


    const pdfBuffer = await page.pdf({
        // path: `Invoice/${mainData.namePDF}.pdf`,
        format: 'A4',
        printBackground: true
    });

    await browser.close();
    console.log('PDF generated successfully!');
    return pdfBuffer
}



async function savePdfToMongoDB(pdfBuffer, id, invoiceId) {
    console.log(typeof(id))
    const result = await Store.updateOne(
        { _id: id },  // Filter by userId
        { $push: { invoices : [pdfBuffer, invoiceId] } }  // Push the new store to the stores array
    );

    try {
        console.log('PDF successfully saved to MongoDB:');
    } catch (error) {
        console.error('Error saving PDF to MongoDB:', error.message);
    }
}




(async () => {
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
    
})



module.exports = {
    generatePdf,
    savePdfToMongoDB
}
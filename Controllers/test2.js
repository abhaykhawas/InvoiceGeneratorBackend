const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

// Initialize Google Cloud Storage client using Service Account credentials
const storage = new Storage({
  keyFilename: 'erudite-pod-313013-aba86c966b65.json', // Path to your service account JSON key file
});

// Function to upload PDF buffer to Google Cloud Storage
async function uploadPdfToGCS(pdfBuffer, bucketName, destinationBlobName) {
  // Get a reference to the bucket
  const bucket = storage.bucket(bucketName);

  // Create a blob (file) reference within the bucket
  const blob = bucket.file(destinationBlobName);
  console.log(blob)

  // Upload the buffer as a .pdf file to Google Cloud Storage
  await blob.save(pdfBuffer, {
    contentType: 'application/pdf', // MIME type of the file
    public: false, // Set to true if you want the file to be publicly accessible
  });

//   console.log(`File uploaded to gs://${bucketName}/${destinationBlobName}`);
}

// Example usage
// const pdfBuffer = fs.readFileSync(__dirname + '/Invoice_001.pdf', 'utf-8'); // Read the PDF file as a buffer from disk
// const bucketName = 'invoices-set1'; // Your Google Cloud Storage bucket name
// const destinationBlobName = 'Invoice/file.pdf'; // Destination path in the bucket

// uploadPdfToGCS(pdfBuffer, bucketName, destinationBlobName)
//   .then(() => console.log('Upload complete!'))
//   .catch(err => console.error('Error uploading file:', err));



module.exports = {
    uploadPdfToGCS
}
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


async function getFileUri(bucketName, fileName) {
  const file = storage.bucket(bucketName).file(fileName);

  // Public URL Method
  const publicUrl = `https://storage.googleapis.com/invoices-set1/${fileName}.pdf`;
  return publicUrl

  // Generating signed URI
  // const expires = Date.now() + 1000 * 60 * 60 * 24
  // const [signedURL] = await file.getSignedUrl({
  //   action: 'read',
  //   expires: expires,
  //   contentType: 'application/pdf'
  // });
  // console.log(signedURL)
  // return signedURL
}



module.exports = {
    uploadPdfToGCS,
    getFileUri
}
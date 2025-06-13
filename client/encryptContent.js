const CryptoJS = require('crypto-js');
const fs = require('fs');

// Path to your original content.json
const inputFilePath = './publichttp://localhost:5000/api/data';
// Path to save the encrypted content
const outputFilePath = './public/encryptedContent.json';

// Read your JSON file
const jsonData = fs.readFileSync(inputFilePath, 'utf-8');

// Encrypt the JSON data
const password = 'your-password'; // Use a strong password
const encryptedData = CryptoJS.AES.encrypt(jsonData, password).toString();

// Save the encrypted data to a new file
fs.writeFileSync(outputFilePath, encryptedData);

console.log('Content encrypted successfully!');

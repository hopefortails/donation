const fs = require('fs');
const path = require('path');

// Define the paths to the files
const keyPath = path.join(__dirname, 'server.key');
const certPath = path.join(__dirname, 'server.crt');

// Check if the files exist
if (fs.existsSync(keyPath)) {
  console.log('server.key exists at:', keyPath);
} else {
  console.log('server.key does not exist');
}

if (fs.existsSync(certPath)) {
  console.log('server.crt exists at:', certPath);
} else {
  console.log('server.crt does not exist');
}

import fs from 'fs';
import path from 'path';

// Define the paths to the files
const keyPath = path.join(process.cwd(), 'server.key');
const certPath = path.join(process.cwd(), 'server.crt');

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

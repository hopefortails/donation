import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import https from 'https';
import http from 'http';
import fs from 'fs';

// Import routes
import donationRoutes from './routes/donations.js';
import paymentRoutes from './routes/payment.js';
import paypalRoutes from './routes/paypal.js';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', // Allow your frontend origin
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true // Allow cookies and credentials
}));
app.use(morgan('dev'));
app.use(express.json());

// Global preflight request handler
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200); // Respond to OPTIONS preflight request
});

// MongoDB connection with retry logic
const connectWithRetry = () => {
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
      console.error('DB Connection Error:', err);
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    });
};
connectWithRetry();

// Set up API routes
app.use('/api/donations', donationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/paypal', paypalRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', uptime: process.uptime() });
});

// Redirect all HTTP traffic to HTTPS
const redirectHttpToHttps = (req, res) => {
  const httpsUrl = `https://${req.hostname}${req.url}`;
  res.redirect(301, httpsUrl);
};
const httpApp = express();
httpApp.use('*', redirectHttpToHttps);

// Error handling middleware
app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Load SSL certificate and key files
const privateKey = fs.readFileSync('server.key', 'utf8');
const certificate = fs.readFileSync('server.crt', 'utf8');

// Create HTTPS server
const httpsServer = https.createServer({ key: privateKey, cert: certificate }, app);

// Start HTTPS server
const SSL_PORT = process.env.SSL_PORT || 5443;
httpsServer.listen(SSL_PORT, () => {
  console.log(`HTTPS Server running on https://localhost:${SSL_PORT}`);
});

// Start HTTP server to redirect traffic
const HTTP_PORT = process.env.PORT || 5000;
http.createServer(httpApp).listen(HTTP_PORT, () => {
  console.log(`HTTP Server running on http://localhost:${HTTP_PORT} and redirecting to HTTPS`);
});

// Gracefully shut down the server
process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  await mongoose.disconnect();
  process.exit(0);
});

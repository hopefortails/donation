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
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'https://zesty-basbousa-557eb2.netlify.app', // Netlify deployment
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan('combined')); // Better logging for production
app.use(express.json());

// Global preflight request handlers
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  } else {
    console.warn(`Blocked by CORS in preflight: ${origin}`);
    res.status(403).send('CORS policy blocked this request');
  }
});

// MongoDB connection with retry logic
const connectWithRetry = () => {
  mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
      console.error('DB Connection Error:', err);
      setTimeout(connectWithRetry, 5000);
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

// Redirect HTTP to HTTPS
const redirectHttpToHttps = (req, res) => {
  const httpsUrl = `https://${req.headers.host}${req.url}`;
  res.redirect(301, httpsUrl);
};
const httpApp = express();
httpApp.use('*', redirectHttpToHttps);

// Error handling middleware
app.use((err, req, res ) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Load SSL certificate and key files
let privateKey, certificate;
try {
  privateKey = fs.readFileSync('server.key', 'utf8');
  certificate = fs.readFileSync('server.crt', 'utf8');
// eslint-disable-next-line no-unused-vars
} catch (error) {
  console.error('SSL files missing. HTTPS may not work.');
}

// Create HTTPS servera
if (privateKey && certificate) {
  const httpsServer = https.createServer({ key: privateKey, cert: certificate }, app);
  const SSL_PORT = process.env.SSL_PORT || 5443;
  httpsServer.listen(SSL_PORT, () => {
    console.log(`HTTPS Server running on https://localhost:${SSL_PORT}`);
  });
}

// Start HTTP server for redirection
const HTTP_PORT = process.env.PORT || 5000;
http.createServer(httpApp).listen(HTTP_PORT, () => {
  console.log(`HTTP Server running on http://localhost:${HTTP_PORT} and redirecting to HTTPS`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  await mongoose.disconnect();
  process.exit(0);
});

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// Import routes
import donationRoutes from './routes/donations.js';
import paymentRoutes from './routes/payment.js';
import paypalRoutes from './routes/paypal.js';

dotenv.config();

const app = express();
const __dirname = path.resolve(); // Ensure compatibility with CommonJS and ESM

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Frontend origin
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true // Allow cookies and credentials
}));
app.use(morgan('dev'));
app.use(express.json());

// MongoDB connection with retry logic
const connectWithRetry = () => {
  mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
      console.error('DB Connection Error:', err);
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    });
};
connectWithRetry();

// Serve static files (frontend) from the `dist` folder
app.use(express.static(path.join(__dirname, 'dist')));

// Set up API routes
app.use('/api/donations', donationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/paypal', paypalRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', uptime: process.uptime() });
});

// Catch-all route to serve the React app for unknown paths
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server on the specified port
const PORT = process.env.PORT || 5000; // Use Render's default or custom port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

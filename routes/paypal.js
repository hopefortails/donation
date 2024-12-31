import express from 'express';
import { captureOrder, createOrder } from '../src/services/paypal.js';

const router = express.Router();

router.post('/create-order', async (req, res) => {
  const { amount, currency = 'USD' } = req.body;

  try {
    const order = await createOrder(amount, currency);
    res.status(201).json({ orderID: order.id });
  } catch (err) {
    console.error('Error creating PayPal order:', err.message);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

router.post('/capture-order', async (req, res) => {
  const { orderID } = req.body;

  try {
    const capture = await captureOrder(orderID);
    res.status(200).json(capture);
  } catch (err) {
    console.error('Error capturing PayPal order:', err.message);
    res.status(500).json({ error: 'Failed to capture PayPal order' });
  }
});

export default router;

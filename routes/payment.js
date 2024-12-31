import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config(); // Ensure environment variables are loaded

const router = express.Router();

// Initialize Stripe with the secret key from the environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-intent', async (req, res) => {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: 'Invalid amount provided.' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
        });
        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error.message);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

export default router;

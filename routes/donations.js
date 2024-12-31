// File: routes/donations.js
import express from 'express';
import Donation from '../models/Donations.js';

const router = express.Router();

// POST: Create a new donation
router.post('/', async (req, res) => {
  try {
    const donation = new Donation(req.body);
    const savedDonation = await donation.save();
    res.status(201).json(savedDonation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET: Fetch all donations
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find();
    res.status(200).json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

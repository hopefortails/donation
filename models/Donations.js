import mongoose from 'mongoose';

const DonationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  transactionHash: { type: String }, // Optional: For MetaMask payments
  date: { type: Date, default: Date.now },
});

const Donation = mongoose.model('Donation', DonationSchema);

export default Donation;

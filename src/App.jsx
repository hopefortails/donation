import { useState, useEffect } from 'react';
import { createDonation, fetchDonations } from './services/donationService';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import './output.css';
import './index.css';
import PropTypes from 'prop-types';
import PayPalButton from './components/PayPalButton';

const stripePromise = loadStripe('pk_test_51Qar2uEQ1gWRTLwxM8bWGJpRoh5R3J4dmNVpGXMiJdAKe8kbjXEmz5a4ZMa8dAnZVAjIbNmexFPr2S75ZphsH9D700LYxu5MyP');

const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-8 w-8"></div>
  </div>
);

const PaymentForm = ({ selectedAmount, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);

    if (!stripe || !elements) {
      setStatus('Stripe is not initialized. Please try again later.');
      setLoading(false);
      return;
    }

    const card = elements.getElement(CardElement);
    const { error, paymentIntent } = await stripe.confirmCardPayment(window.clientSecret, {
      payment_method: {
        card,
      },
    });

    setLoading(false);
    if (error) {
      console.error('Payment failed:', error.message);
      setStatus('Payment failed: ' + error.message);
    } else if (paymentIntent.status === 'succeeded') {
      setStatus('Payment successful! Thank you for your donation.');
      onPaymentSuccess();
    }
  };

  return (
    <form onSubmit={handlePayment} className="bg-white p-4 rounded shadow-md">
      <CardElement className="border p-2 rounded mb-4" />
      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mt-4"
        disabled={!stripe || loading}
      >
        {loading ? 'Processing...' : `Pay $${selectedAmount}`}
      </button>
      <p className="mt-4 text-green-500">{status}</p>
    </form>
  );
};

PaymentForm.propTypes = {
  selectedAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
};

const App = () => {
  const [ setDonations] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', amount: '' });
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState('stripe');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    const loadDonations = async () => {
      setLoading(true);
      try {
        const data = await fetchDonations();
        setDonations(data);
      } catch (error) {
        console.error('Error fetching donations:', error.message);
      }
      setLoading(false);
    };
    loadDonations();
  }, [setDonations]);

  const handleGatewayChange = (e) => {
    setSelectedGateway(e.target.value);
    setShowPaymentForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setError('');
  };

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setFormData((prevData) => ({ ...prevData, amount: '' }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required.';
    if (!formData.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) return 'A valid email is required.';
    if (!selectedAmount && !formData.amount) return 'Please select or enter a donation amount.';
    if (formData.amount && parseFloat(formData.amount) <= 0) return 'Custom amount must be a positive number.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const amount = selectedAmount || formData.amount;
      const response = await fetch('https://donation-hopefortails-81380561.vercel.app/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unknown error occurred.');
      }

      const data = await response.json();
      window.clientSecret = data.clientSecret;
      setShowPaymentForm(true);
      setError('');
    } catch (error) {
      console.error('Error creating payment intent:', error.message);
      setError('Failed to initiate payment. Please try again.');
    }
    setLoading(false);
  };

  const handlePaymentSuccess = async () => {
    const donationData = { ...formData, amount: selectedAmount || formData.amount };
    try {
      const newDonation = await createDonation(donationData);
      setDonations((prevDonations) => [...prevDonations, newDonation]);
      setFormData({ name: '', email: '', amount: '' });
      setSelectedAmount(null);
      setShowPaymentForm(false);
    } catch (error) {
      console.error('Error saving donation:', error.message);
    }
  };

  const renderPaymentForm = () => {
    switch (selectedGateway) {
      case 'stripe':
        return (
          <Elements stripe={stripePromise}>
            <PaymentForm selectedAmount={selectedAmount || formData.amount} onPaymentSuccess={handlePaymentSuccess} />
          </Elements>
        );
      case 'paypal':
        return (
          <PayPalButton
            amount={selectedAmount || formData.amount}
            onPaymentSuccess={handlePaymentSuccess}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white py-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl font-bold">Hope for Tails</h1>
          <p className="text-lg">Help Us Give Stray Pets a Second Chance.</p>
        </div>
      </header>

      <main className="flex flex-col md:flex-row container mx-auto p-4 flex-grow">
        {/* Left Section (Visible on Desktop Only) */}
        <div className="hidden md:block w-1/3 p-6 bg-blue-100 rounded-lg shadow-lg mr-6">
          <h3 className="text-xl font-bold mb-4">Why Donate?</h3>
          <p>
          Every day, countless stray animals struggle to survive without food, shelter, or care. At Hope for Tails, we are dedicated to rescuing, rehabilitating, and finding forever homes for these vulnerable creatures          </p>
          <p className="mt-4">
          Your generous contribution helps provide essential resources like food, medical care, and safe shelter for pets in need.          </p>
          <p className="mt-4">
          Together, we can build a compassionate world where every animal feels loved and cared for.          </p>
        </div>

        {/* Donation Form */}
        <div className="flex-grow p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Make a Donation</h2>
          {loading ? (
            <LoadingSpinner />
          ) : !showPaymentForm ? (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Select Amount:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 25, 50, 75, 100].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleAmountSelect(amount)}
                      className={`px-4 py-2 border rounded text-center ${selectedAmount === amount ? 'bg-blue-500 text-black' : 'bg-grey-400'}`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-bold mb-2">Or Enter a Custom Amount:</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Donate by : </label>
                <div className="flex">
                  <label className="mr-4">
                    <input
                      type="radio"
                      value="stripe"
                      checked={selectedGateway === 'stripe'}
                      onChange={handleGatewayChange}
                      className="mr-2"
                    />
                    Card
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="paypal"
                      checked={selectedGateway === 'paypal'}
                      onChange={handleGatewayChange}
                      className="mr-2"
                    />
                    PayPal
                  </label>
                </div>
              </div>

              {error && <p className="text-red-500 mb-4">{error}</p>}

              <button
                type="submit"
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                disabled={loading}
              >
                Donate Now
              </button>
            </form>
          ) : (
            renderPaymentForm()
          )}
        </div>
      </main>

      <footer className="bg-blue-600 text-white py-4">
        <div className="container mx-auto text-center">
          <p className="text-sm">
            Donations are tax-deductible. Thank you for supporting our mission to save lives, one paw at a time.
          </p>
          <p className="text-sm mt-2">Privacy policy | Terms of service</p>
        </div>
      </footer>
    </div>
  );
};

export default App;

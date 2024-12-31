import { useEffect } from 'react';
import PropTypes from 'prop-types';

const PayPalButton = ({ amount, onPaymentSuccess }) => {
  useEffect(() => {
    if (!window.paypal) {
      console.error('PayPal SDK not loaded. Ensure it is included in your HTML.');
      return;
    }

    window.paypal
      .Buttons({
        createOrder: async () => {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/api/paypal/create-order`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
              }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create PayPal order');
            return data.orderID;
          } catch (error) {
            console.error('Error creating PayPal order:', error);
            alert('Error creating PayPal order. Please try again.');
          }
        },
        onApprove: async (data) => {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/api/paypal/capture-order`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderID: data.orderID }),
              }
            );
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to capture PayPal order');
            onPaymentSuccess(result);
          } catch (error) {
            console.error('Error capturing PayPal order:', error);
            alert('Payment capture failed. Please contact support.');
          }
        },
        onError: (err) => {
          console.error('PayPal Button Error:', err);
          alert('An error occurred with PayPal. Please try again.');
        },
      })
      .render('#paypal-button-container');
  }, [amount, onPaymentSuccess]);

  return <div id="paypal-button-container"></div>;
};

PayPalButton.propTypes = {
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
};

export default PayPalButton;

// src/components/PaymentRequestButton.jsx
import  { useEffect, useState } from "react";
import PropTypes from "prop-types"; // Import PropTypes
import { loadStripe } from "@stripe/stripe-js";
import { PaymentRequestButtonElement, Elements } from "@stripe/react-stripe-js";

// Load Stripe with your publishable key
const stripePromise = loadStripe("pk_test_51Qar2uEQ1gWRTLwxM8bWGJpRoh5R3J4dmNVpGXMiJdAKe8kbjXEmz5a4ZMa8dAnZVAjIbNmexFPr2S75ZphsH9D700LYxu5MyP");

const PaymentRequestButton = ({ clientSecret }) => {
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    const createPaymentRequest = async () => {
      const stripe = await stripePromise;

      // Create a payment request for Google Pay and Apple Pay
      const pr = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: {
          label: "Donation",
          amount: 50 * 100, // Amount in cents
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      // Check if the Payment Request can be shown
      pr.canMakePayment().then((result) => {
        if (result?.googlePay || result?.applePay) {
          setPaymentRequest(pr);
        }
      });
    };

    createPaymentRequest();
  }, []);

  // Handle the payment confirmation
  const handlePayment = async (paymentRequest) => {
    // Remove unused `stripe` variable
    // We don't need to redeclare `stripe` here, as it is already available in `stripePromise`
    
    paymentRequest.on("paymentmethod", async (ev) => {
      const { paymentMethod } = ev;

      const response = await fetch("https://donation-hopefortails-81380561.vercel.app/api/payments/confirm-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          clientSecret,
        }),
      });

      const { success } = await response.json();

      if (success) {
        ev.complete("success");
        alert("Payment successful!");
      } else {
        ev.complete("fail");
        alert("Payment failed.");
      }
    });
  };

  return (
    <div>
      {paymentRequest && (
        <PaymentRequestButtonElement
          paymentRequest={paymentRequest}
          onPaymentRequest={handlePayment}
        />
      )}
    </div>
  );
};

// Add prop validation using PropTypes
PaymentRequestButton.propTypes = {
  clientSecret: PropTypes.string.isRequired, // Validate that clientSecret is a required string
};

// Now validate the props of PaymentRequestWrapper as well
const PaymentRequestWrapper = ({ clientSecret }) => (
  <Elements stripe={stripePromise}>
    <PaymentRequestButton clientSecret={clientSecret} />
  </Elements>
);

// Add prop validation for PaymentRequestWrapper
PaymentRequestWrapper.propTypes = {
  clientSecret: PropTypes.string.isRequired, // Validate that clientSecret is a required string
};

export default PaymentRequestWrapper;
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import App from "../App";

// Load Stripe with your publishable key
const stripePromise = loadStripe("pk_test_51Qar2uEQ1gWRTLwxM8bWGJpRoh5R3J4dmNVpGXMiJdAKe8kbjXEmz5a4ZMa8dAnZVAjIbNmexFPr2S75ZphsH9D700LYxu5MyP");

const Root = () => {
  return (
    <Elements stripe={stripePromise}>
      <App />
    </Elements>
  );
};

export default Root;

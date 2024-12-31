import  { useState } from "react";

const DonationForm = () => {
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ amount, email, message });
    alert("Donation submitted successfully!");
  };

  return (
    <div className="container">
      <h1>Support Our Cause</h1>
      <p>Your contribution helps us make a difference.</p>
      <form onSubmit={handleSubmit} className="form">
        <div className="section">
          <label htmlFor="amount">Donation Amount (USD):</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
          />
        </div>
        <div className="section">
          <label htmlFor="email">Your Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="section">
          <label htmlFor="message">Optional Message:</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message (optional)"
          ></textarea>
        </div>
        <button type="submit">Donate Now</button>
      </form>
    </div>
  );
};

export default DonationForm;

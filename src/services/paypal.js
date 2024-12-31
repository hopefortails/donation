import paypal from '@paypal/checkout-server-sdk';

const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

export const createOrder = async (amount, currency = 'USD') => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount,
        },
      },
    ],
  });

  try {
    const response = await client.execute(request);
    return response.result;
  } catch (err) {
    console.error('PayPal Order Creation Error:', err.message);
    throw new Error('Error creating PayPal order');
  }
};

export const captureOrder = async (orderId) => {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);

  try {
    const response = await client.execute(request);
    return response.result;
  } catch (err) {
    console.error('PayPal Order Capture Error:', err.message);
    throw new Error('Error capturing PayPal order');
  }
};

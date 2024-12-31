
const BASE_URL = 'https://donation-hopefortails-81380561.vercel.app/api/donations';

// Create a new donation
export const createDonation = async (donationData) => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(donationData),
  });

  if (!response.ok) {
    throw new Error('Failed to create donation');
  }

  return await response.json();
};

// Fetch all donations
export const fetchDonations = async () => {
  const response = await fetch(BASE_URL);

  if (!response.ok) {
    throw new Error('Failed to fetch donations');
  }

  return await response.json();
};

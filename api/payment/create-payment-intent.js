const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Force new deployment - API endpoint fix
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'usd', description } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description: description || 'Arigato App Premium',
      metadata: {
        integration_check: 'accept_a_payment',
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
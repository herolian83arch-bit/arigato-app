const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 Starting Stripe Checkout session creation...');
  console.log('📋 Environment variables check:');
  console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Not set');
  console.log('- STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID ? `✅ Set (${process.env.STRIPE_PRICE_ID})` : '❌ Not set');

  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!process.env.STRIPE_PRICE_ID) throw new Error("STRIPE_PRICE_ID is not configured");

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.SITE_URL}/?success=true`,
      cancel_url: `${process.env.SITE_URL}/?canceled=true`,
    });

    console.log('✅ Stripe session created successfully:', session.id);
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session error:', err);
    res.status(500).json({
      error: err.message,
      details: err.stack,
      timestamp: new Date().toISOString(),
    });
  }
};

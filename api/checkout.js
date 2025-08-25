// api/checkout.js
// Stripe Checkout の本物API

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      console.log('🔍 Starting Stripe Checkout session creation...');
      console.log('📋 Environment variables check:');
      console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Not set');
      console.log('- STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID ? `✅ Set (${process.env.STRIPE_PRICE_ID})` : '❌ Not set');
      
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      
      if (!process.env.STRIPE_PRICE_ID) {
        throw new Error('STRIPE_PRICE_ID is not configured');
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            // Vercel に設定した Price ID ($5.00)
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}/?success=true`,
        cancel_url: `${req.headers.origin}/?canceled=true`,
      });

      console.log('✅ Stripe session created successfully:', session.id);
      res.status(200).json({ url: session.url });
    } catch (err) {
      console.error("❌ Stripe session error:", err);
      res.status(500).json({ 
        error: err.message,
        details: err.stack,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}

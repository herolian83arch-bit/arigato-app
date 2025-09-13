const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 Admin metrics API called...');
  console.log('📋 Environment variables check:');
  console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Not set');

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({
      error: 'STRIPE_SECRET_KEY is not configured',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // 期間パラメータの取得（デフォルトは日別）
    const period = req.query.period || 'daily';
    const limit = parseInt(req.query.limit) || 30;

    console.log(`📊 Fetching metrics for period: ${period}, limit: ${limit}`);

    // Stripeからpayment_intentsを取得
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100, // 最大100件取得
      expand: ['data.charges']
    });

    console.log(`📈 Retrieved ${paymentIntents.data.length} payment intents`);

    // 成功した支払いのみをフィルタリング
    const successfulPayments = paymentIntents.data.filter(pi =>
      pi.status === 'succeeded' &&
      pi.amount > 0
    );

    console.log(`✅ Found ${successfulPayments.length} successful payments`);

    // 総売上の計算
    const totalRevenue = successfulPayments.reduce((sum, pi) => sum + pi.amount, 0) / 100; // セントをドルに変換

    // 期間別の売上データを生成
    const revenueData = generateRevenueData(successfulPayments, period, limit);

    // レスポンスデータの構築
    const responseData = {
      totalRevenue: totalRevenue,
      totalPayments: successfulPayments.length,
      revenueData: revenueData,
      period: period,
      generatedAt: new Date().toISOString(),
      stripeData: {
        totalIntents: paymentIntents.data.length,
        successfulIntents: successfulPayments.length,
        failedIntents: paymentIntents.data.length - successfulPayments.length
      }
    };

    console.log('✅ Admin metrics generated successfully');
    console.log(`💰 Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`📊 Revenue data points: ${revenueData.labels.length}`);

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Admin metrics error:', error);
    res.status(500).json({
      error: 'Failed to fetch admin metrics',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// 期間別の売上データを生成する関数
function generateRevenueData(payments, period, limit) {
  const now = new Date();
  const data = [];
  const labels = [];

  // 期間に応じてデータポイントを生成
  for (let i = limit - 1; i >= 0; i--) {
    let date;
    let periodKey;

    if (period === 'daily') {
      date = new Date(now);
      date.setDate(date.getDate() - i);
      periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (period === 'monthly') {
      date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periodKey = date.toISOString().substring(0, 7); // YYYY-MM
    } else {
      // デフォルトは日別
      date = new Date(now);
      date.setDate(date.getDate() - i);
      periodKey = date.toISOString().split('T')[0];
    }

    // その期間の売上を計算
    const periodRevenue = payments
      .filter(pi => {
        const paymentDate = new Date(pi.created * 1000);
        if (period === 'daily') {
          return paymentDate.toISOString().split('T')[0] === periodKey;
        } else if (period === 'monthly') {
          return paymentDate.toISOString().substring(0, 7) === periodKey;
        }
        return false;
      })
      .reduce((sum, pi) => sum + pi.amount, 0) / 100; // セントをドルに変換

    data.push(periodRevenue);

    // ラベルの生成
    if (period === 'daily') {
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    } else if (period === 'monthly') {
      labels.push(date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }));
    }
  }

  return {
    labels: labels,
    values: data
  };
}

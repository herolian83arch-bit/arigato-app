/**
 * ヘルスチェックAPI
 * APIルートの動作確認用
 */

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'GETメソッドのみサポートしています'
    });
  }

  try {
    // 環境変数の確認
    const hasGoogleApiKey = !!process.env.GOOGLE_TRANSLATE_API_KEY;
    const hasStripeKeys = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
    
    return res.status(200).json({
      success: true,
      status: 'healthy',
      message: 'Arigato App API は正常に動作しています',
      data: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        features: {
          googleTranslate: hasGoogleApiKey,
          stripe: hasStripeKeys
        },
        version: '1.0.0',
        uptime: process.uptime()
      },
      endpoints: {
        health: '/api/health',
        translate: '/api/test-translate',
        payment: '/api/payment/create-payment-intent'
      }
    });

  } catch (error) {
    console.error('❌ Health check error:', error);
    
    return res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'HEALTH_CHECK_ERROR',
      message: 'ヘルスチェックでエラーが発生しました',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 
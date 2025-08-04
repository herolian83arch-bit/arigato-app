/**
 * Google Cloud Translation API エンドポイント
 * 動的翻訳機能を提供
 */

module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'POSTメソッドのみサポートしています',
      allowedMethods: ['POST']
    });
  }

  try {
    // リクエストボディの確認
    const { text, target } = req.body;
    
    if (!text || !target) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMETERS',
        message: 'textとtargetパラメータが必要です'
      });
    }

    // 環境変数の確認
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    
    if (!apiKey) {
      console.error('GOOGLE_TRANSLATE_API_KEY is not configured');
      return res.status(500).json({
        success: false,
        error: 'API_KEY_NOT_CONFIGURED',
        message: 'Google Translate APIキーが設定されていません'
      });
    }

    console.log(`🔄 翻訳中: "${text}" → ${target}`);
    
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: target,
          source: 'ja' // 日本語から翻訳
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Translation API error: ${response.status} - ${errorText}`);
      throw new Error(`Translation API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const translatedText = data.data.translations[0].translatedText;
    
    console.log(`✅ 翻訳完了: "${text}" → "${translatedText}"`);
    
    return res.status(200).json({
      success: true,
      originalText: text,
      translatedText: translatedText,
      sourceLanguage: 'ja',
      targetLanguage: target,
      confidence: data.data.translations[0].detectedSourceLanguage ? 1.0 : null
    });

  } catch (error) {
    console.error('❌ Translation API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'TRANSLATION_API_ERROR',
      message: '翻訳APIでエラーが発生しました',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 
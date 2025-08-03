/**
 * Google Translate API テストエンドポイント
 * 美しいエラーハンドリングとレスポンス形式で実装
 */

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      message: 'GETメソッドのみサポートしています',
      allowedMethods: ['GET']
    });
  }

  try {
    // 環境変数の確認
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    
    if (!apiKey) {
      console.error('GOOGLE_TRANSLATE_API_KEY is not configured');
      return res.status(500).json({
        success: false,
        error: 'API_KEY_NOT_CONFIGURED',
        message: 'Google Translate APIキーが設定されていません',
        details: '環境変数GOOGLE_TRANSLATE_API_KEYを確認してください'
      });
    }

    // 翻訳テストの実行
    const testText = 'Hello, world!';
    const targetLang = 'ja';
    
    console.log('🔄 Google Translate APIにリクエスト送信中...');
    
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: testText,
          target: targetLang,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Translation API error: ${response.status} - ${errorText}`);
      throw new Error(`Translation API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Google Translate API接続成功！');
    
    return res.status(200).json({
      success: true,
      data: {
        original: testText,
        translated: data.data.translations[0].translatedText,
        sourceLanguage: 'en',
        targetLanguage: targetLang,
        confidence: data.data.translations[0].detectedSourceLanguage ? 1.0 : null
      },
      message: 'Google Translate API接続成功！',
      timestamp: new Date().toISOString(),
      apiVersion: 'v2'
    });

  } catch (error) {
    console.error('❌ Translation API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'TRANSLATION_API_ERROR',
      message: '翻訳APIでエラーが発生しました',
      details: error.message,
      timestamp: new Date().toISOString(),
      suggestions: [
        'APIキーが正しく設定されているか確認してください',
        'Google Cloud ConsoleでCloud Translation APIが有効になっているか確認してください',
        'ネットワーク接続を確認してください'
      ]
    });
  }
} 
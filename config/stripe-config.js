// Stripe Configuration
// 本番環境では実際の公開キーに置き換えてください

const STRIPE_CONFIG = {
  // テスト用の公開キー（仮の値）
  publishableKey: 'pk_test_51RqsyyGWVvTYb0YWIKOq10sybzWD8e7XKXObY7Tj0dfotoGeOgvlXDEfpymqmXLSwbcz2iVbZ0Hpa800xCMSebA000SGTwfMcA',
  
  // 本番用の公開キー（実際の値に置き換え）
  // publishableKey: 'pk_live_your_actual_live_key_here',
  
  // 決済金額（セント単位）
  amount: 999, // $9.99
  
  // 通貨
  currency: 'usd',
  
  // 商品名
  productName: 'Arigato App Premium',
  
  // 商品説明
  productDescription: 'オノマトペ辞典を含むプレミアム機能へのアクセス'
};

// 設定をエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = STRIPE_CONFIG;
}

// ブラウザ環境でのグローバル変数として設定
if (typeof window !== 'undefined') {
  window.STRIPE_CONFIG = STRIPE_CONFIG;
}

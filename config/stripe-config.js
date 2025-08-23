// Stripe Configuration
// 環境変数からキーを読み込みます（直書き禁止）

const STRIPE_CONFIG = {
  // 公開キー（フロントエンド用）
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_your_publishable_key_here",

  // シークレットキー（サーバー側用）
  secretKey: process.env.STRIPE_SECRET_KEY || "sk_test_your_secret_key_here",

  // Webhook シークレット
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "whsec_your_webhook_secret_here",

  // 商品情報
  product: {
    priceId: process.env.STRIPE_PRICE_ID || "price_dummy_id",
    productName: "Arigato App Premium",
    productDescription: "オノマトペ辞典を含むプレミアム機能へのアクセス",

    // 金額と通貨（フロント表示用）
    amount: 500,  // $5.00
    currency: "usd"
  }
};

// Node.js 用（バックエンドで利用する場合）
if (typeof module !== "undefined" && module.exports) {
  module.exports = STRIPE_CONFIG;
}

// ブラウザ用（フロントエンドで利用する場合）
if (typeof window !== "undefined") {
  window.STRIPE_CONFIG = STRIPE_CONFIG;
}


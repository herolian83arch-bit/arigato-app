# Stripe決済システム設定ガイド

## 1. Stripeアカウントの作成

### 手順
1. **https://stripe.com** にアクセス
2. **「Get started」** をクリック
3. **アカウント情報を入力**：
   - メールアドレス
   - パスワード
   - 国（日本）
   - ビジネス情報

### 注意事項
- 無料でアカウント作成可能
- テストモードで開始（本番環境に切り替え可能）
- 個人・法人どちらでも利用可能

## 2. APIキーの取得

### ダッシュボードでの操作
1. **Stripeダッシュボード**にログイン
2. **Developers** → **API keys** を選択
3. **Publishable key** と **Secret key** をコピー

### テスト用キー（開発環境）
```
Publishable key: pk_test_xxxxxxxxxxxxxxxxxxxxx
Secret key: sk_test_xxxxxxxxxxxxxxxxxxxxx
```

### 本番用キー（本番環境）
```
Publishable key: pk_live_xxxxxxxxxxxxxxxxxxxxx
Secret key: sk_live_xxxxxxxxxxxxxxxxxxxxx
```

## 3. Vercelでの環境変数設定

### 手順
1. **Vercelダッシュボード**にアクセス
2. **arigato-app**プロジェクトを選択
3. **Settings** → **Environment Variables**
4. 以下の環境変数を追加：

| 変数名 | 値 | 説明 |
|--------|----|----|
| STRIPE_SECRET_KEY | sk_test_xxxxxxxxxxxxxxxxxxxxx | Stripe秘密キー |
| STRIPE_PUBLISHABLE_KEY | pk_test_xxxxxxxxxxxxxxxxxxxxx | Stripe公開キー |
| STRIPE_WEBHOOK_SECRET | whsec_xxxxxxxxxxxxxxxxxxxxx | Webhook秘密キー |

### 環境変数の追加方法
1. **Add New** をクリック
2. **Name** に変数名を入力
3. **Value** に値を入力
4. **Environment** で **Production** を選択
5. **Save** をクリック

## 4. Webhookの設定

### 手順
1. **Stripeダッシュボード** → **Developers** → **Webhooks**
2. **Add endpoint** をクリック
3. **Endpoint URL** に以下を入力：
   ```
   https://arigato-app.vercel.app/api/payment/webhook
   ```
4. **Events to send** で以下を選択：
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. **Add endpoint** をクリック
6. **Signing secret** をコピーして環境変数に設定

## 5. テスト決済の実行

### テストカード番号
- **成功**: 4242 4242 4242 4242
- **失敗**: 4000 0000 0000 0002
- **3Dセキュア**: 4000 0025 0000 3155

### 有効期限
- 任意の将来の日付（例：12/25）

### CVC
- 任意の3桁の数字（例：123）

## 6. 本番環境への移行

### 手順
1. **Stripeダッシュボード**で **Live mode** に切り替え
2. **本番用APIキー**を取得
3. **Vercel**で環境変数を本番用に更新
4. **Webhook**を本番用URLに更新

## トラブルシューティング

### よくある問題
1. **APIキーが無効**: 正しいキーを確認
2. **Webhookが届かない**: URLとシークレットを確認
3. **決済が失敗**: テストカード番号を確認

### ログの確認
- **Vercel Functions**のログを確認
- **Stripeダッシュボード**のログを確認

## セキュリティ注意事項

- **Secret key**は絶対に公開しない
- **環境変数**は適切に管理する
- **Webhook**はHTTPSで設定する
- **テスト環境**で十分にテストしてから本番環境に移行する 
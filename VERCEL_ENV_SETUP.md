# Vercel環境変数設定ガイド

## 1. Vercelダッシュボードにアクセス

1. **https://vercel.com** にアクセス
2. **ログイン**（GitHubアカウントで）
3. **arigato-app**プロジェクトを選択

## 2. 環境変数の設定

### 手順
1. **Settings** タブをクリック
2. **Environment Variables** を選択
3. **Add New** をクリック

### 設定する環境変数

#### 1. STRIPE_SECRET_KEY
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: `sk_test_xxxxxxxxxxxxxxxxxxxxx`（Stripeから取得したSecret key）
- **Environment**: `Production`
- **Save** をクリック

#### 2. STRIPE_PUBLISHABLE_KEY
- **Name**: `STRIPE_PUBLISHABLE_KEY`
- **Value**: `pk_test_xxxxxxxxxxxxxxxxxxxxx`（Stripeから取得したPublishable key）
- **Environment**: `Production`
- **Save** をクリック

#### 3. STRIPE_WEBHOOK_SECRET
- **Name**: `STRIPE_WEBHOOK_SECRET`
- **Value**: `whsec_xxxxxxxxxxxxxxxxxxxxx`（Webhook設定後に取得）
- **Environment**: `Production`
- **Save** をクリック

## 3. 環境変数の確認

設定後、以下の点を確認：
- すべての環境変数が **Production** に設定されている
- 値が正しく入力されている
- スペルミスがない

## 4. デプロイの確認

環境変数設定後：
1. **Deployments** タブを確認
2. 最新のデプロイメントが成功しているか確認
3. アプリが正常に動作するかテスト

## 5. トラブルシューティング

### よくある問題
1. **環境変数が反映されない**
   - 新しいデプロイメントを実行
   - キャッシュをクリア

2. **決済が失敗する**
   - APIキーが正しいか確認
   - テストモードか本番モードか確認

3. **Webhookが届かない**
   - URLが正しいか確認
   - シークレットが正しいか確認

## 6. セキュリティ注意事項

- **Secret key**は絶対に公開しない
- **環境変数**は適切に管理する
- **テスト環境**で十分にテストしてから本番環境に移行する 
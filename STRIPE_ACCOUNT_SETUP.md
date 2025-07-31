# Stripeアカウント作成手順

## 1. Stripeアカウント作成

### 手順
1. **https://stripe.com** にアクセス
2. **「Get started」** ボタンをクリック
3. **アカウント情報を入力**：
   - メールアドレス
   - パスワード
   - 国：日本
   - ビジネス名：Arigato App
   - ビジネスタイプ：個人事業主

### 注意事項
- **無料**でアカウント作成可能
- **テストモード**で開始（安全）
- **個人・法人**どちらでも利用可能

## 2. ダッシュボードでの設定

### アカウント作成後
1. **Stripeダッシュボード**にログイン
2. **Developers** → **API keys** を選択
3. **Publishable key** と **Secret key** をコピー

### 取得するキー
```
Publishable key: pk_test_xxxxxxxxxxxxxxxxxxxxx
Secret key: sk_test_xxxxxxxxxxxxxxxxxxxxx
```

## 3. 次のステップ

### APIキー取得後
1. **Vercelダッシュボード**にアクセス
2. **環境変数**を設定
3. **テスト決済**を実行

## 4. セキュリティ注意事項

- **Secret key**は絶対に公開しない
- **テストモード**で十分にテスト
- **本番環境**に移行する前に確認 
# Stripeアカウント作成 - ステップバイステップ

## Step 1: Stripeウェブサイトにアクセス

1. **ブラウザで https://stripe.com を開く**
2. **右上の「Get started」ボタンをクリック**

## Step 2: アカウント情報入力

### 基本情報
- **メールアドレス**: あなたのメールアドレス
- **パスワード**: 安全なパスワード
- **国**: 日本
- **言語**: 日本語（選択可能）

### ビジネス情報
- **ビジネス名**: Arigato App
- **ビジネスタイプ**: 個人事業主
- **業種**: ソフトウェア・テクノロジー
- **ウェブサイト**: arigato-app.vercel.app

## Step 3: アカウント作成完了

1. **メール確認**（必要に応じて）
2. **ダッシュボードにログイン**
3. **テストモード**で開始（安全）

## Step 4: APIキーの取得

### 手順
1. **左サイドバーの「Developers」をクリック**
2. **「API keys」を選択**
3. **「Publishable key」をコピー**
4. **「Secret key」をコピー**

### 取得するキー
```
Publishable key: pk_test_xxxxxxxxxxxxxxxxxxxxx
Secret key: sk_test_xxxxxxxxxxxxxxxxxxxxx
```

## Step 5: 次のステップ

### APIキー取得後
1. **Vercelダッシュボード**にアクセス
2. **環境変数**を設定
3. **テスト決済**を実行

## 注意事項

- **テストモード**で開始（安全）
- **APIキー**は安全に保管
- **Secret key**は絶対に公開しない 
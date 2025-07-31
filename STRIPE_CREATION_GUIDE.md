# Stripeアカウント作成 - 詳細ガイド

## 🚀 Step 1: Stripeウェブサイトにアクセス

1. **ブラウザで https://stripe.com を開く**
2. **右上の「Get started」ボタンをクリック**

## 📝 Step 2: アカウント情報入力

### 基本情報
- **メールアドレス**: あなたのメールアドレス
- **パスワード**: 安全なパスワード（8文字以上）
- **国**: 日本
- **言語**: 日本語（選択可能）

### ビジネス情報
- **ビジネス名**: Arigato App
- **ビジネスタイプ**: 個人事業主
- **業種**: ソフトウェア・テクノロジー
- **ウェブサイト**: arigato-app.vercel.app
- **商品・サービスの説明**: 多言語感謝表現アプリ

## ✅ Step 3: アカウント作成完了

1. **メール確認**（必要に応じて）
2. **ダッシュボードにログイン**
3. **テストモード**で開始（安全）

## 🔑 Step 4: APIキーの取得

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

## 🔧 Step 5: Vercel環境変数設定

### 手順
1. **Vercelダッシュボード**にアクセス
2. **arigato-app**プロジェクトを選択
3. **Settings** → **Environment Variables**
4. **以下の環境変数を追加**：

| 変数名 | 値 | 説明 |
|--------|----|----|
| STRIPE_SECRET_KEY | sk_test_xxxxxxxxxxxxxxxxxxxxx | Stripe秘密キー |
| STRIPE_PUBLISHABLE_KEY | pk_test_xxxxxxxxxxxxxxxxxxxxx | Stripe公開キー |

## 🧪 Step 6: テスト決済実行

### テストカード情報
- **カード番号**: 4242 4242 4242 4242
- **有効期限**: 任意の将来の日付（例：12/25）
- **CVC**: 任意の3桁の数字（例：123）

## 🎉 Step 7: 動作確認

1. **アプリにアクセス**
2. **「Upgrade to Premium」ボタンをクリック**
3. **決済モーダルが表示されることを確認**
4. **テストカード情報を入力**
5. **決済が成功することを確認**

## ⚠️ 注意事項

- **テストモード**で開始（安全）
- **APIキー**は安全に保管
- **Secret key**は絶対に公開しない
- **本番環境**に移行する前に十分にテスト 
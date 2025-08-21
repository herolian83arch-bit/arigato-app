# Arigato App Premium Features

## 🎯 概要

Arigato Appのプレミアム機能により、オノマトペ辞典（41シーン・615例文）を含む高度な機能が利用可能になります。

## ✨ プレミアム機能

- **📚 オノマトペ辞典**: 41シーン・615例文の日本語擬音語・擬態語
- **🎵 高品質音声**: より自然な音声再生
- **🖼️ カスタム背景**: 美しい背景テーマ
- **🚀 高度な言語機能**: より詳細な翻訳と例文

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
# http-serverのインストール（グローバル）
npm install -g http-server
```

### 2. 開発サーバーの起動

```bash
# publicディレクトリでサーバーを起動
cd public
http-server -p 3000 -c-1
```

## 🔍 動作確認

### 自動検証（推奨）

PowerShellスクリプトを使用して一発で検証：

```powershell
# 完全自動検証（サーバー起動 + ブラウザテスト）
.\verify-premium.ps1

# サーバーのみ起動
.\verify-premium.ps1 -SkipBrowser

# ブラウザテストのみ（サーバーは既に起動済み）
.\verify-premium.ps1 -SkipServer
```

### 手動検証

1. **初期状態の確認**
   - `http://localhost:3000/index.html` を開く
   - プレミアムでない場合は自動的に `premium-locked.html` にリダイレクト

2. **プレミアムアップグレード**
   - 「Upgrade to Premium」ボタンをクリック
   - `checkout.html` で決済を完了
   - 成功後、`index.html` に戻りプレミアム機能が解放

3. **手動テスト**
   - ブラウザの開発者ツールを開く
   - コンソールで以下を実行：
   ```javascript
   localStorage.setItem('premiumStatus', 'true')
   ```
   - ページをリフレッシュしてプレミアム機能を確認

## 🛠️ ファイル構成

```
arigato-app-starter/
├── config/
│   └── stripe-config.js          # Stripe設定ファイル
├── public/
│   ├── index.html                # メインアプリ（既存）
│   ├── checkout.html             # 決済ページ（新規）
│   ├── premium-locked.html       # プレミアムロック画面（新規）
│   └── script.js                 # メインスクリプト（既存・修正）
├── verify-premium.ps1            # PowerShell検証スクリプト（新規）
└── PREMIUM_FEATURES_README.md    # このファイル
```

## 🔧 技術仕様

### プレミアム判定

- **キー**: `localStorage.getItem('premiumStatus')`
- **値**: `'true'` = プレミアム有効、`null` またはその他 = プレミアム無効

### 決済フロー

1. ユーザーが `index.html` にアクセス
2. `checkPremiumStatus()` でプレミアム状態をチェック
3. 非プレミアムの場合、`premium-locked.html` にリダイレクト
4. ユーザーが「Upgrade to Premium」をクリック
5. `checkout.html` で決済処理
6. 決済成功後、`localStorage.setItem('premiumStatus', 'true')` を保存
7. `index.html` にリダイレクトしてプレミアム機能を解放

### オフライン対応

- `localStorage` を使用するため、オフライン時でもプレミアム状態が保持される
- ブラウザを閉じても状態は維持される

## 🧪 テスト

### 単体テスト

```javascript
// プレミアム状態の設定
localStorage.setItem('premiumStatus', 'true');

// プレミアム状態の確認
console.log(localStorage.getItem('premiumStatus')); // 'true'

// プレミアム状態のリセット
localStorage.removeItem('premiumStatus');
```

### 統合テスト

PowerShellスクリプト `verify-premium.ps1` が以下を自動テスト：

- 開発サーバーの起動
- 初期状態でのプレミアムロック確認
- チェックアウトページの表示
- モック決済のシミュレート
- プレミアム機能の解放確認

## 🚨 トラブルシューティング

### よくある問題

1. **プレミアム機能が解放されない**
   - ブラウザのコンソールで `localStorage.getItem('premiumStatus')` を確認
   - 値が `'true'` になっているかチェック

2. **決済ページが表示されない**
   - `checkout.html` ファイルが `public/` ディレクトリに存在するか確認
   - ファイルパスが正しいかチェック

3. **PowerShellスクリプトが実行できない**
   - 実行ポリシーを確認：`Get-ExecutionPolicy`
   - 必要に応じて：`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### ログ確認

- ブラウザの開発者ツールでコンソールログを確認
- PowerShellスクリプトの実行ログを確認

## 📝 開発者向け情報

### 既存コードとの互換性

- 既存の辞書JSON、音声再生、お気に入り機能には一切影響なし
- 既存の多言語機能も完全に保持
- 新規追加のみで、削除・改変は一切なし

### 拡張性

- 新しいプレミアム機能の追加が容易
- Stripe設定の変更が簡単
- モック決済モードで開発・テストが可能

## 📞 サポート

問題が発生した場合や質問がある場合は、以下を確認してください：

1. このREADMEファイルの内容
2. ブラウザのコンソールログ
3. PowerShellスクリプトの実行ログ
4. ファイルの存在確認

---

**注意**: この実装は開発・テスト用です。本番環境では適切なStripeキーとセキュリティ対策を実装してください。

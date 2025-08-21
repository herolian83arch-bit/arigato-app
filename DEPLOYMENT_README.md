# Vercel Production デプロイ自動化

このプロジェクトでは、Vercelの最新デプロイをProductionに反映するための自動化スクリプトを提供しています。

## 🚀 概要

- **目的**: mainブランチにpushされた内容を即座にVercel Productionに反映
- **方法**: 最新のデプロイを「Promote to Production」で自動反映
- **特徴**: 手動操作不要、エラーハンドリング完備、詳細ログ出力

## 📁 ファイル構成

```
├── deploy-to-production.ps1    # PowerShell版（Windows推奨）
├── deploy-to-production.sh     # bash版（macOS/Linux推奨）
└── DEPLOYMENT_README.md        # このファイル
```

## 🛠️ 使用方法

### PowerShell版（Windows）

```powershell
# スクリプトを実行
.\deploy-to-production.ps1

# または
powershell -ExecutionPolicy Bypass -File deploy-to-production.ps1
```

### bash版（macOS/Linux）

```bash
# 実行権限を付与
chmod +x deploy-to-production.sh

# スクリプトを実行
./deploy-to-production.sh
```

## ⚙️ 前提条件

1. **Vercel CLI がインストール済み**
   ```bash
   npm install -g vercel
   # または
   npx vercel --version
   ```

2. **Vercelアカウントにログイン済み**
   ```bash
   npx vercel login
   ```

3. **プロジェクトがVercelにリンク済み**
   ```bash
   npx vercel link
   ```

4. **適切なスコープが設定済み**
   ```bash
   npx vercel switch
   ```

## 🔄 自動化フロー

1. **最新デプロイの確認**
   - `npx vercel ls --scope herolians-projects` で最新デプロイを取得

2. **Productionデプロイの確認**
   - 現在のProductionデプロイ状況を確認

3. **Promote to Production**
   - `npx vercel promote <deployment-id> production --yes` で自動反映

4. **最終確認**
   - Production反映完了の確認

## 📊 出力例

### 成功時
```
🎉 SUCCESS: Production に反映されました！
デプロイURL: https://arigato-app-starter-1iykcs43b-herolians-projects.vercel.app
Production URL: https://arigato-app-starter.vercel.app
```

### 失敗時
```
❌ Production反映に失敗: [エラー詳細]
🔧 対処方法:
1. デプロイが完了しているか確認
2. 権限が正しいか確認
3. 手動でVercelダッシュボードから確認
4. スクリプトを再実行
```

## 🚨 トラブルシューティング

### よくある問題と対処法

1. **「デプロイ一覧の取得に失敗」**
   - Vercel CLIのログイン状態を確認
   - プロジェクトのリンク状態を確認

2. **「最新のデプロイが見つかりません」**
   - デプロイが完了しているか確認
   - スコープが正しいか確認

3. **「Production反映に失敗」**
   - デプロイの完了を待つ
   - 権限の確認
   - Vercelダッシュボードでの手動確認

### 手動での確認方法

```bash
# ログイン状態確認
npx vercel whoami

# プロジェクト一覧確認
npx vercel projects

# デプロイ一覧確認
npx vercel ls --scope herolians-projects

# スコープ切り替え
npx vercel switch
```

## 🔧 カスタマイズ

### プロジェクト設定の変更

スクリプト内の以下の変数を変更してください：

```bash
# PowerShell版
$PROJECT_SCOPE = "herolians-projects"    # あなたのスコープ名
$PROJECT_NAME = "arigato-app-starter"    # あなたのプロジェクト名

# bash版
PROJECT_SCOPE="herolians-projects"       # あなたのスコープ名
PROJECT_NAME="arigato-app-starter"       # あなたのプロジェクト名
```

### 追加のオプション

必要に応じて以下のオプションを追加できます：

- 環境変数の設定
- 特定ブランチのみのデプロイ
- デプロイ前のテスト実行
- 通知機能（Slack、Discord等）

## 📝 注意事項

- このスクリプトは**Production環境**に直接反映します
- 実行前にデプロイ内容を十分確認してください
- エラーが発生した場合は、ログを確認して対処してください
- 初回実行時は、Vercelの設定が正しく行われているか確認してください

## 🆘 サポート

問題が発生した場合：

1. スクリプトのエラーログを確認
2. Vercel CLIの状態を確認
3. Vercelダッシュボードでの手動確認
4. 必要に応じてスクリプトを再実行

---

**🎯 目標**: コードの変更からProduction反映までを完全自動化し、開発効率を最大化する

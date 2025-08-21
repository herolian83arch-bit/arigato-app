#!/bin/bash

# Vercel Production デプロイ自動化スクリプト (bash版)
# 最新のデプロイを Production に反映する

# 設定
PROJECT_SCOPE="herolians-projects"
PROJECT_NAME="arigato-app-starter"

echo "🚀 Vercel Production デプロイ自動化を開始します..."
echo "プロジェクト: $PROJECT_SCOPE/$PROJECT_NAME"

# 1. 最新のデプロイ状況を確認
echo ""
echo "📋 最新のデプロイ状況を確認中..."
if ! deployments=$(npx vercel ls --scope $PROJECT_SCOPE 2>&1); then
    echo "❌ デプロイ一覧の取得に失敗しました"
    echo ""
    echo "🔧 対処方法:"
    echo "1. Vercel CLI がログインされているか確認: npx vercel whoami"
    echo "2. プロジェクトがリンクされているか確認: npx vercel link"
    echo "3. スコープが正しいか確認: npx vercel switch"
    exit 1
fi

# 最新のデプロイURLを抽出
latest_deployment=$(echo "$deployments" | grep "https://" | head -n 1)
if [ -z "$latest_deployment" ]; then
    echo "❌ 最新のデプロイが見つかりません"
    exit 1
fi

deployment_url=$(echo "$latest_deployment" | tr -d ' ')
echo "✅ 最新デプロイを発見: $deployment_url"

# 2. 現在のProductionデプロイを確認
echo ""
echo "🌐 現在のProductionデプロイを確認中..."
if current_production=$(npx vercel ls --scope $PROJECT_SCOPE --prod 2>&1); then
    echo "✅ 現在のProductionデプロイ:"
    echo "$current_production"
else
    echo "ℹ️ 現在のProductionデプロイが見つかりません（初回デプロイの可能性）"
fi

# 3. 最新デプロイをProductionに反映
echo ""
echo "🚀 最新デプロイをProductionに反映中..."

# デプロイIDを抽出
deployment_id=$(echo "$deployment_url" | sed 's/.*\///')

echo "デプロイID: $deployment_id"
echo "デプロイURL: $deployment_url"

# Productionへのプロモート実行
if promote_result=$(npx vercel promote "$deployment_id" production --yes --scope $PROJECT_SCOPE 2>&1); then
    echo ""
    echo "🎉 SUCCESS: Production に反映されました！"
    echo "デプロイURL: $deployment_url"
    echo "Production URL: https://$PROJECT_NAME.vercel.app"
    
    # プロモート結果の詳細を表示
    echo ""
    echo "📊 プロモート結果:"
    echo "$promote_result"
else
    echo ""
    echo "❌ Production反映に失敗: $promote_result"
    echo ""
    echo "🔧 対処方法:"
    echo "1. デプロイが完了しているか確認"
    echo "2. 権限が正しいか確認"
    echo "3. 手動でVercelダッシュボードから確認"
    echo "4. スクリプトを再実行"
    exit 1
fi

# 4. 最終確認
echo ""
echo "🔍 最終確認中..."
sleep 3  # 反映待ち

if final_check=$(npx vercel ls --scope $PROJECT_SCOPE --prod 2>&1); then
    echo "✅ Production反映完了確認:"
    echo "$final_check"
fi

echo ""
echo "🎯 デプロイ自動化が完了しました！"
echo "Production URL: https://$PROJECT_NAME.vercel.app"
echo ""
echo "💡 次回の使用:"
echo "このスクリプトを再実行することで、最新のデプロイをProductionに反映できます"

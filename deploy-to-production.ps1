# Vercel Production デプロイ自動化スクリプト
# 最新のデプロイを Production に反映する

# 設定
$PROJECT_SCOPE = "herolians-projects"
$PROJECT_NAME = "arigato-app-starter"

Write-Host "🚀 Vercel Production デプロイ自動化を開始します..." -ForegroundColor Green
Write-Host "プロジェクト: $PROJECT_SCOPE/$PROJECT_NAME" -ForegroundColor Cyan

# 1. 最新のデプロイ状況を確認
Write-Host "`n📋 最新のデプロイ状況を確認中..." -ForegroundColor Yellow
try {
    $deployments = npx vercel ls --scope $PROJECT_SCOPE 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "デプロイ一覧の取得に失敗しました"
    }
    
    # 最新のデプロイURLを抽出
    $latestDeployment = $deployments | Select-String "https://" | Select-Object -First 1
    if (-not $latestDeployment) {
        throw "最新のデプロイが見つかりません"
    }
    
    $deploymentUrl = $latestDeployment.Line.Trim()
    Write-Host "✅ 最新デプロイを発見: $deploymentUrl" -ForegroundColor Green
    
} catch {
    Write-Host "❌ デプロイ状況の確認に失敗: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n🔧 対処方法:" -ForegroundColor Yellow
    Write-Host "1. Vercel CLI がログインされているか確認: npx vercel whoami" -ForegroundColor White
    Write-Host "2. プロジェクトがリンクされているか確認: npx vercel link" -ForegroundColor White
    Write-Host "3. スコープが正しいか確認: npx vercel switch" -ForegroundColor White
    exit 1
}

# 2. 現在のProductionデプロイを確認
Write-Host "`n🌐 現在のProductionデプロイを確認中..." -ForegroundColor Yellow
try {
    $currentProduction = npx vercel ls --scope $PROJECT_SCOPE --prod 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 現在のProductionデプロイ:" -ForegroundColor Green
        Write-Host $currentProduction -ForegroundColor White
    } else {
        Write-Host "ℹ️ 現在のProductionデプロイが見つかりません（初回デプロイの可能性）" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Productionデプロイの確認に失敗しましたが、続行します" -ForegroundColor Yellow
}

# 3. 最新デプロイをProductionに反映
Write-Host "`n🚀 最新デプロイをProductionに反映中..." -ForegroundColor Yellow
try {
    # デプロイIDまたはURLからプロモート
    $deploymentId = $deploymentUrl.Split('/')[-1]
    
    Write-Host "デプロイID: $deploymentId" -ForegroundColor Cyan
    Write-Host "デプロイURL: $deploymentUrl" -ForegroundColor Cyan
    
    # Productionへのプロモート実行
    $promoteResult = npx vercel promote $deploymentId production --yes --scope $PROJECT_SCOPE 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 SUCCESS: Production に反映されました！" -ForegroundColor Green
        Write-Host "デプロイURL: $deploymentUrl" -ForegroundColor Cyan
        Write-Host "Production URL: https://$PROJECT_NAME.vercel.app" -ForegroundColor Cyan
        
        # プロモート結果の詳細を表示
        Write-Host "`n📊 プロモート結果:" -ForegroundColor Yellow
        Write-Host $promoteResult -ForegroundColor White
        
    } else {
        throw "プロモートに失敗しました: $promoteResult"
    }
    
} catch {
    Write-Host "`n❌ Production反映に失敗: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n🔧 対処方法:" -ForegroundColor Yellow
    Write-Host "1. デプロイが完了しているか確認" -ForegroundColor White
    Write-Host "2. 権限が正しいか確認" -ForegroundColor White
    Write-Host "3. 手動でVercelダッシュボードから確認" -ForegroundColor White
    Write-Host "4. スクリプトを再実行" -ForegroundColor White
    exit 1
}

# 4. 最終確認
Write-Host "`n🔍 最終確認中..." -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 3  # 反映待ち
    
    $finalCheck = npx vercel ls --scope $PROJECT_SCOPE --prod 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Production反映完了確認:" -ForegroundColor Green
        Write-Host $finalCheck -ForegroundColor White
    }
} catch {
    Write-Host "⚠️ 最終確認に失敗しましたが、プロモートは完了しています" -ForegroundColor Yellow
}

Write-Host "`n🎯 デプロイ自動化が完了しました！" -ForegroundColor Green
Write-Host "Production URL: https://$PROJECT_NAME.vercel.app" -ForegroundColor Cyan
Write-Host "`n💡 次回の使用:" -ForegroundColor Yellow
Write-Host "このスクリプトを再実行することで、最新のデプロイをProductionに反映できます" -ForegroundColor White

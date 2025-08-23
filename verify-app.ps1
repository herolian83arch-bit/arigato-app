# ===== verify-app.ps1 =====
# 1. ポート3000を解放（他のサーバーが動いていても止める）
npx kill-port 3000 || Write-Host "No process on port 3000"

# 2. サーバーをバックグラウンドで起動（public フォルダを配信）
Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "http-server public -p 3000 -c-1"

# 3. 起動安定のため数秒待機
Start-Sleep -Seconds 3

# 4. 検証スクリプトを実行
node scripts/verify-app.mjs

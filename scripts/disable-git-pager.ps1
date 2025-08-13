# Gitページャ無効化スクリプト (PowerShell版)
# 冪等性を保証 - 何度実行しても安全

Write-Host "=== Gitページャ無効化スクリプト開始 ===" -ForegroundColor Green

# 1. グローバルGit設定
Write-Host "1. グローバルGit設定を更新中..." -ForegroundColor Yellow
git config --global core.pager cat
git config --global pager.log false
git config --global pager.show false
git config --global pager.diff false

# 2. 環境変数設定
Write-Host "2. 環境変数を設定中..." -ForegroundColor Yellow
$env:GIT_PAGER = "cat"
$env:LESS = "-F -X"

# 3. 設定確認
Write-Host "3. 設定を確認中..." -ForegroundColor Yellow
Write-Host "core.pager: $(git config --global --get core.pager)"
Write-Host "pager.log: $(git config --global --get pager.log)"
Write-Host "pager.show: $(git config --global --get pager.show)"
Write-Host "pager.diff: $(git config --global --get pager.diff)"
Write-Host "GIT_PAGER: $env:GIT_PAGER"
Write-Host "LESS: $env:LESS"

# 4. 検証テスト
Write-Host "4. 検証テスト実行中..." -ForegroundColor Yellow
Write-Host "git log テスト:"
git log -n 2 --oneline | Select-Object -First 3

Write-Host "git show テスト:"
git show -n 1 --oneline | Select-Object -First 2

Write-Host "=== 完了 ===" -ForegroundColor Green
Write-Host "注意: このセッションでのみ有効です。永続化するにはPowerShellプロファイルに追加してください。"


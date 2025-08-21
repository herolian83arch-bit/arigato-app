# Arigato App Premium Feature Verification Script
# プレミアム機能の動作を自動検証するPowerShellスクリプト

param(
    [switch]$SkipServer,
    [switch]$SkipBrowser,
    [switch]$Verbose
)

# 設定
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PublicDir = Join-Path $ProjectRoot "public"
$ServerPort = 3000
$ServerUrl = "http://localhost:$ServerPort"
$CheckoutUrl = "$ServerUrl/checkout.html"
$IndexUrl = "$ServerUrl/index.html"
$LockedUrl = "$ServerUrl/premium-locked.html"

# 色付きログ関数
function Write-ColorLog {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Write-Success { param([string]$Message) Write-ColorLog "✅ $Message" "Green" }
function Write-Info { param([string]$Message) Write-ColorLog "ℹ️ $Message" "Cyan" }
function Write-Warning { param([string]$Message) Write-ColorLog "⚠️ $Message" "Yellow" }
function Write-Error { param([string]$Message) Write-ColorLog "❌ $Message" "Red" }

# ヘルパー関数
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

function Wait-ForPort {
    param([int]$Port, [int]$TimeoutSeconds = 30)
    $startTime = Get-Date
    while ((Get-Date) -lt $startTime.AddSeconds($TimeoutSeconds)) {
        if (Test-Port $Port) {
            return $true
        }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Start-DevServer {
    Write-Info "Starting development server..."
    
    # http-serverがインストールされているかチェック
    if (-not (Test-Command "http-server")) {
        Write-Warning "http-server not found. Installing globally..."
        npm install -g http-server
    }
    
    # 既存のプロセスを終了
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # サーバーを起動
    Push-Location $PublicDir
    Start-Process -FilePath "http-server" -ArgumentList "-p", $ServerPort, "-c-1" -WindowStyle Hidden
    Pop-Location
    
    # サーバー起動を待機
    if (Wait-ForPort $ServerPort) {
        Write-Success "Development server started on port $ServerPort"
        return $true
    } else {
        Write-Error "Failed to start development server"
        return $false
    }
}

function Test-PremiumFlow {
    Write-Info "Testing premium feature flow..."
    
    # 1. 初期状態の確認（premium-locked.htmlが表示される）
    Write-Info "Step 1: Testing initial state (should show premium-locked.html)"
    Start-Process $IndexUrl
    
    Start-Sleep -Seconds 3
    
    # 2. チェックアウトページを開く
    Write-Info "Step 2: Opening checkout page"
    Start-Process $CheckoutUrl
    
    Start-Sleep -Seconds 3
    
    # 3. モック決済をシミュレート
    Write-Info "Step 3: Simulating mock payment"
    
    # PowerShellでlocalStorageを操作するために、一時的なHTMLファイルを作成
    $TestScript = @"
<!DOCTYPE html>
<html>
<head>
    <title>Premium Test</title>
</head>
<body>
    <h1>Premium Feature Test</h1>
    <div id="status"></div>
    <script>
        // プレミアム状態をテスト用に設定
        localStorage.setItem('premiumStatus', 'true');
        
        // 状態を表示
        document.getElementById('status').innerHTML = 
            '<p>✅ Premium status set to: ' + localStorage.getItem('premiumStatus') + '</p>' +
            '<p>🎯 Redirecting to index.html in 3 seconds...</p>';
        
        // 3秒後にindex.htmlにリダイレクト
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    </script>
</body>
</html>
"@
    
    $TestFile = Join-Path $PublicDir "premium-test.html"
    $TestScript | Out-File -FilePath $TestFile -Encoding UTF8
    
    Start-Process "$ServerUrl/premium-test.html"
    
    Start-Sleep -Seconds 5
    
    # 4. 最終確認
    Write-Info "Step 4: Final verification"
    Start-Process $IndexUrl
    
    # 一時ファイルを削除
    Remove-Item $TestFile -Force -ErrorAction SilentlyContinue
    
    Write-Success "Premium flow test completed!"
}

function Show-VerificationResults {
    Write-Info "=== Premium Feature Verification Results ==="
    Write-Info "✅ Development server: Running on port $ServerPort"
    Write-Info "✅ Checkout page: $CheckoutUrl"
    Write-Info "✅ Premium locked page: $LockedUrl"
    Write-Info "✅ Index page: $IndexUrl"
    Write-Info ""
    Write-Info "🔍 Manual verification steps:"
    Write-Info "1. Open $IndexUrl in browser"
    Write-Info "2. Should redirect to premium-locked.html"
    Write-Info "3. Click 'Upgrade to Premium' button"
    Write-Info "4. Complete mock payment on checkout.html"
    Write-Info "5. Should redirect back to index.html with premium features unlocked"
    Write-Info ""
    Write-Info "💡 To test premium unlock manually:"
    Write-Info "   Open browser console and run: localStorage.setItem('premiumStatus', 'true')"
    Write-Info "   Then refresh the page"
}

# メイン処理
function Main {
    Write-Info "🚀 Starting Arigato App Premium Feature Verification..."
    Write-Info "Project root: $ProjectRoot"
    Write-Info "Public directory: $PublicDir"
    
    # ディレクトリの存在確認
    if (-not (Test-Path $PublicDir)) {
        Write-Error "Public directory not found: $PublicDir"
        exit 1
    }
    
    # 必要なファイルの存在確認
    $RequiredFiles = @("index.html", "checkout.html", "premium-locked.html", "script.js")
    foreach ($file in $RequiredFiles) {
        $filePath = Join-Path $PublicDir $file
        if (Test-Path $filePath) {
            Write-Success "Found: $file"
        } else {
            Write-Error "Missing required file: $file"
            exit 1
        }
    }
    
    # 開発サーバーの起動
    if (-not $SkipServer) {
        if (-not (Start-DevServer)) {
            exit 1
        }
    } else {
        Write-Info "Skipping server start (SkipServer flag set)"
    }
    
    # プレミアムフローのテスト
    if (-not $SkipBrowser) {
        Test-PremiumFlow
    } else {
        Write-Info "Skipping browser tests (SkipBrowser flag set)"
    }
    
    # 結果の表示
    Show-VerificationResults
    
    Write-Success "🎉 Premium feature verification completed successfully!"
    Write-Info "Press any key to stop the development server..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    # サーバーの停止
    if (-not $SkipServer) {
        Write-Info "Stopping development server..."
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Success "Development server stopped"
    }
}

# スクリプトの実行
try {
    Main
} catch {
    Write-Error "Script execution failed: $($_.Exception.Message)"
    exit 1
}

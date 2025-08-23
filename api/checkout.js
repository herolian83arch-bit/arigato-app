// 静的サイト用モック課金APIエンドポイント
// http-serverで動作するように修正

// 環境変数の確認
const enablePremiumMock = process.env.ENABLE_PREMIUM_MOCK === 'true';

console.log('🎭 Mock premium mode status:', enablePremiumMock);

// モック課金の成功レスポンス
const mockSuccessResponse = {
  mock: true,
  premium: true,
  message: 'Mock premium access granted successfully',
  timestamp: new Date().toISOString()
};

// エラーレスポンス
const errorResponse = {
  error: 'Mock premium mode not enabled',
  timestamp: new Date().toISOString()
};

// 静的ファイルとして配信するためのHTML
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Checkout API</title>
    <script>
        // モック課金APIの実装
        async function handleCheckout() {
            const enableMock = ${enablePremiumMock};
            
            if (enableMock) {
                console.log('🎭 Mock premium mode enabled - granting premium access');
                return ${JSON.stringify(mockSuccessResponse)};
            } else {
                console.log('⚠️ Mock premium mode disabled');
                throw new Error('Mock premium mode not enabled');
            }
        }

        // POSTリクエストの処理
        if (window.location.search.includes('method=POST')) {
            handleCheckout().then(result => {
                console.log('✅ Mock checkout result:', result);
                // 結果を親ウィンドウに送信
                if (window.parent && window.parent.postMessage) {
                    window.parent.postMessage({
                        type: 'mock-checkout-result',
                        data: result
                    }, '*');
                }
            }).catch(error => {
                console.error('❌ Mock checkout error:', error);
                if (window.parent && window.parent.postMessage) {
                    window.parent.postMessage({
                        type: 'mock-checkout-error',
                        error: error.message
                    }, '*');
                }
            });
        }
    </script>
</head>
<body>
    <h1>Mock Checkout API</h1>
    <p>Status: ${enablePremiumMock ? 'Enabled' : 'Disabled'}</p>
    <p>This is a static file that simulates the checkout API.</p>
    <script>
        // ページ読み込み時に状態を表示
        document.addEventListener('DOMContentLoaded', () => {
            const status = document.createElement('div');
            status.innerHTML = \`
                <h2>API Status</h2>
                <p><strong>Mock Mode:</strong> \${enableMock ? '✅ Enabled' : '❌ Disabled'}</p>
                <p><strong>Timestamp:</strong> \${new Date().toISOString()}</p>
            \`;
            document.body.appendChild(status);
        });
    </script>
</body>
</html>
`;

// ファイルの内容を出力（静的ファイルとして保存）
console.log('📄 Generated static checkout API HTML');
console.log('💾 Save this content as public/api/checkout.html');

// このファイルを実行すると、静的HTMLが生成される
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { htmlContent, mockSuccessResponse, errorResponse };
}

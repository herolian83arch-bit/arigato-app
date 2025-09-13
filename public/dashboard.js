// 管理ダッシュボード用JavaScript
// localStorageからユーザー情報を取得し、Stripe APIから売上データを取得

let revenueChart = null;
let currentPeriod = 'daily';

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard initializing...');
    initializeDashboard();
});

// ダッシュボードの初期化
async function initializeDashboard() {
    try {
        // ローディング表示
        showLoading(true);

        // ユーザー統計の取得と表示
        await loadUserStats();

        // プレミアム利用回数の取得と表示
        await loadPremiumUsageStats();

        // エラーログの取得と表示
        await loadErrorLogs();

        // 売上データの取得と表示
        await loadRevenueData();

        // グラフの初期化
        initializeChart();

        // イベントリスナーの設定
        setupEventListeners();

        // ローディング非表示
        showLoading(false);

        console.log('✅ Dashboard initialized successfully');
    } catch (error) {
        console.error('❌ Dashboard initialization error:', error);
        showError('Failed to initialize dashboard: ' + error.message);
    }
}

// ユーザー統計の読み込み
async function loadUserStats() {
    try {
        // localStorageからユーザー情報を推定
        const userStats = estimateUserStats();

        // 統計カードの更新
        updateStatCard('total-users', userStats.totalUsers);
        updateStatCard('premium-users', userStats.premiumUsers);
        updateStatCard('free-users', userStats.freeUsers);
        updateStatCard('premium-ratio', `${userStats.premiumRatio}%`);
        updateStatCard('free-ratio', `${userStats.freeRatio}%`);

        console.log('✅ User stats loaded:', userStats);
    } catch (error) {
        console.error('❌ User stats loading error:', error);
        throw error;
    }
}

// プレミアム利用回数の読み込み
async function loadPremiumUsageStats() {
    try {
        // localStorageから利用回数を取得
        const premiumUsage = getLocalStorageItem('premiumUsageCount') || 0;
        const audioPlayCount = getLocalStorageItem('audioPlayCount') || 0;
        const favoriteToggleCount = getLocalStorageItem('favoriteToggleCount') || 0;

        const totalUsage = premiumUsage + audioPlayCount + favoriteToggleCount;

        // 統計カードの更新
        updateStatCard('premium-usage', totalUsage);
        updateStatCard('premium-usage-breakdown',
            `Dictionary: ${premiumUsage}, Audio: ${audioPlayCount}, Favorites: ${favoriteToggleCount}`);

        console.log('✅ Premium usage stats loaded:', {
            premiumUsage,
            audioPlayCount,
            favoriteToggleCount,
            totalUsage
        });
    } catch (error) {
        console.error('❌ Premium usage stats loading error:', error);
        // エラーが発生してもダッシュボードは表示する
        updateStatCard('premium-usage', 'Error loading data');
        updateStatCard('premium-usage-breakdown', 'Failed to load usage statistics');
    }
}

// エラーログの読み込み
async function loadErrorLogs() {
    try {
        const errorLogs = getLocalStorageItem('errorLogs') || [];
        const recentLogs = errorLogs.slice(-10); // 最新10件

        const container = document.getElementById('error-logs-container');
        if (!container) return;

        if (recentLogs.length === 0) {
            container.innerHTML = '<div class="error-log-item"><div class="error-message">No errors logged</div></div>';
            return;
        }

        let html = '';
        recentLogs.reverse().forEach(log => {
            const timestamp = new Date(log.timestamp).toLocaleString();
            html += `
                <div class="error-log-item">
                    <div class="error-timestamp">${timestamp}</div>
                    <div class="error-message">${log.message}</div>
                    ${log.context ? `<div class="error-context">Context: ${log.context}</div>` : ''}
                </div>
            `;
        });

        container.innerHTML = html;

        console.log('✅ Error logs loaded:', recentLogs.length, 'recent errors');
    } catch (error) {
        console.error('❌ Error logs loading error:', error);
        const container = document.getElementById('error-logs-container');
        if (container) {
            container.innerHTML = '<div class="error-log-item"><div class="error-message">Failed to load error logs</div></div>';
        }
    }
}

// localStorageからアイテムを安全に取得
function getLocalStorageItem(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Failed to get localStorage item ${key}:`, error);
        return null;
    }
}

// localStorageからユーザー統計を推定
function estimateUserStats() {
    // ローカルストレージからプレミアムユーザー数を推定
    let premiumUsers = 0;
    let totalUsers = 0;

    // 既存のプレミアム機能のlocalStorageキーをチェック
    const premiumKeys = ['premiumActive', 'isPremiumUser', 'premiumStatus'];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && premiumKeys.some(premiumKey => key.includes(premiumKey))) {
            const value = localStorage.getItem(key);
            if (value === 'true' || value === '1') {
                premiumUsers++;
            }
        }
    }

    // 総ユーザー数の推定（localStorageのエントリ数から）
    totalUsers = Math.max(localStorage.length * 2, premiumUsers * 3); // 簡易的な推定

    const freeUsers = totalUsers - premiumUsers;
    const premiumRatio = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;
    const freeRatio = totalUsers > 0 ? Math.round((freeUsers / totalUsers) * 100) : 0;

    return {
        totalUsers,
        premiumUsers,
        freeUsers,
        premiumRatio,
        freeRatio
    };
}

// 売上データの読み込み
async function loadRevenueData() {
    try {
        const response = await fetch('/api/admin-metrics');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 総売上の更新
        updateStatCard('total-revenue', `$${data.totalRevenue.toFixed(2)}`);

        // グラフデータの更新
        updateChartData(data.revenueData);

        console.log('✅ Revenue data loaded:', data);
    } catch (error) {
        console.error('❌ Revenue data loading error:', error);
        // エラーが発生してもダッシュボードは表示する
        updateStatCard('total-revenue', 'Error loading data');
        showError('Failed to load revenue data: ' + error.message);
    }
}

// 統計カードの更新
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// グラフの初期化
function initializeChart() {
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// グラフデータの更新
function updateChartData(data) {
    if (!revenueChart || !data) return;

    revenueChart.data.labels = data.labels;
    revenueChart.data.datasets[0].data = data.values;
    revenueChart.update();
}

// イベントリスナーの設定
function setupEventListeners() {
    // 期間切り替えボタン
    const periodButtons = document.querySelectorAll('.chart-btn[data-period]');
    periodButtons.forEach(button => {
        button.addEventListener('click', function() {
            const period = this.dataset.period;
            switchPeriod(period);
        });
    });

    // エラーログリフレッシュボタン
    const refreshErrorLogsBtn = document.getElementById('refresh-error-logs');
    if (refreshErrorLogsBtn) {
        refreshErrorLogsBtn.addEventListener('click', async function() {
            try {
                showLoading(true);
                await loadErrorLogs();
                showLoading(false);
            } catch (error) {
                console.error('❌ Error logs refresh error:', error);
                showError('Failed to refresh error logs: ' + error.message);
            }
        });
    }
}

// 期間の切り替え
async function switchPeriod(period) {
    if (period === currentPeriod) return;

    currentPeriod = period;

    // ボタンの状態更新
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-period="${period}"]`).classList.add('active');

    // データの再読み込み
    try {
        showLoading(true);
        await loadRevenueData();
        showLoading(false);
    } catch (error) {
        console.error('❌ Period switch error:', error);
        showError('Failed to switch period: ' + error.message);
    }
}

// ローディング表示の制御
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// エラー表示
function showError(message) {
    const errorDiv = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');

    if (errorDiv && errorMessage) {
        errorMessage.textContent = message;
        errorDiv.style.display = 'block';
    }

    // 5秒後にエラーメッセージを非表示
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }, 5000);
}

// データの自動更新（5分ごと）
setInterval(async () => {
    try {
        await loadRevenueData();
        console.log('🔄 Dashboard data refreshed');
    } catch (error) {
        console.error('❌ Auto refresh error:', error);
    }
}, 5 * 60 * 1000); // 5分

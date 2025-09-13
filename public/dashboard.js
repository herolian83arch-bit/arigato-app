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

        // お知らせの読み込みと表示
        await loadAnnouncement();

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

// お知らせの読み込み
async function loadAnnouncement() {
    try {
        const announcement = getLocalStorageItem('adminAnnouncement');
        const textarea = document.getElementById('announcement-text');

        if (textarea) {
            textarea.value = announcement || '';
        }

        console.log('✅ Announcement loaded:', announcement ? 'Present' : 'None');
    } catch (error) {
        console.error('❌ Announcement loading error:', error);
    }
}

// お知らせの保存
function saveAnnouncement() {
    try {
        const textarea = document.getElementById('announcement-text');
        const statusDiv = document.getElementById('announcement-status');

        if (!textarea) {
            throw new Error('Announcement textarea not found');
        }

        const message = textarea.value.trim();

        if (message) {
            localStorage.setItem('adminAnnouncement', JSON.stringify(message));
            showAnnouncementStatus('Announcement saved successfully!', 'success');
            console.log('✅ Announcement saved:', message);
        } else {
            localStorage.removeItem('adminAnnouncement');
            showAnnouncementStatus('Announcement cleared!', 'success');
            console.log('✅ Announcement cleared');
        }
    } catch (error) {
        console.error('❌ Save announcement error:', error);
        showAnnouncementStatus('Failed to save announcement: ' + error.message, 'error');
    }
}

// お知らせのクリア
function clearAnnouncement() {
    try {
        const textarea = document.getElementById('announcement-text');
        const statusDiv = document.getElementById('announcement-status');

        if (textarea) {
            textarea.value = '';
        }

        localStorage.removeItem('adminAnnouncement');
        showAnnouncementStatus('Announcement cleared!', 'success');
        console.log('✅ Announcement cleared');
    } catch (error) {
        console.error('❌ Clear announcement error:', error);
        showAnnouncementStatus('Failed to clear announcement: ' + error.message, 'error');
    }
}

// お知らせステータス表示
function showAnnouncementStatus(message, type) {
    const statusDiv = document.getElementById('announcement-status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `announcement-status ${type}`;

        // 3秒後に非表示
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'announcement-status';
        }, 3000);
    }
}

// CSVエクスポート機能
async function exportToCSV() {
    try {
        const statusDiv = document.getElementById('export-status');
        showExportStatus('Preparing CSV export...', 'info');

        // データを収集
        const userStats = estimateUserStats();
        const premiumUsage = getLocalStorageItem('premiumUsageCount') || 0;
        const audioPlayCount = getLocalStorageItem('audioPlayCount') || 0;
        const favoriteToggleCount = getLocalStorageItem('favoriteToggleCount') || 0;
        const errorLogs = getLocalStorageItem('errorLogs') || [];

        // 売上データを取得
        let revenueData = null;
        try {
            const response = await fetch('/api/admin-metrics');
            if (response.ok) {
                const data = await response.json();
                revenueData = data;
            }
        } catch (error) {
            console.warn('Failed to fetch revenue data for CSV:', error);
        }

        // CSVデータを生成
        const csvData = generateCSVData({
            userStats,
            premiumUsage,
            audioPlayCount,
            favoriteToggleCount,
            errorLogs,
            revenueData
        });

        // ファイルをダウンロード
        downloadCSV(csvData, 'arigato-dashboard-' + new Date().toISOString().split('T')[0] + '.csv');

        showExportStatus('CSV exported successfully!', 'success');
        console.log('✅ CSV exported successfully');

    } catch (error) {
        console.error('❌ CSV export error:', error);
        showExportStatus('Failed to export CSV: ' + error.message, 'error');
    }
}

// CSVデータ生成
function generateCSVData(data) {
    const { userStats, premiumUsage, audioPlayCount, favoriteToggleCount, errorLogs, revenueData } = data;

    let csv = 'Date,Total Users,Premium Users,Free Users,Revenue,Premium Usage (Dictionary),Premium Usage (Audio),Premium Usage (Favorites),Error Count\n';

    const today = new Date().toISOString().split('T')[0];
    const totalRevenue = revenueData ? revenueData.totalRevenue : 0;
    const errorCount = errorLogs.length;

    csv += `${today},${userStats.totalUsers},${userStats.premiumUsers},${userStats.freeUsers},${totalRevenue},${premiumUsage},${audioPlayCount},${favoriteToggleCount},${errorCount}\n`;

    return csv;
}

// CSVファイルダウンロード
function downloadCSV(csvData, filename) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// エクスポートステータス表示
function showExportStatus(message, type) {
    const statusDiv = document.getElementById('export-status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `export-status ${type}`;

        // 5秒後に非表示
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'export-status';
        }, 5000);
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

    // お知らせ保存ボタン
    const saveAnnouncementBtn = document.getElementById('save-announcement');
    if (saveAnnouncementBtn) {
        saveAnnouncementBtn.addEventListener('click', saveAnnouncement);
    }

    // お知らせクリアボタン
    const clearAnnouncementBtn = document.getElementById('clear-announcement');
    if (clearAnnouncementBtn) {
        clearAnnouncementBtn.addEventListener('click', clearAnnouncement);
    }

    // CSVエクスポートボタン
    const exportCsvBtn = document.getElementById('export-csv');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
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

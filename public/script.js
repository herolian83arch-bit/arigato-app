
// 完全な文字エスケープ処理関数
function escape_for_javascript(text) {
  if (!text) return "";

  return text
    .replace(/\\/g, '\\\\')  // バックスラッシュ
    .replace(/'/g, "\\'")       // シングルクォート
    .replace(/"/g, '\\"')       // ダブルクォート
    .replace(/\n/g, '\\n')     // 改行
    .replace(/\r/g, '\\r')     // キャリッジリターン
    .replace(/\t/g, '\\t')     // タブ
    .replace(/\b/g, '\\b')     // バックスペース
    .replace(/\f/g, '\\f');    // フォームフィード
}

let currentLang = 'en';
let currentScene = 'airport';
let languageData = {};
let speechSpeed = 1.0;
let isPremiumUser = false; // プレミアム機能フラグ
let stripe = null;
let elements = null;
let onomatopoeiaData = []; // オノマトペデータ

// 機能フラグ（グローバル設定）
window.FEATURE_FAVORITES = true; // お気に入り機能
window.FEATURE_TTS = true; // 音声再生機能
window.FEATURE_PREMIUM = true; // プレミアム機能

// プレミアム機能利用回数記録システム
function incrementUsageCount(key) {
  try {
    const currentCount = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (currentCount + 1).toString());
    console.log(`📊 Usage count incremented: ${key} = ${currentCount + 1}`);
  } catch (error) {
    console.error(`❌ Failed to increment usage count for ${key}:`, error);
  }
}

function getUsageCount(key) {
  try {
    return parseInt(localStorage.getItem(key) || '0');
  } catch (error) {
    console.error(`❌ Failed to get usage count for ${key}:`, error);
    return 0;
  }
}

// エラーログ収集システム
function logError(error, context = '') {
  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack || '',
      context: context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // 既存のエラーログを取得
    let errorLogs = [];
    try {
      const stored = localStorage.getItem('errorLogs');
      if (stored) {
        errorLogs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse existing error logs:', e);
    }

    // 新しいエラーログを追加
    errorLogs.push(errorLog);

    // 最大100件まで保持（古いものから削除）
    if (errorLogs.length > 100) {
      errorLogs = errorLogs.slice(-100);
    }

    // localStorageに保存
    localStorage.setItem('errorLogs', JSON.stringify(errorLogs));

    console.log(`📝 Error logged: ${error.message || String(error)}`);
  } catch (e) {
    console.error('Failed to log error:', e);
  }
}

function getErrorLogs() {
  try {
    const stored = localStorage.getItem('errorLogs');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get error logs:', error);
    return [];
  }
}

// お知らせ表示機能
function initializeAnnouncement() {
  try {
    // お知らせバナーが既に表示されているかチェック
    if (document.getElementById('announcement-banner')) {
      return;
    }

    // お知らせが閉じられているかチェック
    const isDismissed = localStorage.getItem('announcementDismissed') === 'true';
    if (isDismissed) {
      return;
    }

    // お知らせを取得
    const announcement = getAnnouncement();
    if (!announcement) {
      return;
    }

    // お知らせバナーを表示
    showAnnouncementBanner(announcement);

    console.log('✅ Announcement displayed:', announcement);
  } catch (error) {
    console.error('❌ Announcement initialization error:', error);
  }
}

// お知らせを取得
function getAnnouncement() {
  try {
    const stored = localStorage.getItem('adminAnnouncement');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get announcement:', error);
    return null;
  }
}

// お知らせバナーを表示
function showAnnouncementBanner(message) {
  // バナー要素を作成
  const banner = document.createElement('div');
  banner.id = 'announcement-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    line-height: 1.4;
  `;

  // メッセージ部分
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    flex: 1;
    margin-right: 15px;
  `;
  messageDiv.innerHTML = `📢 <strong>Announcement:</strong> ${message}`;

  // 閉じるボタン
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  `;

  // 閉じるボタンのホバー効果
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.backgroundColor = 'rgba(255,255,255,0.2)';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.backgroundColor = 'transparent';
  });

  // 閉じるボタンのクリックイベント
  closeBtn.addEventListener('click', () => {
    dismissAnnouncement();
  });

  // 要素を組み立て
  banner.appendChild(messageDiv);
  banner.appendChild(closeBtn);

  // ページの先頭に挿入
  document.body.insertBefore(banner, document.body.firstChild);

  // ページのコンテンツを下にずらす
  document.body.style.paddingTop = '60px';
}

// お知らせを閉じる
function dismissAnnouncement() {
  try {
    const banner = document.getElementById('announcement-banner');
    if (banner) {
      banner.remove();
    }

    // ページのコンテンツのパディングを元に戻す
    document.body.style.paddingTop = '0';

    // 閉じたフラグを保存
    localStorage.setItem('announcementDismissed', 'true');

    console.log('✅ Announcement dismissed');
  } catch (error) {
    console.error('❌ Dismiss announcement error:', error);
  }
}

// グローバルコントロールガードの初期化
function initializeGlobalControlGuards() {
  // コントロール要素からのイベントをキャプチャ段階で一括無視
  const guard = (ev) => {
    const target = ev.target || ev.currentTarget;
    if (target && target.closest && target.closest('[data-card-control="true"]')) {
      // キャプチャ段階で止める：下層/上層どちらのハンドラも発火させない
      if (ev.preventDefault) ev.preventDefault();
      if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      if (ev.stopPropagation) ev.stopPropagation();

      // デバッグ用（必要に応じて削除）
      console.log('Global guard: blocked event from control element', ev.type, ev.target);
      return;
    }
  };

  // キャプチャ = 第3引数 true
  document.addEventListener('pointerdown', guard, true);
  document.addEventListener('click', guard, true);
  document.addEventListener('mousedown', guard, true); // 一部UIライブラリ対策
  document.addEventListener('touchstart', guard, true); // モバイル対応

  console.log('Global control guards attached');
}

// サポートされている言語の定義
const supportedLanguages = {
  'en': 'English',
  'ja': '日本語',
  'zh': '中文',
  'ko': '한국어',
  'pt': 'Português',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'it': 'Italiano',
  'ru': 'Русский',
  'tw': '繁體中文'
};

document.addEventListener('DOMContentLoaded', async () => {
  // グローバルエラーハンドラーの設定
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), 'Global Error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError(new Error(event.reason), 'Unhandled Promise Rejection');
  });

  // お知らせ表示機能の初期化
  initializeAnnouncement();

  // ヘルスチェックを一時的に無効化（プレミアム機能の動作確認のため）
  // try {
  //   await performHealthCheck();
  // } catch (error) {
  //   console.error('❌ Health check failed:', error);
  //   // ヘルスチェック失敗時もアプリは起動する
  // }

  // お気に入り機能の初期化
  initializeFavorites();

  // グローバルコントロールガードを一時的に無効化（機能回復のため）
  // initializeGlobalControlGuards();

  loadLanguage(currentLang);
  checkPremiumStatus(); // プレミアム状態をチェック
  loadOnomatopoeiaData(); // オノマトペデータを読み込み
  updateTTSToggleButton(); // TTSボタンの状態を更新

  // Stripe Checkout の結果をチェック
  checkStripeCheckoutResult();

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.onclick = () => {
      currentLang = btn.dataset.lang;
      loadLanguage(currentLang);
    };
  });

  // スピードスライダーのイベント
  const speedSlider = document.getElementById('speechSpeed');
  const speedValue = document.getElementById('speedValue');
  if (speedSlider && speedValue) {
    speedSlider.addEventListener('input', function() {
      speechSpeed = parseFloat(this.value);
      speedValue.textContent = `${speechSpeed.toFixed(2)}x`;
    });
  }

  // プレミアムモーダルのイベントリスナーを設定
  initializePremiumModal();
});

// 起動時ヘルスチェック
async function performHealthCheck() {
  try {
    console.log('🔍 Performing health check...');

    const response = await fetch('/api/payment/create-payment-intent');
    const raw = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.ok === true) {
          console.log('✅ Health check passed:', data);
          return true;
        } else {
          throw new Error('Health check response is invalid');
        }
      } catch (e) {
        throw new Error(`Invalid JSON response: ${raw.slice(0, 200)}`);
      }
    } else {
      throw new Error('Empty health check response');
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);

    // ユーザーに警告を表示
    const warningMessage = `API Health Check Failed: ${error.message}\n\nThis may affect premium features. Please check the server status.`;
    console.warn(warningMessage);

    // 開発環境ではアラートを表示
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      alert(`⚠️ API Health Check Failed\n\n${error.message}\n\nPlease restart the server or check the configuration.`);
    }

    throw error;
  }
}

// お気に入り機能の初期化
function initializeFavorites() {
  // 機能フラグが無効の場合は何もしない
  if (!window.FEATURE_FAVORITES) {
    console.log('Favorites feature is disabled');
    return;
  }

  // お気に入りAPIの初期化
  try {
    // 既存のlocalStorageデータを新しいスキーマに移行
    const oldFavorites = localStorage.getItem('favorites');
    if (oldFavorites) {
      try {
        const parsed = JSON.parse(oldFavorites);
        const newFavorites = {};

        // 古いキー形式（lang-scene-number）から新しいID形式に変換
        Object.entries(parsed).forEach(([key, value]) => {
          if (value === true) {
            // キーが既にID形式の場合はそのまま使用
            if (/^\d+$/.test(key)) {
              newFavorites[key] = true;
            }
          }
        });

        // 新しいスキーマで保存
        if (Object.keys(newFavorites).length > 0) {
          localStorage.setItem('arigato_favorites_v1', JSON.stringify(newFavorites));
        }

        // 古いデータを削除
        localStorage.removeItem('favorites');
        console.log('Migrated old favorites data to new schema');
      } catch (error) {
        console.warn('Failed to migrate old favorites data:', error);
      }
    }
  } catch (error) {
    console.warn('Failed to initialize favorites:', error);
  }
}

// 動的翻訳機能は事前生成方式に移行済み

// 言語データを読み込み（事前生成翻訳ファイル対応）
async function loadLanguage(lang) {
  try {
    console.log(`🌐 言語切替開始: ${lang}`);

    // 事前生成された翻訳ファイルから読み込み
    const response = await fetch(`locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`翻訳ファイルの読み込みに失敗: ${response.status}`);
    }

    languageData = await response.json();
    currentLang = lang;

    // UI即座更新（スケルトンUIなし）
    renderSceneSwitcher();
    renderScene();

    // 検索ボックスのプレースホルダーを更新
    updateSearchPlaceholder();

    console.log(`✅ 言語切替完了: ${lang}`);

    // バックグラウンドで前後2言語をプリフェッチ
    preloadAdjacentLanguages(lang);

  } catch (error) {
    console.error('Language loading error:', error);
    // エラー時は英語にフォールバック
    if (lang !== 'en') {
      console.log('🔄 英語にフォールバック中...');
      await loadLanguage('en');
    }
  }
}

// 前後2言語をプリフェッチ（パフォーマンス向上）
async function preloadAdjacentLanguages(currentLang) {
  const supportedLanguages = ['en', 'ja', 'zh', 'ko', 'fr', 'de', 'it', 'tw'];
  const currentIndex = supportedLanguages.indexOf(currentLang);

  if (currentIndex === -1) return;

  const adjacentLangs = [];

  // 前の言語
  if (currentIndex > 0) {
    adjacentLangs.push(supportedLanguages[currentIndex - 1]);
  }

  // 次の言語
  if (currentIndex < supportedLanguages.length - 1) {
    adjacentLangs.push(supportedLanguages[currentIndex + 1]);
  }

  // バックグラウンドでプリフェッチ
  for (const lang of adjacentLangs) {
    try {
      const response = await fetch(`locales/${lang}.json`);
      if (response.ok) {
        console.log(`🔄 プリフェッチ完了: ${lang}`);
      }
    } catch (error) {
      console.log(`⚠️ プリフェッチ失敗: ${lang}`, error);
    }
  }
}

// 辞書データを読み込む関数
async function loadDictionary() {
  // public 配下の最有力パスから順に読み込み
  const paths = [
    '/locales/onomatopoeia-premium-all-41-scenes.json',
    '/locales/onomatopoeia-all-scenes.json'
  ];
  for (const p of paths) {
    try {
      const res = await fetch(p, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();

        return data;
      }
    } catch {}
  }

  return [];
}

// オノマトペデータを読み込み
async function loadOnomatopoeiaData() {
  try {
    // dictionary.jsonを直接読み込み
    const response = await fetch('/data/dictionary.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const rawData = await response.json();

    // romajiを大文字に変換
    onomatopoeiaData = rawData.map(item => ({
      ...item,
      romaji: item.romaji ? item.romaji.toUpperCase() : item.romaji
    }));

    console.log(`📚 Loaded ${onomatopoeiaData.length} onomatopoeia entries`);

    // === Onomatopoeia TTS: 日本語原文を固定保持（翻訳で上書きされない）
    const JPSEN_MAP = new Map(onomatopoeiaData.map(it => [it.id, it.jpsen]));
    // （デバッグ用）必要ならウィンドウへ露出
    if (typeof window !== 'undefined') window.__JPSEN_MAP__ = JPSEN_MAP;
  } catch (error) {
    console.error('オノマトペデータの読み込みに失敗:', error);
    onomatopoeiaData = [];
  }
}

// プレミアム機能のチェック
function checkPremiumStatus() {
  const premiumStatus = localStorage.getItem('premiumActive');
  isPremiumUser = premiumStatus === 'true';

  // 開発環境でのテスト用（一時的にプレミアム状態を有効化）
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // テスト用：プレミアム状態を強制的に有効化（ローカル環境のみ）
    isPremiumUser = true;
    localStorage.setItem('premiumActive', 'true');
    console.log('🧪 テスト環境: プレミアム機能を強制有効化');
  }

  updatePremiumUI();
}

// プレミアムUIの更新
function updatePremiumUI() {
  const premiumBtn = document.getElementById('premium-btn');
  if (premiumBtn) {
    if (isPremiumUser) {
      premiumBtn.textContent = 'Premium Active';
      premiumBtn.style.backgroundColor = '#4CAF50';
      premiumBtn.disabled = false;
      premiumBtn.onclick = () => window.location.href = 'premium-features.html'; // プレミアム機能選択画面に遷移
    } else {
      premiumBtn.textContent = 'Upgrade to Premium';
      premiumBtn.style.backgroundColor = '#FF9800';
      premiumBtn.disabled = false;
      premiumBtn.onclick = showPremiumModal; // プレミアム機能モーダルを表示
    }
  }
}

// プレミアム機能モーダルを表示
function showPremiumModal() {
  const modal = document.getElementById('premium-modal');
  modal.style.display = 'block';
}

// プレミアム機能モーダルを閉じる
function closePremiumModal() {
  const modal = document.getElementById('premium-modal');
  modal.style.display = 'none';
}

// プレミアムモーダルの初期化
function initializePremiumModal() {
  const modal = document.getElementById('premium-modal');
  const closeBtn = document.getElementById('premium-close');

  if (closeBtn) {
    closeBtn.addEventListener('click', closePremiumModal);
  }

  // 背景クリックでモーダルを閉じる
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closePremiumModal();
      }
    });
  }

  // Escキーでモーダルを閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
      closePremiumModal();
    }
  });
}

// オノマトペ辞典モーダルを表示
async function showOnomatopoeiaModal() {
  if (!isPremiumUser) {
    alert('この機能はプレミアム専用です。プレミアムにアップグレードしてください。');
    return;
  }

  // オノマトペ辞典アクセス回数を記録
  incrementUsageCount('premiumUsageCount');

  const modal = document.getElementById('onomatopoeia-modal');
  modal.style.display = 'block';
  await showOnomatopoeiaScenes();
}

// オノマトペ辞典モーダルを閉じる
function closeOnomatopoeiaModal() {
  const modal = document.getElementById('onomatopoeia-modal');
  modal.style.display = 'none';
}

// オノマトペシーン一覧を表示
async function showOnomatopoeiaScenes() {
  const scenesContainer = document.getElementById('onomatopoeia-scenes');
  const contentContainer = document.getElementById('onomatopoeia-content');
  const searchContainer = document.getElementById('search-container');

  scenesContainer.style.display = 'block';
  contentContainer.style.display = 'none';
  searchContainer.style.display = 'block';

  // オノマトペデータの存在確認と再読み込み
  if (onomatopoeiaData.length === 0) {
    console.log('🔄 オノマトペデータが空のため再読み込み中...');
    try {
      await loadOnomatopoeiaData();
      console.log(`✅ オノマトペデータ読み込み完了: ${onomatopoeiaData.length}件`);
    } catch (error) {
      console.error('❌ オノマトペデータの再読み込みに失敗:', error);
      // エラーの場合は空のシーンを表示
      renderOnomatopoeiaScenes({});
      return;
    }
  }

  // 検索ボックスのイベントリスナーを設定
  setupOnomatopoeiaSearch();

  // シーンをグループ化
  const sceneGroups = {};
  onomatopoeiaData.forEach(item => {
    if (!sceneGroups[item.scene]) {
      sceneGroups[item.scene] = [];
    }
    sceneGroups[item.scene].push(item);
  });

  renderOnomatopoeiaScenes(sceneGroups);
}

// オノマトペ検索機能のセットアップ
function setupOnomatopoeiaSearch() {
  const searchBox = document.getElementById('onomatopoeia-search-box');
  const resultsCount = document.getElementById('search-results-count');

  if (!searchBox) return;

  // プレースホルダーの多言語対応
  const placeholders = {
    'ja': 'オノマトペを検索...',
    'en': 'Search onomatopoeia...',
    'zh': '搜索拟声词...',
    'ko': '의성어 검색...',
    'fr': 'Rechercher des onomatopées...',
    'de': 'Onomatopöie suchen...',
    'it': 'Cerca onomatopee...',
    'tw': '搜尋擬聲詞...'
  };

  searchBox.placeholder = placeholders[currentLang] || placeholders['en'];

  // 検索実行
  searchBox.addEventListener('input', function() {
    const searchTerm = this.value.trim().toUpperCase();
    performOnomatopoeiaSearch(searchTerm);
  });

  // 初期表示
  performOnomatopoeiaSearch('');
}

// オノマトペ検索実行
function performOnomatopoeiaSearch(searchTerm) {
  const scenesContainer = document.getElementById('onomatopoeia-scenes');
  const resultsCount = document.getElementById('search-results-count');

  // シーンをグループ化
  const sceneGroups = {};
  let totalMatches = 0;
  let matchedScenes = 0;

  onomatopoeiaData.forEach(item => {
    if (!sceneGroups[item.scene]) {
      sceneGroups[item.scene] = [];
    }

    // romajiフィールドから《》内のオノマトペを抽出して検索
    const onomatopoeiaMatches = extractOnomatopoeiaFromRomaji(item.romaji);
    const hasMatch = searchTerm === '' || onomatopoeiaMatches.some(onomatopoeia =>
      onomatopoeia.includes(searchTerm)
    );

    if (hasMatch) {
      sceneGroups[item.scene].push(item);
      totalMatches++;
    }
  });

  // マッチしたシーンのみカウント
  matchedScenes = Object.keys(sceneGroups).filter(scene => sceneGroups[scene].length > 0).length;

  // 結果表示
  if (searchTerm === '') {
    resultsCount.textContent = '';
  } else {
    resultsCount.textContent = `${matchedScenes}個のシーンで${totalMatches}件のオノマトペが見つかりました`;
  }

  renderOnomatopoeiaScenes(sceneGroups, searchTerm);
}

// romajiフィールドから《》内のオノマトペを抽出
function extractOnomatopoeiaFromRomaji(romaji) {
  if (!romaji) return [];
  const matches = romaji.match(/《([^》]*)》/g);
  return matches ? matches.map(match => match.replace(/[《》]/g, '')) : [];
}

// シーンカードのレンダリング
function renderOnomatopoeiaScenes(sceneGroups, searchTerm = '') {
  const scenesContainer = document.getElementById('onomatopoeia-scenes');

  let html = '<div class="scene-grid">';
  Object.keys(sceneGroups).forEach(scene => {
    const count = sceneGroups[scene].length;
    const hasMatches = count > 0;
    const cardClass = hasMatches ? 'scene-card' : 'scene-card search-no-match';

    html += `
      <div class="${cardClass}" onclick="showOnomatopoeiaScene('${scene}')" ${!hasMatches ? 'style="pointer-events: none;"' : ''}>
        <div class="scene-icon">📚</div>
        <div class="scene-title">${scene}</div>
        <div class="scene-count">${count}例文</div>
      </div>
    `;
  });
  html += '</div>';

  scenesContainer.innerHTML = html;
}

// 検索ボックスのプレースホルダーを更新
function updateSearchPlaceholder() {
  const searchBox = document.getElementById('onomatopoeia-search-box');
  if (!searchBox) return;

  const placeholders = {
    'ja': 'オノマトペを検索...',
    'en': 'Search onomatopoeia...',
    'zh': '搜索拟声词...',
    'ko': '의성어 검색...',
    'fr': 'Rechercher des onomatopées...',
    'de': 'Onomatopöie suchen...',
    'it': 'Cerca onomatopee...',
    'tw': '搜尋擬聲詞...'
  };

  searchBox.placeholder = placeholders[currentLang] || placeholders['en'];
}

// オノマトペシーンの詳細を表示
async function showOnomatopoeiaScene(scene) {
  const scenesContainer = document.getElementById('onomatopoeia-scenes');
  const contentContainer = document.getElementById('onomatopoeia-content');
  const examplesContainer = document.getElementById('onomatopoeia-examples');
  const searchContainer = document.getElementById('search-container');

  scenesContainer.style.display = 'none';
  contentContainer.style.display = 'block';
  searchContainer.style.display = 'none';

  const sceneItems = onomatopoeiaData.filter(item => item.scene === scene);



  let html = `<h3>${scene}</h3>`;

  for (const item of sceneItems) {
    // 音声再生機能の有効/無効チェック
    const isTTSEnabled = localStorage.getItem('feature_tts') === '1' ||
                         (typeof window !== 'undefined' && window.speechSynthesis);

    html += `
      <div class="onomatopoeia-item" data-testid="dict-row" onclick="handleOnomatopoeiaItemClick(event, ${item.id})">
        <div class="item-header">
          <div class="item-number">${item.id}</div>
          <div class="item-actions" style="display:inline-flex;align-items:center;">
            ${isTTSEnabled ? `
              <button class="speak-btn" onclick="playOnomatopoeiaFromDictionary(${item.id})" aria-label="音声再生" style="background:none;border:none;cursor:pointer;font-size:1.2em;margin-left:12px;" data-card-control="true">
                🔊
              </button>
            ` : ''}
            ${window.FEATURE_FAVORITES ? `
              <button class="favorite-toggle-btn" data-card-control="true" aria-label="お気に入りに追加" style="background:none;border:none;cursor:pointer;padding:8px;margin-left:12px;font-size:1.3em;color:#bbb;min-width:40px;min-height:40px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s ease;border-radius:4px;position:relative;z-index:10;pointer-events:auto;">
                ${isFavorite(item.id) ? '★' : '☆'}
              </button>
            ` : ''}
          </div>
        </div>
        <div class="item-main">${item.main}</div>
        <div class="item-romaji">${item.romaji}</div>
        <div class="item-description">${item.description?.ja || ''}</div>
      </div>
    `;
  }

  examplesContainer.innerHTML = html;
}

// 決済モーダルを表示
function showPaymentModal() {
  const modal = document.getElementById('payment-modal');
  modal.style.display = 'block';

  // Stripe Elementsを初期化（重複作成を防ぐ）
  if (!stripe) {
    // 環境変数から取得するか、デフォルト値を使用
    const publishableKey = 'pk_test_51RqsyyGWVvTYb0YWIKOq10sybzWD8e7XKXObY7Tj0dfotoGeOgvlXDEfpymqmXLSwbcz2iVbZ0Hpa800xCMSebA000SGTwfMcA';
    stripe = Stripe(publishableKey);
    elements = stripe.elements();
  }

  // 既存のカード要素をクリア
  const cardElement = document.getElementById('card-element');
  if (cardElement) {
    cardElement.innerHTML = '';
  }

  // 既存のcard要素が存在する場合は削除
  if (window.currentCardElement) {
    try {
      window.currentCardElement.destroy();
    } catch (e) {
      console.log('Previous card element already destroyed');
    }
  }

  const card = elements.create('card', {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true, // 郵便番号フィールドを隠す
  });

  // カード要素をマウント
  card.mount('#card-element');

  // 現在のカード要素を保存（後で削除用）
  window.currentCardElement = card;
}

// 決済モーダルを閉じる
function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  modal.style.display = 'none';
}

// 決済処理（Stripe Checkout 対応版）
async function processPayment() {
  const payButton = document.getElementById('pay-button');
  payButton.disabled = true;
  payButton.textContent = 'Processing...';

  try {
    console.log('🔍 Starting Stripe Checkout process...');

    // Stripe Checkout セッションを作成
    const response = await fetch('/api/payment/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const session = await response.json();

    if (session.url) {
      // Stripe Checkout ページにリダイレクト
      window.location.href = session.url;
    } else {
      throw new Error('No checkout URL received');
    }

  } catch (error) {
    console.error('❌ Stripe Checkout error:', error);

    // より詳細なエラー情報を表示（文字化け防止）
    let errorMessage = 'Payment error occurred.';

    if (error.message.includes('HTTP 500')) {
      errorMessage = 'Server error: Please try again later or contact support.';
    } else if (error.message.includes('HTTP 404')) {
      errorMessage = 'Service not found: Please check the server status.';
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network error: Please check your internet connection.';
    } else {
      errorMessage = `Payment error: ${error.message}`;
    }

    alert(`❌ ${errorMessage}`);
  } finally {
    payButton.disabled = false;
    payButton.textContent = 'Pay $5.00';
  }
}

// 決済結果のチェックと処理
async function checkStripeCheckoutResult() {
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get('success');
  const canceled = urlParams.get('canceled');

  if (success === 'true') {
    console.log('🎉 Stripe Checkout successful!');
    try {
      localStorage.setItem('premiumActive', 'true');
      isPremiumUser = true;
      updatePremiumUI();
      alert('✅ Premium upgrade successful! You now have access to premium features.');
      closePaymentModal();
    } catch (error) {
      console.error('❌ Error updating premium status:', error);
      alert('✅ Premium upgrade successful! Please refresh the page to access premium features.');
    }
  } else if (canceled === 'true') {
    console.log('❌ Stripe Checkout canceled.');
    alert('Payment was canceled. You can try again or upgrade later.');
    closePaymentModal();
  }
}

function renderSceneSwitcher() {
  const switcherDiv = document.getElementById('scene-switcher');
  switcherDiv.innerHTML = '';
  if (!languageData.scenes) return;
  // 並び順を明示的に指定
  const sceneOrder = ['airport', 'hotel', 'restaurant', 'shopping', 'transportation'];
  sceneOrder.forEach(sceneKey => {
    if (!languageData.scenes[sceneKey]) return;
    const btn = document.createElement('button');
    btn.className = 'scene-btn' + (sceneKey === currentScene ? ' active' : '');
    btn.textContent = sceneKey;
    btn.onclick = () => {
      currentScene = sceneKey;
      renderSceneSwitcher();
      renderScene();
    };
    switcherDiv.appendChild(btn);
  });
}

// お気に入り機能のAPI（新しいスキーマ対応）
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('arigato_favorites_v1') || '{}');
  } catch {
    return {};
  }
}

function setFavorites(favs) {
  try {
    localStorage.setItem('arigato_favorites_v1', JSON.stringify(favs));
  } catch (error) {
    console.warn('Failed to save favorites:', error);
  }
}

// お気に入り状態の確認（ID基準）
function isFavorite(id) {
  if (!id) return false;
  const favorites = getFavorites();
  return favorites[String(id)] === true;
}

// お気に入りの切り替え（ID基準）
function toggleFavorite(id) {
  if (!id) return false;

  // お気に入り利用回数を記録
  incrementUsageCount('favoriteToggleCount');

  const favorites = getFavorites();
  const stringId = String(id);
  const currentState = favorites[stringId] || false;
  const newState = !currentState;

  favorites[stringId] = newState;
  setFavorites(favorites);

  return newState;
}

// オノマトペアイテムクリックハンドラー
window.handleOnomatopoeiaItemClick = function(event, itemId) {
  // コントロール要素からのクリックは無視
  if (event.target && event.target.closest('[data-card-control="true"]')) {
    event.preventDefault();
    event.stopPropagation();

    // お気に入りボタンの場合はトグル処理
    if (event.target.classList.contains('favorite-toggle-btn')) {
      const newState = toggleFavorite(itemId);

      // UI更新
      if (newState) {
        event.target.innerHTML = '★';
        event.target.style.color = '#ffd700';
        event.target.style.transform = 'scale(1.1)';
        event.target.setAttribute('aria-label', 'お気に入りから削除');
        event.target.setAttribute('aria-pressed', 'true');
      } else {
        event.target.innerHTML = '☆';
        event.target.style.color = '#bbb';
        event.target.style.transform = 'scale(1)';
        event.target.setAttribute('aria-label', 'お気に入りに追加');
        event.target.setAttribute('aria-pressed', 'false');
      }
    }
    return;
  }

  // ここに既存のカードクリック処理（詳細表示や遷移など）を追加可能
  console.log('オノマトペアイテムがクリックされました:', itemId);
};

// グローバルAPIとして登録（既存コードとの互換性）
window.getFavorites = getFavorites;
window.setFavorites = setFavorites;
window.isFavorite = isFavorite;
window.toggleFavorite = toggleFavorite;
function renderScene() {
  const scene = languageData.scenes[currentScene];
  document.getElementById('scene-title').textContent = scene ? currentScene : '';
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = '';

  if (scene) {
    scene.messages.forEach((msg, idx) => {
      const card = document.createElement('div');
      card.className = 'message-card';

      // カードクリックのガード機能を追加
      card.addEventListener('click', function(e) {
        // コントロール要素からのクリックは無視
        if (e.target && e.target.closest('[data-card-control="true"]')) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // ここに既存のカードクリック処理（詳細表示や遷移など）を追加可能
        console.log('カード本体がクリックされました:', messageId);
      });

      // メッセージのIDを取得（numberまたはインデックス）
      const messageId = msg.number || (idx + 1);

      // カードのHTMLを構築（お気に入りボタンは後で動的に追加）
      card.innerHTML = `
        <div class="message-header">
          <span class="message-number" style="font-weight:bold;margin-right:8px;">${messageId}.</span>
          <div class="message-actions" style="display:inline-flex;align-items:center;">
            <button class="speak-btn" style="margin-left:12px;background:none;border:none;cursor:pointer;font-size:1.2em;" onclick="playAudioWithFallback('', '${escape_for_javascript((msg.ja || msg.jpsen || '').replace(/<[^>]+>/g, ''))}', 'ja-JP')" aria-label="音声再生" data-card-control="true">🔊</button>
          </div>
        </div>
        <div class="message-content" style="display:inline-block;">
          <div class="message-text" style="font-weight:bold;margin-bottom:4px;">${msg.text || ''}</div>
          <div class="romaji-text" style="font-size:0.9em;color:#666;margin-bottom:4px;">${msg.romaji || ''}</div>
        </div>
        <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
      `;

      messagesDiv.appendChild(card);

      // お気に入りボタンを動的に追加（機能フラグが有効な場合のみ）
      if (window.FEATURE_FAVORITES) {
        const actionsContainer = card.querySelector('.message-actions');
        if (actionsContainer) {
          // お気に入りボタンの作成
          const favoriteBtn = document.createElement('button');
          favoriteBtn.className = 'favorite-toggle-btn';
          favoriteBtn.setAttribute('type', 'button');
          favoriteBtn.setAttribute('role', 'button');
          favoriteBtn.setAttribute('tabindex', '0');
          favoriteBtn.setAttribute('aria-label', 'お気に入りに追加');
          favoriteBtn.setAttribute('aria-pressed', 'false');
          favoriteBtn.setAttribute('data-card-control', 'true');

          // スタイル設定
          favoriteBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            margin-left: 12px;
            font-size: 1.3em;
            color: #bbb;
            user-select: none;
            min-width: 40px;
            min-height: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            border-radius: 4px;
          `;

          // 初期アイコン（☆）
          favoriteBtn.innerHTML = '☆';

          // お気に入り状態の確認と設定
          const isFav = isFavorite(messageId);
          if (isFav) {
            favoriteBtn.innerHTML = '★';
            favoriteBtn.style.color = '#ffd700';
            favoriteBtn.style.transform = 'scale(1.1)';
            favoriteBtn.setAttribute('aria-label', 'お気に入りから削除');
            favoriteBtn.setAttribute('aria-pressed', 'true');
          }

          // スタイル設定の強化
          favoriteBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            margin-left: 12px;
            font-size: 1.3em;
            color: #bbb;
            user-select: none;
            min-width: 40px;
            min-height: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            border-radius: 4px;
            position: relative;
            z-index: 10;
            pointer-events: auto;
          `;

          // 最小実装：必要最小限のガードのみ
          favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 親への伝播のみ防止

            const newState = toggleFavorite(messageId);

            // UI更新
            if (newState) {
              favoriteBtn.innerHTML = '★';
              favoriteBtn.style.color = '#ffd700';
              favoriteBtn.style.transform = 'scale(1.1)';
              favoriteBtn.setAttribute('aria-label', 'お気に入りから削除');
              favoriteBtn.setAttribute('aria-pressed', 'true');
            } else {
              favoriteBtn.innerHTML = '☆';
              favoriteBtn.style.color = '#bbb';
              favoriteBtn.style.transform = 'scale(1)';
              favoriteBtn.setAttribute('aria-label', 'お気に入りに追加');
              favoriteBtn.setAttribute('aria-pressed', 'false');
            }
          });

          // キーボードイベント（Enter, Space）
          favoriteBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              favoriteBtn.click();
            }
          });

          // ホバー効果
          favoriteBtn.addEventListener('mouseenter', () => {
            if (!isFavorite(messageId)) {
              favoriteBtn.style.color = '#ffd700';
              favoriteBtn.style.transform = 'scale(1.1)';
            }
          });

          favoriteBtn.addEventListener('mouseleave', () => {
            if (!isFavorite(messageId)) {
              favoriteBtn.style.color = '#bbb';
              favoriteBtn.style.transform = 'scale(1)';
            }
          });

          actionsContainer.appendChild(favoriteBtn);
        }
      }
    });
  }
}

// プレミアム機能の実装
function enablePremiumFeatures() {
  if (!isPremiumUser) {
    showPremiumPrompt();
    return;
  }

  // プレミアム機能を有効化
  enableAdvancedAudio();
  enableDictionaryFeature();
  enableCustomBackgrounds();
  enableOfflineMode();
}

// プレミアムプロンプト表示
function showPremiumPrompt() {
  alert('✨ This feature is available for Premium users!\n\nUpgrade to Premium to unlock:\n• Dictionary integration\n• My Favorites');
}

// 高度な音声機能
function enableAdvancedAudio() {
  // 高品質音声の実装
  console.log('Advanced audio enabled');
}

// 辞書機能
function enableDictionaryFeature() {
  // 辞書機能の実装
  console.log('Dictionary feature enabled');
}

// カスタム背景機能
function enableCustomBackgrounds() {
  // 背景カスタマイズ機能の実装
  console.log('Custom backgrounds enabled');
}

// オフラインモード
function enableOfflineMode() {
  // オフライン機能の実装
  console.log('Offline mode enabled');
}

// 音声再生機能（MP3優先＋Web Speech APIフォールバック）
let currentAudio = null; // 現在再生中の音声を管理

// 音声再生の改善（プレミアム機能）
window.playJapaneseSpeech = function(japaneseText) {
  // 音声再生利用回数を記録
  incrementUsageCount('audioPlayCount');

  // 「音」単体の発音を訓読み「おと」に修正
  let correctedText = japaneseText;
  // 「音」が単体で現れる場合（前後に漢字がない場合）を訓読みに
  correctedText = correctedText.replace(/(?<![一-龯])音(?![一-龯])/g, 'おと');

  if (isPremiumUser) {
    // プレミアム音声機能
    const utter = new SpeechSynthesisUtterance(correctedText);
    utter.lang = 'ja-JP';
    utter.rate = speechSpeed;
    utter.pitch = 1.2; // プレミアム機能：音声の高さを調整
    utter.volume = 0.9; // プレミアム機能：音量を調整
    speechSynthesis.speak(utter);
  } else {
    // 通常の音声機能
    const utter = new SpeechSynthesisUtterance(correctedText);
    utter.lang = 'ja-JP';
    utter.rate = speechSpeed;
    speechSynthesis.speak(utter);
  }
};

window.playRomajiSpeech = function(romajiText) {
  // 音声再生利用回数を記録
  incrementUsageCount('audioPlayCount');

  const utter = new SpeechSynthesisUtterance(romajiText);
  utter.lang = 'en-US';
  utter.rate = speechSpeed;
  speechSynthesis.speak(utter);
};

// 音声再生機能の切り替え
function toggleTTS() {
  const currentState = localStorage.getItem('feature_tts');
  const newState = currentState === '1' ? '0' : '1';
  localStorage.setItem('feature_tts', newState);

  updateTTSToggleButton();

  // オノマトペモーダルが開いている場合は再描画
  if (document.getElementById('onomatopoeia-modal').style.display !== 'none') {
    const currentScene = document.querySelector('#onomatopoeia-content h3')?.textContent;
    if (currentScene) {
      showOnomatopoeiaScene(currentScene);
    }
  }
}

// TTSボタンの状態を更新
function updateTTSToggleButton() {
  const ttsBtn = document.getElementById('tts-toggle-btn');
  if (ttsBtn) {
    const isEnabled = localStorage.getItem('feature_tts') === '1';
    ttsBtn.classList.toggle('active', isEnabled);
    ttsBtn.title = isEnabled ? '音声再生機能: 有効' : '音声再生機能: 無効';
  }
}

// 新規音声再生機能（MP3優先＋Web Speech APIフォールバック）
function playAudioWithFallback(audioPath, text, language = 'ja-JP') {
  // 既存の音声を停止
  stopCurrentAudio();

  if (audioPath) {
    // MP3ファイルが指定されている場合
    console.log(`🎵 MP3ファイルを再生: ${audioPath}`);

    try {
      // 音声オブジェクトを作成
      const audio = new Audio(audioPath);

      // エラーハンドリング
      audio.onerror = function() {
        console.error(`❌ MP3ファイルの再生に失敗: ${audioPath}`);
        // MP3再生失敗時はWeb Speech APIでフォールバック
        if (text) {
          console.log(`🔄 Web Speech APIでフォールバック: ${text}`);
          playTextWithTTS(text, language);
        }
      };

      // 再生成功時のログ
      audio.oncanplay = function() {
        console.log(`✅ MP3ファイルの再生開始: ${audioPath}`);
      };

      // 再生完了時の処理
      audio.onended = function() {
        console.log(`✅ MP3ファイルの再生完了: ${audioPath}`);
        currentAudio = null;
      };

      // 現在の音声として設定
      currentAudio = audio;

      // 音声を再生
      audio.play().catch(error => {
        console.error(`❌ 音声再生エラー: ${error.message}`);
        // 再生失敗時もWeb Speech APIでフォールバック
        if (text) {
          console.log(`🔄 Web Speech APIでフォールバック: ${text}`);
          playTextWithTTS(text, language);
        }
      });

    } catch (error) {
      console.error(`❌ MP3ファイル処理エラー: ${error.message}`);
      // エラー時もWeb Speech APIでフォールバック
      if (text) {
        playTextWithTTS(text, language);
      }
    }

  } else if (text) {
    // MP3ファイルが指定されていない場合、Web Speech APIで読み上げ
    console.log(`🗣️ Web Speech APIで読み上げ: ${text}`);
    playTextWithTTS(text, language);

  } else {
    console.warn("⚠️ 音声再生に必要な属性が不足しています。audioPath または text を指定してください。");
  }
}

// 現在再生中の音声を停止
function stopCurrentAudio() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
      console.log("🔇 現在の音声を停止しました");
    } catch (error) {
      console.warn("音声停止時のエラー:", error);
      currentAudio = null;
    }
  }

  // Web Speech APIも停止
  if (window.speechSynthesis) {
    speechSynthesis.cancel();
  }
}

// Web Speech API を使用したテキスト読み上げ
function playTextWithTTS(text, language = "ja-JP") {
  try {
    // ブラウザの音声合成機能が利用可能かチェック
    if (!window.speechSynthesis) {
      console.error("❌ このブラウザはWeb Speech APIをサポートしていません");
      return;
    }

    // 既存の音声を停止
    speechSynthesis.cancel();

    // 新しい音声合成オブジェクトを作成
    const utterance = new SpeechSynthesisUtterance(text);

    // 言語設定
    utterance.lang = language;

    // 音声設定（既存の設定を流用）
    utterance.rate = speechSpeed || 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // エラーハンドリング
    utterance.onerror = function(event) {
      console.error("❌ 音声合成エラー:", event.error);
    };

    utterance.onstart = function() {
      console.log(`🗣️ 音声合成開始: ${text}`);
    };

    utterance.onend = function() {
      console.log(`✅ 音声合成完了: ${text}`);
    };

    // 音声合成を開始
    speechSynthesis.speak(utterance);

  } catch (error) {
    console.error("❌ Web Speech API エラー:", error);
  }
}

// オノマトペ辞典専用の音声再生関数（新規作成）
function playOnomatopoeiaFromDictionary(itemId) {
  try {
    // dictionary.jsonから該当するitemを検索
    const item = onomatopoeiaData.find(item => item.id === itemId);
    if (item && item.jpsen) {
      console.log(`🎵 オノマトペ辞典音声再生: ID=${itemId}, jpsen=${item.jpsen}`);
      playAudioWithFallback('', item.jpsen, 'ja-JP');
    } else {
      console.warn(`⚠️ オノマトペ辞典データが見つかりません: ID=${itemId}`);
    }
  } catch (error) {
    console.error("❌ オノマトペ辞典音声再生エラー:", error);
  }
}

// 音声再生機能の状態確認
function checkAudioCapabilities() {
  const capabilities = {
    mp3: true, // MP3ファイル再生は基本的にサポート
    tts: !!window.speechSynthesis, // Web Speech APIのサポート状況
    languages: []
  };

  // 利用可能な言語を取得
  if (window.speechSynthesis) {
    capabilities.languages = speechSynthesis.getVoices()
      .filter(voice => voice.lang.startsWith('ja'))
      .map(voice => voice.lang);
  }

  console.log("🔊 音声機能の対応状況:", capabilities);
  return capabilities;
}

// ページ読み込み完了時に音声機能の確認
document.addEventListener('DOMContentLoaded', function() {
  // 既存のDOMContentLoadedイベントハンドラーの後に実行
  setTimeout(() => {
    checkAudioCapabilities();
  }, 1000); // 1秒後に実行（音声APIの初期化を待つ）
});

// ========================================
// 管理者認証システム
// ========================================

// 管理者認証情報
const ADMIN_EMAIL = 'hilohasumayu324@gmail.com';
const ADMIN_PASSWORD = 'honma.arigato@non';

// 管理者モードフラグ
let isAdminMode = false;

// 管理者画面を表示
function showAdminLogin() {
  console.log('🔑 管理者ログイン画面を表示します');

  // 管理者モーダルが既に存在する場合は表示
  const existingModal = document.getElementById('admin-modal');
  if (existingModal) {
    existingModal.style.display = 'block';
    return;
  }

  // 管理者モーダルを作成
  const modal = document.createElement('div');
  modal.id = 'admin-modal';
  modal.style.cssText = `
    position: fixed;
    z-index: 2000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  modal.innerHTML = `
    <div style="
      background: white;
      padding: 30px;
      border-radius: 10px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    ">
      <h2 style="margin-bottom: 20px; color: #333;">🔑 管理者ログイン</h2>
      <div style="margin-bottom: 15px;">
        <input type="email" id="admin-email" placeholder="メールアドレス"
               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;">
      </div>
      <div style="margin-bottom: 20px;">
        <input type="password" id="admin-password" placeholder="パスワード"
               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
      </div>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button onclick="authenticateAdmin()"
                style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
          ログイン
        </button>
        <button onclick="closeAdminModal()"
                style="background: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
          キャンセル
        </button>
      </div>
      <div id="admin-message" style="margin-top: 15px; color: #f44336; font-size: 14px;"></div>
    </div>
  `;

  document.body.appendChild(modal);

  // エンターキーでログイン
  document.getElementById('admin-email').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('admin-password').focus();
    }
  });

  document.getElementById('admin-password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      authenticateAdmin();
    }
  });

  // モーダル外クリックで閉じる
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeAdminModal();
    }
  });
}

// 管理者モーダルを閉じる
function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// 管理者認証
function authenticateAdmin() {
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  const messageDiv = document.getElementById('admin-message');

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // 認証成功
    isAdminMode = true;
    isPremiumUser = true;

    // 全ブラウザでプレミアム機能を有効化
    localStorage.setItem('premiumActive', 'true');
    localStorage.setItem('adminMode', 'true');
    localStorage.setItem('adminEmail', email);

    messageDiv.style.color = '#4CAF50';
    messageDiv.textContent = '✅ 管理者認証成功！プレミアム機能が有効になりました。';

    // UI更新
    updatePremiumUI();

    console.log('🔑 管理者認証成功:', email);

    // 3秒後にモーダルを閉じる
    setTimeout(() => {
      closeAdminModal();
    }, 3000);

  } else {
    // 認証失敗
    messageDiv.style.color = '#f44336';
    messageDiv.textContent = '❌ 認証に失敗しました。メールアドレスとパスワードを確認してください。';

    console.log('❌ 管理者認証失敗');
  }
}

// 管理者モードのチェック
function checkAdminMode() {
  const adminMode = localStorage.getItem('adminMode');
  const adminEmail = localStorage.getItem('adminEmail');

  if (adminMode === 'true' && adminEmail === ADMIN_EMAIL) {
    isAdminMode = true;
    isPremiumUser = true;
    console.log('🔑 管理者モードが有効です:', adminEmail);
    return true;
  }

  return false;
}

// PC版: Ctrl+Shift+Z で管理者画面表示
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
    e.preventDefault();
    showAdminLogin();
  }
});

// モバイル版: 長押しジェスチャーで管理者画面表示
let touchStartTime = 0;
let touchStartElement = null;

document.addEventListener('touchstart', function(e) {
  touchStartTime = Date.now();
  touchStartElement = e.target;
});

document.addEventListener('touchend', function(e) {
  const touchDuration = Date.now() - touchStartTime;

  // 5秒以上長押しで管理者画面表示
  if (touchDuration > 5000 && touchStartElement) {
    e.preventDefault();
    showAdminLogin();
  }

  touchStartTime = 0;
  touchStartElement = null;
});

// ページ読み込み時に管理者モードをチェック
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    checkAdminMode();
  }, 500);
});

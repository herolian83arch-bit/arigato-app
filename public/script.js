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
  'ru': 'Русский'
};

document.addEventListener('DOMContentLoaded', () => {
  // お気に入り機能の初期化
  initializeFavorites();
  
  loadLanguage(currentLang);
  checkPremiumStatus(); // プレミアム状態をチェック
  loadOnomatopoeiaData(); // オノマトペデータを読み込み
  updateTTSToggleButton(); // TTSボタンの状態を更新
  
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
});

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

// 動的翻訳機能
async function translateText(text, targetLang) {
  try {
    const response = await fetch(`/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        target: targetLang
      })
    });
    
    if (!response.ok) {
      throw new Error('Translation failed');
    }
    
    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // 翻訳に失敗した場合は元のテキストを返す
  }
}

// 言語データを読み込み（動的翻訳対応）
async function loadLanguage(lang) {
  try {
    // 基本言語（en, ja, zh, ko）は静的JSONから読み込み
    if (['en', 'ja', 'zh', 'ko'].includes(lang)) {
      const response = await fetch(`locales/${lang}.json`);
      languageData = await response.json();
    } else {
      // その他の言語は動的翻訳を使用
      const baseResponse = await fetch('locales/en.json');
      const baseData = await baseResponse.json();
      
      // 動的翻訳で言語データを生成
      languageData = await translateLanguageData(baseData, lang);
    }
    
    renderSceneSwitcher();
    renderScene();
  } catch (error) {
    console.error('Language loading error:', error);
  }
}

// 言語データ全体を翻訳
async function translateLanguageData(baseData, targetLang) {
  const translatedData = {
    scenes: {}
  };
  
  for (const [sceneKey, sceneData] of Object.entries(baseData.scenes)) {
    translatedData.scenes[sceneKey] = {
      title: await translateText(sceneData.title, targetLang),
      messages: []
    };
    
    for (const message of sceneData.messages) {
      const translatedMessage = {
        ...message,
        text: await translateText(message.text, targetLang),
        note: await translateText(message.note, targetLang)
      };
      translatedData.scenes[sceneKey].messages.push(translatedMessage);
    }
  }
  
  return translatedData;
}

// オノマトペデータを読み込み
async function loadOnomatopoeiaData() {
  try {
    const response = await fetch('locales/onomatopoeia-premium-all-41-scenes.json');
    const rawData = await response.json();
    
    // romajiを大文字に変換
    onomatopoeiaData = rawData.map(item => ({
      ...item,
      romaji: item.romaji ? item.romaji.toUpperCase() : item.romaji
    }));
  } catch (error) {
    console.error('オノマトペデータの読み込みに失敗:', error);
  }
}

// プレミアム機能のチェック
function checkPremiumStatus() {
  const premiumStatus = localStorage.getItem('premiumStatus');
  isPremiumUser = premiumStatus === 'active';
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
      premiumBtn.onclick = showOnomatopoeiaModal; // オノマトペ辞典を表示
    } else {
      premiumBtn.textContent = 'Upgrade to Premium';
      premiumBtn.style.backgroundColor = '#FF9800';
      premiumBtn.disabled = false;
      premiumBtn.onclick = showPaymentModal;
    }
  }
}

// オノマトペ辞典モーダルを表示
function showOnomatopoeiaModal() {
  if (!isPremiumUser) {
    showPaymentModal();
    return;
  }
  
  const modal = document.getElementById('onomatopoeia-modal');
  modal.style.display = 'block';
  showOnomatopoeiaScenes();
}

// オノマトペ辞典モーダルを閉じる
function closeOnomatopoeiaModal() {
  const modal = document.getElementById('onomatopoeia-modal');
  modal.style.display = 'none';
}

// オノマトペシーン一覧を表示
function showOnomatopoeiaScenes() {
  const scenesContainer = document.getElementById('onomatopoeia-scenes');
  const contentContainer = document.getElementById('onomatopoeia-content');
  
  scenesContainer.style.display = 'block';
  contentContainer.style.display = 'none';
  
  // シーンをグループ化
  const sceneGroups = {};
  onomatopoeiaData.forEach(item => {
    if (!sceneGroups[item.scene]) {
      sceneGroups[item.scene] = [];
    }
    sceneGroups[item.scene].push(item);
  });
  
  let html = '<div class="scene-grid">';
  Object.keys(sceneGroups).forEach(scene => {
    const count = sceneGroups[scene].length;
    html += `
      <div class="scene-card" onclick="showOnomatopoeiaScene('${scene}')">
        <div class="scene-icon">📚</div>
        <div class="scene-title">${scene}</div>
        <div class="scene-count">${count}例文</div>
      </div>
    `;
  });
  html += '</div>';
  
  scenesContainer.innerHTML = html;
}

// オノマトペシーンの詳細を表示
async function showOnomatopoeiaScene(scene) {
  const scenesContainer = document.getElementById('onomatopoeia-scenes');
  const contentContainer = document.getElementById('onomatopoeia-content');
  const examplesContainer = document.getElementById('onomatopoeia-examples');
  
  scenesContainer.style.display = 'none';
  contentContainer.style.display = 'block';
  
  const sceneItems = onomatopoeiaData.filter(item => item.scene === scene);
  
  let html = `<h3>${scene}</h3>`;
  
  for (const item of sceneItems) {
    // 動的翻訳でオノマトペの翻訳を取得
    let translatedMain = item.main;
    let translatedDescription = item.description.ja;
    
    if (currentLang !== 'ja' && currentLang !== 'en') {
      translatedMain = await translateText(item.main, currentLang);
      translatedDescription = await translateText(item.description.ja, currentLang);
    }
    
    // 音声再生機能の有効/無効チェック
    const isTTSEnabled = localStorage.getItem('feature_tts') === '1' || 
                         (typeof window !== 'undefined' && window.speechSynthesis);
    
    html += `
      <div class="onomatopoeia-item">
        <div class="item-header">
          <div class="item-number">${item.id}</div>
          <div class="item-actions" style="display:inline-flex;align-items:center;">
            ${isTTSEnabled ? `
              <button class="speak-btn" onclick="speakJapanese('${item.main.replace(/'/g, "\\'")}')" aria-label="音声再生" style="background:none;border:none;cursor:pointer;font-size:1.2em;margin-left:12px;">
                🔊
              </button>
            ` : ''}
            ${window.FEATURE_FAVORITES ? `
              <button class="favorite-toggle-btn" onclick="toggleFavorite(${item.id})" aria-label="お気に入りに追加" style="background:none;border:none;cursor:pointer;padding:8px;margin-left:12px;font-size:1.3em;color:#bbb;min-width:40px;min-height:40px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s ease;border-radius:4px;">
                ${isFavorite(item.id) ? '★' : '☆'}
              </button>
            ` : ''}
          </div>
        </div>
        <div class="item-main">${translatedMain}</div>
        <div class="item-romaji">${item.romaji}</div>
        <div class="item-description">${translatedDescription}</div>
        <div class="item-translations">
          <div class="translation-item">
            <span class="lang-label">EN:</span>
            <span class="translation-text">${item.translation.en || 'Coming soon...'}</span>
          </div>
          <div class="translation-item">
            <span class="lang-label">中文:</span>
            <span class="translation-text">${item.translation.zh || '即将推出...'}</span>
          </div>
          <div class="translation-item">
            <span class="lang-label">한국어:</span>
            <span class="translation-text">${item.translation.ko || '곧 출시...'}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  examplesContainer.innerHTML = html;
}

// 決済モーダルを表示
function showPaymentModal() {
  const modal = document.getElementById('payment-modal');
  modal.style.display = 'block';
  
    // Stripe Elementsを初期化
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
}

// 決済モーダルを閉じる
function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  modal.style.display = 'none';
}

// 決済処理
async function processPayment() {
  const payButton = document.getElementById('pay-button');
  payButton.disabled = true;
  payButton.textContent = 'Processing...';
  
  try {
    const response = await fetch('/api/payment/create-payment-intent.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 999, // $9.99
        currency: 'usd',
        description: 'Arigato App Premium Subscription'
      })
    });

    const responseData = await response.json();
    
    if (!responseData.clientSecret) {
      throw new Error('No client secret received from server');
    }
    
    const { clientSecret } = responseData;
    
            const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement('card'),
            billing_details: {
              name: 'Test User',
              email: 'test@example.com',
              address: {
                line1: '123 Test Street',
                city: 'Test City',
                state: 'Test State',
                postal_code: '12345',
                country: 'US'
              }
            }
          }
        });

    if (result.error) {
      console.error('Payment failed:', result.error);
      alert('Payment failed: ' + result.error.message);
    } else {
      // 支払い成功
      localStorage.setItem('premiumStatus', 'active');
      isPremiumUser = true;
      updatePremiumUI();
      closePaymentModal();
      alert('Premium upgrade successful! 🎉');
    }
  } catch (error) {
    console.error('Payment error:', error);
    alert('Payment error: ' + error.message);
  } finally {
    payButton.disabled = false;
    payButton.textContent = 'Pay $9.99';
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
  
  const favorites = getFavorites();
  const stringId = String(id);
  const currentState = favorites[stringId] || false;
  const newState = !currentState;
  
  favorites[stringId] = newState;
  setFavorites(favorites);
  
  return newState;
}

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
      
      // メッセージのIDを取得（numberまたはインデックス）
      const messageId = msg.number || (idx + 1);
      
      // カードのHTMLを構築（お気に入りボタンは後で動的に追加）
      card.innerHTML = `
        <div class="message-header">
          <span class="message-number" style="font-weight:bold;margin-right:8px;">${messageId}.</span>
          <div class="message-actions" style="display:inline-flex;align-items:center;">
            <button class="speak-btn" style="margin-left:12px;background:none;border:none;cursor:pointer;font-size:1.2em;" onclick="playJapaneseSpeech('${(msg.ja || msg.text || '').replace(/<[^>]+>/g, '')}')" aria-label="音声再生">🔊</button>
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
          favoriteBtn.setAttribute('role', 'button');
          favoriteBtn.setAttribute('tabindex', '0');
          favoriteBtn.setAttribute('aria-label', 'お気に入りに追加');
          favoriteBtn.setAttribute('aria-pressed', 'false');
          
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
          
          // クリックイベント
          favoriteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
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
          
          // キーボードイベント
          favoriteBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
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
  alert('✨ This feature is available for Premium users!\n\nUpgrade to Premium to unlock:\n• Advanced audio quality\n• Dictionary integration\n• Custom backgrounds\n• Offline mode');
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

// 音声再生の改善（プレミアム機能）
window.playJapaneseSpeech = function(japaneseText) {
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
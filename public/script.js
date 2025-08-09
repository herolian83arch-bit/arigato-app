let currentLang = 'en';
let currentScene = 'airport';
let languageData = {};
let speechSpeed = 1.0;
let isPremiumUser = false; // プレミアム機能フラグ
let stripe = null;
let elements = null;
let onomatopoeiaData = []; // オノマトペデータ

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
  loadLanguage(currentLang);
  checkPremiumStatus(); // プレミアム状態をチェック
  loadOnomatopoeiaData(); // オノマトペデータを読み込み
  
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
    console.log('オノマトペデータの読み込みを開始...');
    
    // まず40シーン版、次にテストファイル、最後に完全版を試す
    let response;
    try {
      response = await fetch('locales/onomatopoeia-all-scenes.json');
      if (!response.ok) throw new Error('All scenes file not found');
      console.log('40シーン版ファイルを読み込み中...');
    } catch (allScenesError) {
      try {
        response = await fetch('locales/onomatopoeia-test.json');
        if (!response.ok) throw new Error('Test file not found');
        console.log('テストファイルを読み込み中...');
      } catch (testError) {
        console.log('完全版を読み込み中...');
        response = await fetch('locales/onomatopoeia-premium-615.json');
      }
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    console.log('レスポンステキスト長:', text.length);
    
    onomatopoeiaData = JSON.parse(text);
    console.log(`オノマトペデータ読み込み完了: ${onomatopoeiaData.length}件`);
    
    // データ読み込み後にシーンを再表示
    if (document.getElementById('onomatopoeia-modal').style.display === 'block') {
      showOnomatopoeiaScenes();
    }
  } catch (error) {
    console.error('オノマトペデータの読み込みに失敗:', error);
    
    // 最後の手段：サンプルデータを作成
    console.log('サンプルデータで代替表示します');
    onomatopoeiaData = [
      {
        "id": 1,
        "sceneId": 1,
        "scene": "サンプル",
        "main": "《ふわふわ》のパンケーキが美味しいです。",
        "romaji": "**FUWAFUWA** no pankēki ga oishii desu.",
        "translation": { "en": "The fluffy pancakes are delicious.", "zh": "蓬松的煎饼很好吃。", "ko": "폭신폭신한 팬케이크가 맛있어요." },
        "description": { "ja": "《ふわふわ》は、柔らかく軽やかな感触を表すオノマトペです。", "en": "Fuwafuwa represents a soft and light texture.", "zh": "蓬松蓬松表示柔软轻盈的质感。", "ko": "폭신폭신은 부드럽고 가벼운 질감을 나타내는 의성어입니다." }
      }
    ];
    
    // エラー時は代替メッセージを表示
    const scenesContainer = document.getElementById('onomatopoeia-scenes');
    if (scenesContainer) {
      scenesContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #666;">
          <p>⚠️ データの読み込みに失敗しました。</p>
          <p>サンプルデータで表示しています。</p>
          <p style="font-size: 0.9em;">エラー: ${error.message}</p>
          <button onclick="loadOnomatopoeiaData()" style="padding: 10px 20px; margin-top: 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">再試行</button>
        </div>
      `;
      
      // サンプルデータでシーンを表示
      setTimeout(() => {
        if (document.getElementById('onomatopoeia-modal').style.display === 'block') {
          showOnomatopoeiaScenes();
        }
      }, 1000);
    }
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
async function showOnomatopoeiaModal() {
  if (!isPremiumUser) {
    showPaymentModal();
    return;
  }
  
  const modal = document.getElementById('onomatopoeia-modal');
  modal.style.display = 'block';
  
  // データが読み込まれていない場合は再読み込み
  if (!onomatopoeiaData || onomatopoeiaData.length === 0) {
    console.log('オノマトペデータを再読み込み中...');
    await loadOnomatopoeiaData();
  }
  
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
  
  // デバッグ用ログ
  console.log('オノマトペデータ状況:', {
    dataLength: onomatopoeiaData.length,
    sampleData: onomatopoeiaData.slice(0, 2)
  });
  
  // データが空の場合の処理
  if (!onomatopoeiaData || onomatopoeiaData.length === 0) {
    scenesContainer.innerHTML = `
      <div style="text-align: center; color: #666; padding: 20px;">
        <p>データを読み込み中...</p>
        <div style="margin-top: 15px;">
          <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
    
    // 10秒後にタイムアウト処理
    setTimeout(() => {
      if (!onomatopoeiaData || onomatopoeiaData.length === 0) {
        scenesContainer.innerHTML = `
          <div style="text-align: center; padding: 20px; color: #666;">
            <p>データの読み込みがタイムアウトしました。</p>
            <button onclick="loadOnomatopoeiaData()" style="padding: 10px 20px; margin-top: 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">再試行</button>
          </div>
        `;
      }
    }, 10000);
    
    return;
  }
  
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
  
  // ローディング表示
  examplesContainer.innerHTML = `
    <div style="text-align: center; padding: 20px; color: #666;">
      <p>データを読み込み中...</p>
      <div style="margin-top: 15px;">
        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
    </div>
  `;
  
  // 必ず完全版データから読み込み
  let sceneItems = [];
  try {
    console.log(`${scene}の完全データを読み込み中...`);
    const response = await fetch('locales/onomatopoeia-premium-615.json');
    if (response.ok) {
      const fullData = await response.json();
      sceneItems = fullData.filter(item => item.scene === scene);
      console.log(`${scene}: ${sceneItems.length}例文を読み込み完了`);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.log('完全版の読み込みに失敗、軽量版データを使用:', error.message);
    sceneItems = onomatopoeiaData.filter(item => item.scene === scene);
  }
  
  // データが見つからない場合の処理
  if (sceneItems.length === 0) {
    examplesContainer.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #666;">
        <h3>${scene}</h3>
        <p>このシーンのデータが見つかりませんでした。</p>
        <button onclick="showOnomatopoeiaScenes()" style="padding: 10px 20px; margin-top: 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">シーン一覧に戻る</button>
      </div>
    `;
    return;
  }
  
  let html = `<h3>${scene} (${sceneItems.length}例文)</h3>`;
  
  for (const item of sceneItems) {
    // 動的翻訳でオノマトペの翻訳を取得
    let translatedMain = item.main;
    let translatedDescription = item.description.ja;
    
    if (currentLang !== 'ja' && currentLang !== 'en') {
      translatedMain = await translateText(item.main, currentLang);
      translatedDescription = await translateText(item.description.ja, currentLang);
    }
    
    // オノマトペ用のお気に入りキーを作成
    const favKey = `onomatopoeia-${currentLang}-${item.id}`;
    const favorites = getFavorites();
    const isFav = !!favorites[favKey];
    
    html += `
      <div class="onomatopoeia-item">
        <div class="item-header">
          <div class="item-number">${item.id}</div>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;margin-left:auto;">${isFav ? '★' : '☆'}</span>
          <button class="speak-btn" style="margin-left:8px;" onclick="playJapaneseSpeech('${item.main.replace(/<[^>]+>/g, '').replace(/《|》/g, '').replace(/'/g, "\\'")}')">🔊</button>
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
  
  // オノマトペ辞典のお気に入りクリックイベント
  examplesContainer.querySelectorAll('.favorite-star').forEach(star => {
    star.onclick = function() {
      const key = this.getAttribute('data-key');
      const favs = getFavorites();
      favs[key] = !favs[key];
      setFavorites(favs);
      
      // 星の表示を即座に更新
      this.style.color = favs[key] ? 'gold' : '#bbb';
      this.textContent = favs[key] ? '★' : '☆';
    };
  });
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

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('favorites') || '{}');
  } catch {
    return {};
  }
}
function setFavorites(favs) {
  localStorage.setItem('favorites', JSON.stringify(favs));
}
function renderScene() {
  const scene = languageData.scenes[currentScene];
  document.getElementById('scene-title').textContent = scene ? currentScene : '';
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = '';
  if (scene) {
    const favorites = getFavorites();
    scene.messages.forEach((msg, idx) => {
      const favKey = `${currentLang}-${currentScene}-${msg.number || idx}`;
      const isFav = !!favorites[favKey];
      const card = document.createElement('div');
      card.className = 'message-card';
      card.innerHTML = `
        <span style="font-weight:bold;margin-right:8px;">${msg.number || idx + 1}.</span>
        <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
        <div class="message-content" style="display:inline-block;">
          <div class="message-text" style="font-weight:bold;margin-bottom:4px;">${msg.text || ''}</div>
          <div class="romaji-text" style="font-size:0.9em;color:#666;margin-bottom:4px;">${msg.romaji || ''}</div>
        </div>
        <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${(msg.ja || msg.text || '').replace(/<[^>]+>/g, '')}')">🔊</button>
        <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
      `;
      messagesDiv.appendChild(card);
    });
    // お気に入りクリックイベント
    messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
      star.onclick = function() {
        const key = this.getAttribute('data-key');
        const favs = getFavorites();
        favs[key] = !favs[key];
        setFavorites(favs);
        renderScene();
      };
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
  if (isPremiumUser) {
    // プレミアム音声機能
    const utter = new SpeechSynthesisUtterance(japaneseText);
    utter.lang = 'ja-JP';
    utter.rate = speechSpeed;
    utter.pitch = 1.2; // プレミアム機能：音声の高さを調整
    utter.volume = 0.9; // プレミアム機能：音量を調整
    speechSynthesis.speak(utter);
  } else {
    // 通常の音声機能
    const utter = new SpeechSynthesisUtterance(japaneseText);
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
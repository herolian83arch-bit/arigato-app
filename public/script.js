let currentLang = 'en';
let currentScene = 'airport';
let languageData = {};
let speechSpeed = 1.0;
let isPremiumUser = false; // プレミアム機�Eフラグ
let stripe = null;
let elements = null;
let onomatopoeiaData = []; // オノ�Eト�EチE�Eタ

// サポ�EトされてぁE��言語�E定義
const supportedLanguages = {
  'en': 'English',
  'ja': '日本誁E,
  'zh': '中斁E,
  'ko': '���국�E�',
  'pt': 'Português',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'it': 'Italiano',
  'ru': 'РусE�E�ий'
};

document.addEventListener('DOMContentLoaded', () => {
  loadLanguage(currentLang);
  checkPremiumStatus(); // プレミアム状態をチェチE��
  loadOnomatopoeiaData(); // オノ�Eト�EチE�Eタを読み込み
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.onclick = () => {
      currentLang = btn.dataset.lang;
      loadLanguage(currentLang);
    };
  });

  // スピ�EドスライダーのイベンチE  const speedSlider = document.getElementById('speechSpeed');
  const speedValue = document.getElementById('speedValue');
  if (speedSlider && speedValue) {
    speedSlider.addEventListener('input', function() {
      speechSpeed = parseFloat(this.value);
      speedValue.textContent = `${speechSpeed.toFixed(2)}x`;
    });
  }
});

// 動的翻訳機�E
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
    return text; // 翻訳に失敗した場合�E允E�EチE��ストを返す
  }
}

// 言語データを読み込み�E�動皁E��訳対応！Easync function loadLanguage(lang) {
  try {
    // 基本言語！En, ja, zh, ko�E��E静的JSONから読み込み
    if (['en', 'ja', 'zh', 'ko'].includes(lang)) {
      const response = await fetch(`locales/${lang}.json`);
      languageData = await response.json();
    } else {
      // そ�E他�E言語�E動的翻訳を使用
      const baseResponse = await fetch('locales/en.json');
      const baseData = await baseResponse.json();
      
      // 動的翻訳で言語データを生戁E      languageData = await translateLanguageData(baseData, lang);
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

// オノ�Eト�EチE�Eタを読み込み
async function loadOnomatopoeiaData() {
  try {
    const response = await fetch('locales/onomatopoeia-premium-all-41-scenes.json');
    onomatopoeiaData = await response.json();
    console.log('🎵 オノ�Eト�EチE�Eタ読み込み完亁E', onomatopoeiaData.length, '件');
  } catch (error) {
    console.error('オノ�Eト�EチE�Eタの読み込みに失敁E', error);
  }
}

// プレミアム機�EのチェチE��
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
      premiumBtn.onclick = showOnomatopoeiaModal; // オノ�Eト�E辞�Eを表示
    } else {
      premiumBtn.textContent = 'Upgrade to Premium';
      premiumBtn.style.backgroundColor = '#FF9800';
      premiumBtn.disabled = false;
      premiumBtn.onclick = showPaymentModal;
    }
  }
}

// オノ�Eト�E辞�Eモーダルを表示
function showOnomatopoeiaModal() {
  if (!isPremiumUser) {
    showPaymentModal();
    return;
  }
  
  const modal = document.getElementById('onomatopoeia-modal');
  modal.style.display = 'block';
  showOnomatopoeiaScenes();
}

// オノ�Eト�E辞�Eモーダルを閉じる
function closeOnomatopoeiaModal() {
  const modal = document.getElementById('onomatopoeia-modal');
  modal.style.display = 'none';
}

// オノ�Eト�Eシーン一覧を表示
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

// オノ�Eト�Eシーンの詳細を表示
async function showOnomatopoeiaScene(scene) {
  const scenesContainer = document.getElementById('onomatopoeia-scenes');
  const contentContainer = document.getElementById('onomatopoeia-content');
  const examplesContainer = document.getElementById('onomatopoeia-examples');
  
  scenesContainer.style.display = 'none';
  contentContainer.style.display = 'block';
  
  const sceneItems = onomatopoeiaData.filter(item => item.scene === scene);
  
  let html = `<h3>${scene}</h3>`;
  
  for (const item of sceneItems) {
    // 動的翻訳でオノ�Eト�Eの翻訳を取征E    let translatedMain = item.main;
    let translatedDescription = item.description.ja;
    
    if (currentLang !== 'ja' && currentLang !== 'en') {
      translatedMain = await translateText(item.main, currentLang);
      translatedDescription = await translateText(item.description.ja, currentLang);
    }
    
    // お気に入り機�Eの設宁E    const favKey = `onomatopoeia-${item.id}`;
    const favorites = getFavorites();
    const isFav = !!favorites[favKey];
    
    html += `
      <div class="onomatopoeia-item">
        <div class="item-header" style="display: flex; align-items: center; margin-bottom: 8px;">
          <div class="item-number">${item.id}</div>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;margin-left:8px;">${isFav ? '☁E : '☁E}</span>
          <button class="speak-btn" style="margin-left:12px;background:none;border:none;font-size:1.2em;cursor:pointer;" onclick="playOnomatopoeiaSpeech(`'`${item.main}`', `'`${item.romaji}`')">🔊</button>
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
            <span class="lang-label">中斁E</span>
            <span class="translation-text">${item.translation.zh || '即封E��出...'}</span>
          </div>
          <div class="translation-item">
            <span class="lang-label">���국�E�:</span>
            <span class="translation-text">${item.translation.ko || '�E� �E�시...'}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  examplesContainer.innerHTML = html;
  
  // オノ�Eト�Eのお気に入りクリチE��イベントを追加
  examplesContainer.querySelectorAll('.favorite-star').forEach(star => {
    star.onclick = function() {
      const key = this.getAttribute('data-key');
      const favs = getFavorites();
      favs[key] = !favs[key];
      setFavorites(favs);
      // 星�E表示を更新
      this.textContent = favs[key] ? '☁E : '☁E;
      this.style.color = favs[key] ? 'gold' : '#bbb';
    };
  });
}

// 決済モーダルを表示
function showPaymentModal() {
  const modal = document.getElementById('payment-modal');
  modal.style.display = 'block';
  
    // Stripe Elementsを�E期化
  if (!stripe) {
    // 環墁E��数から取得するか、デフォルト値を使用
    const publishableKey = 'pk_test_51RqsyyGWVvTYb0YWIKOq10sybzWD8e7XKXObY7Tj0dfotoGeOgvlXDEfpymqmXLSwbcz2iVbZ0Hpa800xCMSebA000SGTwfMcA';
    stripe = Stripe(publishableKey);
    elements = stripe.elements();
  }

  // 既存�Eカード要素をクリア
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
    hidePostalCode: true, // 郵便番号フィールドを隠ぁE  });
  
  // カード要素を�EウンチE  card.mount('#card-element');
}

// 決済モーダルを閉じる
function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  modal.style.display = 'none';
}

// 決済�E琁Easync function processPayment() {
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
  // 並び頁E��明示皁E��持E��E  const sceneOrder = ['airport', 'hotel', 'restaurant', 'shopping', 'transportation'];
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
        <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '☁E : '☁E}</span>
        <div class="message-content" style="display:inline-block;">
          <div class="message-text" style="font-weight:bold;margin-bottom:4px;">${msg.text || ''}</div>
          <div class="romaji-text" style="font-size:0.9em;color:#666;margin-bottom:4px;">${msg.romaji || ''}</div>
        </div>
        <button class="speak-btn" style="margin-left:12px;" onclick="playOnomatopoeiaSpeech(`'`${item.main}`', `'`${item.romaji}`')">🔊</button>
        <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
      `;
      messagesDiv.appendChild(card);
    });
    // お気に入りクリチE��イベンチE    messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
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

// プレミアム機�Eの実裁Efunction enablePremiumFeatures() {
  if (!isPremiumUser) {
    showPremiumPrompt();
    return;
  }
  
  // プレミアム機�Eを有効匁E  enableAdvancedAudio();
  enableDictionaryFeature();
  enableCustomBackgrounds();
  enableOfflineMode();
}

// プレミアムプロンプト表示
function showPremiumPrompt() {
  alert('✨ This feature is available for Premium users!\n\nUpgrade to Premium to unlock:\n• Advanced audio quality\n• Dictionary integration\n• Custom backgrounds\n• Offline mode');
}

// 高度な音声機�E
function enableAdvancedAudio() {
  // 高品質音声の実裁E  console.log('Advanced audio enabled');
}

// 辞書機�E
function enableDictionaryFeature() {
  // 辞書機�Eの実裁E  console.log('Dictionary feature enabled');
}

// カスタム背景機�E
function enableCustomBackgrounds() {
  // 背景カスタマイズ機�Eの実裁E  console.log('Custom backgrounds enabled');
}

// オフラインモーチEfunction enableOfflineMode() {
  // オフライン機�Eの実裁E  console.log('Offline mode enabled');
}

// 音声再生の改喁E���Eレミアム機�E�E�Ewindow.playJapaneseSpeech = function(japaneseText) {
  if (isPremiumUser) {
    // プレミアム音声機�E
    const utter = new SpeechSynthesisUtterance(japaneseText);
    utter.lang = 'ja-JP';
    utter.rate = speechSpeed;
    utter.pitch = 1.2; // プレミアム機�E�E�音声の高さを調整
    utter.volume = 0.9; // プレミアム機�E�E�音量を調整
    speechSynthesis.speak(utter);
  } else {
    // 通常の音声機�E
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
}; / /   g~j�]~1_�E]~;S�EƇ�0Qu:~n���s���p� �ET�Q���n�E
 
 w i n d o w . p l a y O n o m a t o p o e i a S p e e c h   =   f u n c t i o n ( m a i n T e x t ,   r o m a j i T e x t )   { 
 
     / /   ]~�EO0g~y�]~;SR�g~o�]~j�]~|�]~s�g~b�]~�E�E�E���?�E��\�E�g~�Eh�Owcg~^�R4�E��E�E
 
     l e t   c l e a n T e x t   =   m a i n T e x t 
 
         . r e p l a c e ( / 2~��^ 2~�r* 2~�Eg ,   ' ' )   / /   2~�E� ]NR��Ed�4�E�
 
         . r e p l a c e ( / < [ ^ > ] * > / g ,   ' ' )     / /   < > g~^�R4�E�
 
         . r e p l a c e ( / 2~SU^ 2~_l* 2~�Eg ,   ' ' )   / /   2~�_� *�R��Ed�4�E�
 
         . r e p l a c e ( / \ ( [ ^ ) ] * \ ) / g ,   ' ' )   / /   ( ) g~^�R4�E�
 
         . r e p l a c e ( / [ \ [ \ ] ] / g ,   ' ' )         / /   [ ] g~^�R4�E�
 
         . r e p l a c e ( / [ 2~�E� �E|��E|�Ik/ g ,   ' ' )   / /   ?�e���m�d�y�g~^�R4�E�
 
         . t r i m ( ) ; 
 
     
 
     c o n s o l e . l o g ( ' ^�EN  g~j�]~1_�E]~;S�E��s���p� �ET�Q: ' ,   c l e a n T e x t ) ; 
 
     
 
     i f   ( i s P r e m i u m U s e r )   { 
 
         / /   ]~�R�E]~�nD0]~����s���p����n�E
 
         c o n s t   u t t e r   =   n e w   S p e e c h S y n t h e s i s U t t e r a n c e ( c l e a n T e x t ) ; 
 
         u t t e r . l a n g   =   ' j a - J P ' ; 
 
         u t t e r . r a t e   =   s p e e c h S p e e d ; 
 
         u t t e r . p i t c h   =   1 . 2 ; 
 
         u t t e r . v o l u m e   =   0 . 9 ; 
 
         s p e e c h S y n t h e s i s . s p e a k ( u t t e r ) ; 
 
     }   e l s e   { 
 
         / /   >��Xx�x�:~n���s���p����n�E
 
         c o n s t   u t t e r   =   n e w   S p e e c h S y n t h e s i s U t t e r a n c e ( c l e a n T e x t ) ; 
 
         u t t e r . l a n g   =   ' j a - J P ' ; 
 
         u t t e r . r a t e   =   s p e e c h S p e e d ; 
 
         s p e e c h S y n t h e s i s . s p e a k ( u t t e r ) ; 
 
     } 
 
 } ; 
 
 // オノ�Eト�E専用の音声再生機�E
window.playOnomatopoeiaSpeech = function(mainText, romajiText) {
  // チE��ストをクリーンアチE�E�E�特殊括弧めE��号を除去�E�E
  let cleanText = mainText
    .replace(/《[^》]*、Eg, '') // 《》を除去
    .replace(/<[^>]*>/g, '')  // <>を除去
    .replace(/「[^」]*、Eg, '') // 「」を除去
    .replace(/\([^)]*\)/g, '') // ()を除去
    .replace(/[\[\]]/g, '')    // []を除去
    .replace(/[。、E��E��]/g, '') // 句読点を除去
    .trim();
  
  console.log('🎵 オノ�Eト�E音声再生:', cleanText);
  
  if (isPremiumUser) {
    // プレミアム音声機�E
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = 'ja-JP';
    utter.rate = speechSpeed;
    utter.pitch = 1.2;
    utter.volume = 0.9;
    speechSynthesis.speak(utter);
  } else {
    // 通常の音声機�E
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = 'ja-JP';
    utter.rate = speechSpeed;
    speechSynthesis.speak(utter);
  }
};


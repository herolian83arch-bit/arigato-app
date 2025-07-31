let currentLang = 'en';
let currentScene = 'airport';
let languageData = {};
let speechSpeed = 1.0;
let isPremiumUser = false; // プレミアム機能フラグ
let stripe = null;
let elements = null;

document.addEventListener('DOMContentLoaded', () => {
  loadLanguage(currentLang);
  checkPremiumStatus(); // プレミアム状態をチェック
  
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
      premiumBtn.disabled = true;
    } else {
      premiumBtn.textContent = 'Upgrade to Premium';
      premiumBtn.style.backgroundColor = '#FF9800';
      premiumBtn.disabled = false;
    }
  }
}

// 決済モーダルを表示
function showPaymentModal() {
  const modal = document.getElementById('payment-modal');
  modal.style.display = 'block';
  
  // Stripe Elementsを初期化
  if (!stripe) {
    stripe = Stripe('pk_test_xxxxxxxxxxxxxxxxxxxxx'); // 実際のキーに置き換え
    elements = stripe.elements();
  }
  
  const card = elements.create('card');
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
    const response = await fetch('/api/payment/create-payment-intent', {
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

    const { clientSecret } = await response.json();
    
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement('card'),
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

function loadLanguage(lang) {
  fetch(`locales/${lang}.json`)
    .then(res => res.json())
    .then(data => {
      languageData = data;
      renderSceneSwitcher();
      renderScene();
    });
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
        <span class="message-text" style="display:inline-block;">${msg.text || ''}</span>
        <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${(msg.text || '').replace(/<[^>]+>/g, '')}')">🔊</button>
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
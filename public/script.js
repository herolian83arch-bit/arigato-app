let currentLang = 'en';
let currentScene = 'airport';
let languageData = {};
let speechSpeed = 1.0;

document.addEventListener('DOMContentLoaded', () => {
  loadLanguage(currentLang);
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
window.playJapaneseSpeech = function(japaneseText) {
  const utter = new SpeechSynthesisUtterance(japaneseText);
  utter.lang = 'ja-JP';
  utter.rate = speechSpeed;
  speechSynthesis.speak(utter);
};

window.playRomajiSpeech = function(romajiText) {
  const utter = new SpeechSynthesisUtterance(romajiText);
  utter.lang = 'en-US';
  utter.rate = speechSpeed;
  speechSynthesis.speak(utter);
}; 
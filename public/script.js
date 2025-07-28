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
  Object.keys(languageData.scenes).forEach(sceneKey => {
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
    if (currentLang === 'ja') {
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${idx + 1}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="message-text" style="display:inline-block;">${msg.text}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${msg.text.replace(/<[^>]+>/g, '')}')">🔊</button>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else if ((['en', 'zh', 'ko'].includes(currentLang)) && currentScene === 'airport') {
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${idx + 1}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${msg.ja.replace(/<[^>]+>/g, '')}')">🔊</button>
          <div class="en-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else if (currentLang === 'en' && currentScene === 'hotel') {
      // JA/hotelの日本語文を取得
      let jaHotelTexts = [];
      try {
        jaHotelTexts = window.jaHotelTexts || [];
        if (!jaHotelTexts.length) {
          fetch('locales/ja.json')
            .then(res => res.json())
            .then(jaData => {
              window.jaHotelTexts = jaData.scenes.hotel.messages.map(m => m.text.replace(/<[^>]+>/g, ''));
              renderScene();
            });
          return;
        }
      } catch { jaHotelTexts = []; }
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const jaText = jaHotelTexts[idx] || '';
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${idx + 1}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${jaText}')">🔊</button>
          <div class="en-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else if (currentLang === 'zh' && currentScene === 'hotel') {
      // JA/hotelの日本語文を取得
      let jaHotelTexts = [];
      try {
        jaHotelTexts = window.jaHotelTexts || [];
        if (!jaHotelTexts.length) {
          fetch('locales/ja.json')
            .then(res => res.json())
            .then(jaData => {
              window.jaHotelTexts = jaData.scenes.hotel.messages.map(m => m.text.replace(/<[^>]+>/g, ''));
              renderScene();
            });
          return;
        }
      } catch { jaHotelTexts = []; }
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const jaText = jaHotelTexts[idx] || '';
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${idx + 1}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${jaText}')">🔊</button>
          <div class="en-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else if (currentLang === 'en' && currentScene === 'shopping') {
      // EN/shopping専用の表示ロジック
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${msg.number || (idx + 1)}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${msg.audioText || ''}')">🔊</button>
          <div class="en-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else if (currentLang === 'en' && currentScene === 'restaurant') {
      // EN/restaurant専用の表示ロジック
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${msg.number || (idx + 1)}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${msg.ja.replace(/<[^>]+>/g, '')}')">🔊</button>
          <div class="en-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else if (currentLang === 'ko' && currentScene === 'hotel') {
      // KO/hotel専用の表示ロジック
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${msg.number || (idx + 1)}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${msg.audioText || ''}')">🔊</button>
          <div class="ko-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else if (currentLang === 'zh' && currentScene === 'shopping') {
      // ZH/shopping専用の表示ロジック
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${msg.number || (idx + 1)}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${msg.audioText || ''}')">🔊</button>
          <div class="zh-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else if (currentLang === 'ko' && currentScene === 'shopping') {
      // KO/shopping専用の表示ロジック
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${msg.number || (idx + 1)}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${msg.audioText || ''}')">🔊</button>
          <div class="ko-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else if (currentLang === 'zh' && currentScene === 'airport') {
      // ZH/airport専用の表示ロジック
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${msg.number || (idx + 1)}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${msg.ja || ''}')">🔊</button>
          <div class="zh-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else if (currentLang === 'zh' && currentScene === 'hotel') {
      // ZH/hotel専用の表示ロジック
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${msg.number || (idx + 1)}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${msg.ja || ''}')">🔊</button>
          <div class="zh-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else if (currentLang === 'zh' && currentScene === 'restaurant') {
      // ZH/restaurant専用の表示ロジック
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${msg.number || (idx + 1)}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${msg.ja || ''}')">🔊</button>
          <div class="zh-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else if (currentLang === 'zh' && currentScene === 'transportation') {
      // ZH/transportation専用の表示ロジック
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${msg.number || (idx + 1)}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${msg.ja || ''}')">🔊</button>
          <div class="zh-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });

      // KO/hotel専用の表示ロジック
      scene.messages.forEach((msg, idx) => {
        const favKey = `${currentLang}-${currentScene}-${idx}`;
        const isFav = !!favorites[favKey];
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <span style="font-weight:bold;margin-right:8px;">${msg.number || (idx + 1)}.</span>
          <span class="favorite-star" data-key="${favKey}" style="cursor:pointer;font-size:1.3em;color:${isFav ? 'gold' : '#bbb'};user-select:none;">${isFav ? '★' : '☆'}</span>
          <span class="romaji-text" style="display:inline-block;">${msg.romaji.replace(/^★\s*/, '')}</span>
          <button class="speak-btn" style="margin-left:12px;" onclick="playJapaneseSpeech('${msg.audioText || ''}')">🔊</button>
          <div class="ko-text" style="margin-top:4px;">${msg.text}</div>
          <div class="note-text" style="font-size:0.95em;color:#666;margin-top:2px;">${msg.note || ''}</div>
        `;
        messagesDiv.appendChild(card);
      });
      // ★クリックイベント付与
      messagesDiv.querySelectorAll('.favorite-star').forEach(star => {
        star.onclick = function() {
          const key = this.getAttribute('data-key');
          const favs = getFavorites();
          favs[key] = !favs[key];
          setFavorites(favs);
          renderScene();
        };
      });
    } else {
      scene.messages.forEach((msg, idx) => {
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
          <p class="message-text">${msg.text}</p>
          <p class="romaji-text">${msg.romaji || ''}</p>
          <button class="speak-btn" onclick="playJapaneseSpeech('${msg.ja}')">🔊</button>
        `;
        messagesDiv.appendChild(card);
      });
    }
      }
}
// お気に入り機能の管理
let favorites = JSON.parse(localStorage.getItem('favorites')) || {};

// メッセージカードのクリックイベント
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('favorite-star')) {
    const key = e.target.getAttribute('data-key');
    favorites[key] = !favorites[key];
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderScene();
  }
});
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
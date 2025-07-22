let currentLang = 'en';
let currentScene = 'airport';
let languageData = {};

document.addEventListener('DOMContentLoaded', () => {
  loadLanguage(currentLang);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.onclick = () => {
      currentLang = btn.dataset.lang;
      loadLanguage(currentLang);
    };
  });
});

function loadLanguage(lang) {
  fetch(`locales/${lang}.json`)
    .then(res => res.json())
    .then(data => {
      languageData = data;
      renderScene();
    });
}

function renderScene() {
  const scene = languageData.scenes[currentScene];
  document.getElementById('scene-title').textContent = scene ? currentScene : '';
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = '';
  if (scene) {
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

window.playJapaneseSpeech = function(japaneseText) {
  const utter = new SpeechSynthesisUtterance(japaneseText);
  utter.lang = 'ja-JP';
  speechSynthesis.speak(utter);
}; 
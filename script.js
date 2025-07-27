// Global variables
let currentLanguage = 'en';
let currentScene = 'airport';
let currentMessageIndex = 1;
let languageData = {};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  setLanguage('en');
  selectScene('airport');
  showMessage(2);
});

// Language switching function
function setLanguage(lang) {
  currentLanguage = lang;
  
  // Add error handling and fallback
  fetch(`/locales/${lang}.json`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Language file not found: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      languageData = data;
      updateUI();
      updateLanguageButtons();
      console.log(`Language loaded: ${lang}`);
    })
    .catch(error => {
      console.error("Error loading language file:", error);
      // Fallback to English if language file fails to load
      if (lang !== 'en') {
        console.log("Falling back to English");
        setLanguage('en');
      }
    });
}

// Update all UI elements with current language
function updateUI() {
  // Update app title and subtitle
  document.getElementById("app-title").textContent = languageData.app_title || "Arigato App";
  document.getElementById("app-subtitle").textContent = languageData.subtitle || "Express your gratitude in Japan";
  
  // Update scene title
  const sceneTitle = languageData.scenes?.[currentScene]?.title || "At the Airport";
  document.getElementById("scene-title").textContent = sceneTitle;
  
  // Update scene buttons
  updateSceneButtons();
  
  // Update messages
  updateMessages();
}

// Update language buttons
function updateLanguageButtons() {
  const buttons = document.querySelectorAll('.lang-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-lang') === currentLanguage) {
      btn.classList.add('active');
    }
  });
}

// Update scene buttons
function updateSceneButtons() {
  const buttons = document.querySelectorAll('.scene-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-scene') === currentScene) {
      btn.classList.add('active');
    }
  });
}

// Select scene function
function selectScene(scene) {
  console.log(`Scene selected: ${scene}`);
  currentScene = scene;
  currentMessageIndex = 1;
  updateUI();
  showMessage(1);
}

// Update messages for current scene
function updateMessages() {
  const sceneData = languageData.scenes?.[currentScene];
  if (!sceneData) {
    console.warn(`Scene data not found for: ${currentScene}`);
    return;
  }
  
  const messages = sceneData.messages;
  console.log(`Updating messages for scene: ${currentScene}`, messages);
  
  for (let i = 1; i <= 3; i++) {
    const messageElement = document.getElementById(`message-text-${i}`);
    if (messageElement && messages[i - 1]) {
      messageElement.textContent = messages[i - 1];
    }
  }
}

// Show specific message
function showMessage(messageIndex) {
  currentMessageIndex = messageIndex;
  
  // Hide all message cards
  const messageCards = document.querySelectorAll('.message-card');
  messageCards.forEach(card => {
    card.classList.remove('active');
  });
  
  // Show selected message card
  const selectedCard = document.getElementById(`message-${messageIndex}`);
  if (selectedCard) {
    selectedCard.classList.add('active');
  }
  
  // Update navigation buttons
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.classList.remove('active');
  });
  
  const selectedNavBtn = document.querySelector(`.nav-btn:nth-child(${messageIndex})`);
  if (selectedNavBtn) {
    selectedNavBtn.classList.add('active');
  }
}

// Copy message to clipboard
function copyMessage(messageIndex) {
  const messageElement = document.getElementById(`message-text-${messageIndex}`);
  if (!messageElement) return;
  
  const text = messageElement.textContent;
  
  // Use modern clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showCopyFeedback(messageIndex);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      fallbackCopyTextToClipboard(text, messageIndex);
    });
  } else {
    fallbackCopyTextToClipboard(text, messageIndex);
  }
}

// Fallback copy method for older browsers
function fallbackCopyTextToClipboard(text, messageIndex) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showCopyFeedback(messageIndex);
    }
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }
  
  document.body.removeChild(textArea);
}

// Show copy feedback
function showCopyFeedback(messageIndex) {
  const copyBtn = document.querySelector(`#message-${messageIndex} .copy-btn`);
  if (!copyBtn) return;
  
  const originalText = copyBtn.textContent;
  copyBtn.textContent = "✅ Copied!";
  copyBtn.classList.add('copy-success');
  
  setTimeout(() => {
    copyBtn.textContent = originalText;
    copyBtn.classList.remove('copy-success');
  }, 2000);
}

// Keyboard navigation
document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    const newIndex = currentMessageIndex > 1 ? currentMessageIndex - 1 : 3;
    showMessage(newIndex);
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    const newIndex = currentMessageIndex < 3 ? currentMessageIndex + 1 : 1;
    showMessage(newIndex);
  }
});

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(event) {
  touchStartX = event.changedTouches[0].screenX;
});

document.addEventListener('touchend', function(event) {
  touchEndX = event.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swipe left - next message
      const newIndex = currentMessageIndex < 3 ? currentMessageIndex + 1 : 1;
      showMessage(newIndex);
    } else {
      // Swipe right - previous message
      const newIndex = currentMessageIndex > 1 ? currentMessageIndex - 1 : 3;
      showMessage(newIndex);
    }
  }
} 
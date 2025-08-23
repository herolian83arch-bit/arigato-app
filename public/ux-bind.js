// 音声再生（MP3優先, fallbackでWeb Speech）
export function playAudioOrTTS(text, audioUrl) {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
    return;
  }
  if (window.speechSynthesis) {
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';
    window.speechSynthesis.speak(utter);
  }
}

// お気に入りトグル
export function toggleFavorite(id) {
  const key = `fav:${id}`;
  const now = localStorage.getItem(key) === '1' ? '0' : '1';
  localStorage.setItem(key, now);
  return now === '1';
}

// お気に入り状態取得
export function isFavorite(id) {
  return localStorage.getItem(`fav:${id}`) === '1';
}

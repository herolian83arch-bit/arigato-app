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

// お気に入りトグル（言語保存対応版）
export function toggleFavorite(id) {
  if (!id) return false;

  try {
    const favorites = JSON.parse(localStorage.getItem('arigato_favorites_v1') || '{}');
    const stringId = String(id);

    // 既存データの互換性処理
    const favoriteData = favorites[stringId];
    const currentState = favoriteData === true || (favoriteData && favoriteData.isFavorite === true);
    const newState = !currentState;

    if (newState) {
      // お気に入り登録時：現在の言語を取得・保存（複数ソースから確実に取得）
      const storedLang = localStorage.getItem('selectedLanguage') ||
                         localStorage.getItem('language') ||
                         localStorage.getItem('currentLanguage');
      const globalLang = window.currentLang || currentLang;
      const finalLang = storedLang || globalLang || 'ja';

      console.log(`🔍 言語取得デバッグ: selectedLanguage=${localStorage.getItem('selectedLanguage')}, language=${localStorage.getItem('language')}, currentLanguage=${localStorage.getItem('currentLanguage')}, global=${globalLang}, final=${finalLang}`);

      // 言語が確実に取得できているかチェック
      if (finalLang === 'ja' && storedLang && storedLang !== 'ja') {
        console.warn(`⚠️ 言語取得に問題があります: 期待値=${storedLang}, 実際=${finalLang}`);
      }

      favorites[stringId] = {
        isFavorite: true,
        language: finalLang,
        timestamp: Date.now()
      };
      console.log(`お気に入り登録: ID=${id}, 言語=${finalLang}`);
    } else {
      // お気に入り解除時
      delete favorites[stringId];
      console.log(`お気に入り解除: ID=${id}`);
    }

    localStorage.setItem('arigato_favorites_v1', JSON.stringify(favorites));
    return newState;
  } catch (error) {
    console.warn('Failed to toggle favorite:', error);
    return false;
  }
}

// お気に入り状態取得
export function isFavorite(id) {
  return localStorage.getItem(`fav:${id}`) === '1';
}

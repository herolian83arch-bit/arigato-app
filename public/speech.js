/**
 * 音声再生機能ライブラリ
 * 日本語ボイス優先、連打防止、クリーンアップ機能付き
 */

class SpeechManager {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.japaneseVoice = null;
    this.isSpeaking = false;
    this.currentUtterance = null;
    
    this.init();
  }

  /**
   * 初期化処理
   */
  init() {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // ボイスリストの取得
    this.loadVoices();
    
    // ボイスリスト変更時のイベント
    this.synthesis.addEventListener('voiceschanged', () => {
      this.loadVoices();
    });

    // ページ離脱時のクリーンアップ
    window.addEventListener('beforeunload', () => {
      this.stop();
    });

    // ページ非表示時のクリーンアップ
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      }
    });
  }

  /**
   * ボイスリストを読み込み、日本語ボイスを優先選択
   */
  loadVoices() {
    this.voices = this.synthesis.getVoices();
    
    // 日本語ボイスを優先選択
    this.japaneseVoice = this.voices.find(voice => 
      voice.lang.startsWith('ja') && voice.localService
    ) || this.voices.find(voice => 
      voice.lang.startsWith('ja')
    ) || this.voices.find(voice => 
      voice.lang.startsWith('en')
    ) || this.voices[0];

    console.log('Available voices:', this.voices.length);
    console.log('Selected voice:', this.japaneseVoice?.name || 'None');
  }

  /**
   * 日本語テキストを読み上げ
   * @param {string} text - 読み上げるテキスト
   * @param {Object} options - オプション設定
   */
  speak(text, options = {}) {
    if (!this.synthesis || !this.japaneseVoice) {
      console.warn('Speech synthesis not available');
      return false;
    }

    // 既存の読み上げを停止
    this.stop();

    // 新しい読み上げを作成
    const utterance = new SpeechSynthesisUtterance(text);
    
    // ボイス設定
    utterance.voice = this.japaneseVoice;
    utterance.lang = 'ja-JP';
    
    // 基本設定
    utterance.rate = options.rate || 0.9;  // 少し遅め
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    // イベントハンドラー
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.currentUtterance = utterance;
      console.log('Speech started:', text);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.log('Speech ended:', text);
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.error('Speech error:', event.error);
    };

    // 読み上げ開始
    this.synthesis.speak(utterance);
    return true;
  }

  /**
   * 現在の読み上げを停止
   */
  stop() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.log('Speech stopped');
    }
  }

  /**
   * 読み上げ中かどうかを確認
   */
  isCurrentlySpeaking() {
    return this.isSpeaking;
  }

  /**
   * 利用可能かどうかを確認
   */
  isAvailable() {
    return !!(this.synthesis && this.japaneseVoice);
  }
}

// グローバルインスタンスを作成
let speechManager = null;

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    speechManager = new SpeechManager();
    
    // 初期状態でTTSを有効化（初回訪問時）
    if (!localStorage.getItem('feature_tts')) {
      localStorage.setItem('feature_tts', '1');
    }
  }
});

// 音声再生の簡単なインターフェース
function speakJapanese(text, options = {}) {
  if (speechManager) {
    return speechManager.speak(text, options);
  }
  return false;
}

function stopSpeech() {
  if (speechManager) {
    speechManager.stop();
  }
}

function isSpeechAvailable() {
  return speechManager ? speechManager.isAvailable() : false;
}

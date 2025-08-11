// 機能フラグ設定
// 各機能のON/OFFを一元管理

export const FEATURE_FAVORITES = false; // お気に入り機能（一時無効化）
export const FEATURE_TTS = true; // 音声再生機能
export const FEATURE_PREMIUM = true; // プレミアム機能

// 機能フラグの一覧表示（開発用）
export function getFeatureFlags() {
  return {
    favorites: FEATURE_FAVORITES,
    tts: FEATURE_TTS,
    premium: FEATURE_PREMIUM
  };
}

// 機能フラグの状態確認（開発用）
export function isFeatureEnabled(featureName) {
  const flags = getFeatureFlags();
  return flags[featureName] === true;
}

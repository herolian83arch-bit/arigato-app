// お気に入り機能の状態管理フック
// localStorageを使用した永続化とメモリフォールバック

export const STORAGE_KEY = 'arigato_favorites_v1';

// シンプルな状態管理（クラスベースから関数ベースに変更）
let favorites = {};
let isInitialized = false;

// 初期化（localStorageから読み込み）
function initialize() {
  if (isInitialized) return;
  
  try {
    const raw = typeof window !== 'undefined' 
      ? window.localStorage.getItem(STORAGE_KEY) 
      : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        favorites = parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load favorites from localStorage:', error);
    favorites = {};
  }
  
  isInitialized = true;
}

// 永続化関数
function persist(next) {
  favorites = next;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch (error) {
    console.warn('Failed to save favorites to localStorage:', error);
    // 保存失敗は無視（次回までメモリ保持）
  }
}

// お気に入り状態の確認
function isFavorite(id) {
  if (!isInitialized) initialize();
  if (!id) return false;
  return !!favorites[String(id)];
}

// お気に入りの切り替え
function toggleFavorite(id) {
  if (!isInitialized) initialize();
  if (!id) return false;
  
  const key = String(id);
  const next = { ...favorites, [key]: !favorites[key] };
  persist(next);
  
  return next[key];
}

// お気に入り状態の設定
function setFavorite(id, isFavorite) {
  if (!isInitialized) initialize();
  if (!id) return;
  
  const key = String(id);
  const next = { ...favorites, [key]: isFavorite };
  persist(next);
}

// 全お気に入りの取得
function getAllFavorites() {
  if (!isInitialized) initialize();
  return { ...favorites };
}

// お気に入り数の取得
function getFavoriteCount() {
  if (!isInitialized) initialize();
  return Object.values(favorites).filter(v => v === true).length;
}

// 初期化状態の確認
function getInitializationStatus() {
  return isInitialized;
}

// フック関数（非React環境用）
export function useFavorites() {
  return {
    favorites: getAllFavorites(),
    isFavorite,
    toggleFavorite,
    setFavorite,
    getAllFavorites,
    getFavoriteCount,
    isInitialized: getInitializationStatus
  };
}

// 直接アクセス用（非フック環境用）
export const favoritesAPI = {
  isFavorite,
  toggleFavorite,
  setFavorite,
  getAllFavorites,
  getFavoriteCount,
  isInitialized: getInitializationStatus
};

// 初期化を実行
if (typeof window !== 'undefined') {
  initialize();
}

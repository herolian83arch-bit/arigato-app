// お気に入り機能の状態管理フック
// localStorageを使用した永続化とメモリフォールバック

const STORAGE_KEY = 'arigato_favorites_v1';
const FALLBACK_STORAGE = new Map(); // メモリフォールバック用

class FavoritesManager {
  constructor() {
    this.favorites = new Map();
    this.isInitialized = false;
    this.initialize();
  }

  // 初期化（localStorageから読み込み）
  initialize() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.favorites.clear();
        Object.entries(parsed).forEach(([id, isFavorite]) => {
          this.favorites.set(id, isFavorite);
        });
      }
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to load favorites from localStorage, using memory fallback:', error);
      this.isInitialized = true;
    }
  }

  // お気に入り状態の取得
  isFavorite(id) {
    if (!id) return false;
    const stringId = String(id);
    return this.favorites.get(stringId) === true;
  }

  // お気に入りの切り替え
  toggleFavorite(id) {
    if (!id) return;
    
    const stringId = String(id);
    const currentState = this.favorites.get(stringId) || false;
    const newState = !currentState;
    
    this.favorites.set(stringId, newState);
    this.saveToStorage();
    
    return newState;
  }

  // お気に入り状態の設定
  setFavorite(id, isFavorite) {
    if (!id) return;
    
    const stringId = String(id);
    this.favorites.set(stringId, isFavorite);
    this.saveToStorage();
  }

  // 全お気に入りの取得
  getAllFavorites() {
    const result = {};
    this.favorites.forEach((isFavorite, id) => {
      if (isFavorite) {
        result[id] = true;
      }
    });
    return result;
  }

  // お気に入り数の取得
  getFavoriteCount() {
    let count = 0;
    this.favorites.forEach((isFavorite) => {
      if (isFavorite) count++;
    });
    return count;
  }

  // localStorageへの保存
  saveToStorage() {
    try {
      const data = {};
      this.favorites.forEach((isFavorite, id) => {
        data[id] = isFavorite;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save favorites to localStorage, using memory fallback:', error);
      // メモリフォールバックに保存
      this.favorites.forEach((isFavorite, id) => {
        FALLBACK_STORAGE.set(id, isFavorite);
      });
    }
  }

  // 初期化状態の確認
  getInitializationStatus() {
    return this.isInitialized;
  }
}

// シングルトンインスタンス
const favoritesManager = new FavoritesManager();

// フック関数
export function useFavorites() {
  return {
    // お気に入り状態の確認
    isFavorite: (id) => favoritesManager.isFavorite(id),
    
    // お気に入りの切り替え
    toggleFavorite: (id) => favoritesManager.toggleFavorite(id),
    
    // お気に入り状態の設定
    setFavorite: (id, isFavorite) => favoritesManager.setFavorite(id, isFavorite),
    
    // 全お気に入りの取得
    getAllFavorites: () => favoritesManager.getAllFavorites(),
    
    // お気に入り数の取得
    getFavoriteCount: () => favoritesManager.getFavoriteCount(),
    
    // 初期化状態の確認
    isInitialized: () => favoritesManager.getInitializationStatus()
  };
}

// 直接アクセス用（非フック環境用）
export const favoritesAPI = {
  isFavorite: (id) => favoritesManager.isFavorite(id),
  toggleFavorite: (id) => favoritesManager.toggleFavorite(id),
  setFavorite: (id, isFavorite) => favoritesManager.setFavorite(id, isFavorite),
  getAllFavorites: () => favoritesManager.getAllFavorites(),
  getFavoriteCount: () => favoritesManager.getFavoriteCount(),
  isInitialized: () => favoritesManager.getInitializationStatus()
};

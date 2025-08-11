// お気に入り切り替えボタンコンポーネント
// アクセシビリティ対応、タップ領域40px以上、🔊との干渉防止

class FavoriteToggle {
  constructor(itemId, container) {
    this.itemId = itemId;
    this.container = container;
    this.isFavorite = false;
    this.element = null;
    
    this.init();
  }

  init() {
    // 機能フラグチェック
    if (typeof window !== 'undefined' && window.FEATURE_FAVORITES === false) {
      return; // 機能無効時は何も表示しない
    }

    this.createElement();
    this.attachEventListeners();
    this.updateState();
  }

  createElement() {
    // ボタン要素の作成
    this.element = document.createElement('button');
    this.element.className = 'favorite-toggle-btn';
    this.element.setAttribute('type', 'button');
    this.element.setAttribute('role', 'button');
    this.element.setAttribute('tabindex', '0');
    this.element.setAttribute('aria-label', 'お気に入りに追加');
    this.element.setAttribute('aria-pressed', 'false');
    this.element.setAttribute('data-card-control', 'true');
    
    // スタイル設定（タップ領域40px以上、🔊との余白確保）
    this.element.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      margin-left: 12px;
      font-size: 1.3em;
      color: #bbb;
      user-select: none;
      min-width: 40px;
      min-height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      border-radius: 4px;
      position: relative;
      z-index: 10;
      pointer-events: auto;
    `;

    // 初期アイコン（☆）
    this.element.innerHTML = '☆';
    
    // ホバー効果
    this.element.addEventListener('mouseenter', () => {
      if (!this.isFavorite) {
        this.element.style.color = '#ffd700';
        this.element.style.transform = 'scale(1.1)';
      }
    });
    
    this.element.addEventListener('mouseleave', () => {
      if (!this.isFavorite) {
        this.element.style.color = '#bbb';
        this.element.style.transform = 'scale(1)';
      }
    });
  }

  attachEventListeners() {
    // 最小実装：必要最小限のガードのみ
    
    // クリックイベント
    this.element.addEventListener('click', (e) => {
      e.stopPropagation(); // 親への伝播のみ防止
      this.toggleFavorite();
    });

    // キーボードイベント（Enter, Space）
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        this.toggleFavorite();
      }
    });

    // タッチイベント（モバイル対応）
    this.element.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      this.element.style.transform = 'scale(0.95)';
    });

    this.element.addEventListener('touchend', (e) => {
      e.stopPropagation();
      this.element.style.transform = this.isFavorite ? 'scale(1.1)' : 'scale(1)';
      this.toggleFavorite();
    });
  }

  toggleFavorite() {
    if (!this.itemId) {
      console.warn('FavoriteToggle: itemId is required');
      return;
    }

    // お気に入りAPIを使用して状態を切り替え
    if (window.favoritesAPI) {
      this.isFavorite = window.favoritesAPI.toggleFavorite(this.itemId);
    } else {
      // フォールバック（既存のlocalStorage直接アクセス）
      try {
        const favorites = JSON.parse(localStorage.getItem('arigato_favorites_v1') || '{}');
        favorites[this.itemId] = !favorites[this.itemId];
        this.isFavorite = favorites[this.itemId];
        localStorage.setItem('arigato_favorites_v1', JSON.stringify(favorites));
      } catch (error) {
        console.warn('Failed to toggle favorite:', error);
        this.isFavorite = !this.isFavorite;
      }
    }

    this.updateState();
    
    // カスタムイベントの発火（親コンポーネントへの通知）
    const event = new CustomEvent('favoriteChanged', {
      detail: {
        itemId: this.itemId,
        isFavorite: this.isFavorite
      },
      bubbles: false // イベントの伝播を防ぐ
    });
    this.container.dispatchEvent(event);
  }

  updateState() {
    if (!this.element) return;

    if (this.isFavorite) {
      this.element.innerHTML = '★';
      this.element.style.color = '#ffd700';
      this.element.style.transform = 'scale(1.1)';
      this.element.setAttribute('aria-label', 'お気に入りから削除');
      this.element.setAttribute('aria-pressed', 'true');
    } else {
      this.element.innerHTML = '☆';
      this.element.style.color = '#bbb';
      this.element.style.transform = 'scale(1)';
      this.element.setAttribute('aria-label', 'お気に入りに追加');
      this.element.setAttribute('aria-pressed', 'false');
    }
  }

  // 外部からの状態更新
  setFavoriteState(isFavorite) {
    this.isFavorite = isFavorite;
    this.updateState();
  }

  // 要素の取得
  getElement() {
    return this.element;
  }

  // 破棄
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// グローバル関数として登録（既存コードとの互換性）
window.FavoriteToggle = FavoriteToggle;

// ファクトリ関数
window.createFavoriteToggle = function(itemId, container) {
  return new FavoriteToggle(itemId, container);
};

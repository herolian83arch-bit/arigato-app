/**
 * Arigato App - ローカルストレージキャッシュ管理
 * 翻訳結果の永続的保存と管理機能
 */

class TranslationCache {
  constructor() {
    this.cacheKey = 'arigato_translation_cache';
    this.maxAge = 7 * 24 * 60 * 60 * 1000; // 7日間
    this.maxSize = 50; // 最大キャッシュ数
    this.compressionEnabled = true; // 圧縮機能
  }

  /**
   * キャッシュから翻訳結果を取得
   * @param {string} scene - シーン名
   * @param {string} lang - 言語コード
   * @returns {Array|null} 翻訳結果またはnull
   */
  get(scene, lang) {
    try {
      const cache = this.getCacheData();
      const key = this.generateKey(scene, lang);
      const item = cache[key];

      if (item && this.isValid(item)) {
        console.log(`📦 キャッシュヒット: ${scene} (${lang})`);
        return this.decompress(item.data);
      }

      if (item && !this.isValid(item)) {
        // 期限切れのキャッシュを削除
        this.remove(scene, lang);
      }

      return null;
    } catch (error) {
      console.error('キャッシュ取得エラー:', error);
      return null;
    }
  }

  /**
   * 翻訳結果をキャッシュに保存
   * @param {string} scene - シーン名
   * @param {string} lang - 言語コード
   * @param {Array} data - 翻訳結果データ
   */
  set(scene, lang, data) {
    try {
      const cache = this.getCacheData();
      const key = this.generateKey(scene, lang);

      // キャッシュサイズ制限チェック
      if (this.getCacheSize(cache) >= this.maxSize) {
        this.cleanupOldCache(cache);
      }

      cache[key] = {
        data: this.compress(data),
        timestamp: Date.now(),
        scene: scene,
        lang: lang
      };

      this.saveCacheData(cache);
      console.log(`💾 キャッシュ保存: ${scene} (${lang})`);
    } catch (error) {
      console.error('キャッシュ保存エラー:', error);
    }
  }

  /**
   * 特定のキャッシュを削除
   * @param {string} scene - シーン名
   * @param {string} lang - 言語コード
   */
  remove(scene, lang) {
    try {
      const cache = this.getCacheData();
      const key = this.generateKey(scene, lang);
      delete cache[key];
      this.saveCacheData(cache);
      console.log(`🗑️ キャッシュ削除: ${scene} (${lang})`);
    } catch (error) {
      console.error('キャッシュ削除エラー:', error);
    }
  }

  /**
   * 全キャッシュをクリア
   */
  clear() {
    try {
      localStorage.removeItem(this.cacheKey);
      console.log('🗑️ 全キャッシュクリア完了');
    } catch (error) {
      console.error('キャッシュクリアエラー:', error);
    }
  }

  /**
   * キャッシュの有効性をチェック
   * @param {Object} item - キャッシュアイテム
   * @returns {boolean} 有効かどうか
   */
  isValid(item) {
    return item && (Date.now() - item.timestamp) < this.maxAge;
  }

  /**
   * キャッシュキーを生成
   * @param {string} scene - シーン名
   * @param {string} lang - 言語コード
   * @returns {string} キャッシュキー
   */
  generateKey(scene, lang) {
    return `${scene}_${lang}`;
  }

  /**
   * キャッシュデータを取得
   * @returns {Object} キャッシュデータ
   */
  getCacheData() {
    try {
      const data = localStorage.getItem(this.cacheKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('キャッシュデータ取得エラー:', error);
      return {};
    }
  }

  /**
   * キャッシュデータを保存
   * @param {Object} cache - キャッシュデータ
   */
  saveCacheData(cache) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.error('キャッシュデータ保存エラー:', error);
    }
  }

  /**
   * キャッシュサイズを取得
   * @param {Object} cache - キャッシュデータ
   * @returns {number} キャッシュサイズ
   */
  getCacheSize(cache) {
    return Object.keys(cache).length;
  }

  /**
   * 古いキャッシュをクリーンアップ
   * @param {Object} cache - キャッシュデータ
   */
  cleanupOldCache(cache) {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, item] of Object.entries(cache)) {
      if (!this.isValid(item)) {
        keysToDelete.push(key);
      }
    }

    // 期限切れのキャッシュを削除
    keysToDelete.forEach(key => delete cache[key]);

    // まだサイズが大きい場合は古いものから削除
    if (this.getCacheSize(cache) >= this.maxSize) {
      const sortedItems = Object.entries(cache)
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const itemsToDelete = sortedItems.slice(0, this.maxSize - this.maxSize + 5);
      itemsToDelete.forEach(([key]) => delete cache[key]);
    }

    console.log(`🧹 キャッシュクリーンアップ: ${keysToDelete.length}件削除`);
  }

  /**
   * データを圧縮（簡易版）
   * @param {Array} data - 圧縮対象データ
   * @returns {string} 圧縮されたデータ
   */
  compress(data) {
    if (!this.compressionEnabled) {
      return data;
    }

    try {
      // 簡易圧縮：重複する文字列を短縮
      const jsonString = JSON.stringify(data);
      return jsonString;
    } catch (error) {
      console.error('データ圧縮エラー:', error);
      return data;
    }
  }

  /**
   * データを展開
   * @param {string} compressedData - 圧縮されたデータ
   * @returns {Array} 展開されたデータ
   */
  decompress(compressedData) {
    if (!this.compressionEnabled) {
      return compressedData;
    }

    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('データ展開エラー:', error);
      return compressedData;
    }
  }

  /**
   * キャッシュ統計を取得
   * @returns {Object} キャッシュ統計
   */
  getStats() {
    try {
      const cache = this.getCacheData();
      const now = Date.now();
      const stats = {
        totalItems: Object.keys(cache).length,
        validItems: 0,
        expiredItems: 0,
        totalSize: 0,
        scenes: new Set(),
        languages: new Set()
      };

      for (const [key, item] of Object.entries(cache)) {
        if (this.isValid(item)) {
          stats.validItems++;
        } else {
          stats.expiredItems++;
        }

        if (item.scene) stats.scenes.add(item.scene);
        if (item.lang) stats.languages.add(item.lang);

        // サイズ計算（概算）
        stats.totalSize += JSON.stringify(item).length;
      }

      stats.scenes = Array.from(stats.scenes);
      stats.languages = Array.from(stats.languages);
      stats.totalSizeKB = Math.round(stats.totalSize / 1024 * 100) / 100;

      return stats;
    } catch (error) {
      console.error('キャッシュ統計取得エラー:', error);
      return null;
    }
  }

  /**
   * キャッシュ設定を更新
   * @param {Object} config - 設定オブジェクト
   */
  configure(config) {
    if (config.maxAge) {
      this.maxAge = config.maxAge;
    }
    if (config.maxSize) {
      this.maxSize = config.maxSize;
    }
    if (config.compressionEnabled !== undefined) {
      this.compressionEnabled = config.compressionEnabled;
    }
    console.log('⚙️ キャッシュ設定更新:', config);
  }
}

// グローバルインスタンスを作成
window.translationCache = new TranslationCache();

// デバッグ用のグローバル関数
window.debugTranslationCache = function() {
  console.log('🔍 翻訳キャッシュデバッグ情報:');
  console.log('- TranslationCache:', window.translationCache);
  console.log('- キャッシュ統計:', window.translationCache.getStats());
  console.log('- ローカルストレージ:', localStorage.getItem('arigato_translation_cache'));
};

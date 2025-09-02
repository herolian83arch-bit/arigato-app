/**
 * Arigato App - 多言語翻訳API
 * Google翻訳APIを使用した段階的翻訳機能
 */

class TranslationAPI {
  constructor() {
    this.apiKey = 'AIzaSyCYxjAwaKi1KRwsYF0CvO69O5X0gCADdIs';
    this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
    this.cache = new Map(); // メモリキャッシュ（高速アクセス用）
    this.localCache = null; // ローカルストレージキャッシュ（永続化用）
    this.supportedLanguages = {
      'ja': '日本語',
      'en': 'English',
      'zh': '中文',
      'ko': '한국어',
      'de': 'Deutsch',
      'fr': 'Français',
      'it': 'Italiano',
      'zh-TW': '繁體中文'
    };

    // ローカルストレージキャッシュの初期化
    this.initializeLocalCache();
  }

  /**
   * ローカルストレージキャッシュを初期化
   */
  initializeLocalCache() {
    try {
      if (typeof window !== 'undefined' && window.translationCache) {
        this.localCache = window.translationCache;
        console.log('✅ ローカルストレージキャッシュ初期化完了');
      } else {
        console.warn('⚠️ ローカルストレージキャッシュが利用できません');
      }
    } catch (error) {
      console.error('ローカルストレージキャッシュ初期化エラー:', error);
    }
  }

  /**
   * テキストを翻訳
   * @param {string} text - 翻訳対象のテキスト
   * @param {string} targetLang - 翻訳先言語
   * @returns {Promise<string>} 翻訳結果
   */
  async translateText(text, targetLang) {
    if (!text || targetLang === 'ja') {
      return text; // 日本語の場合は翻訳不要
    }

    // キャッシュチェック
    const cacheKey = `${text}_${targetLang}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          source: 'ja'
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;

      // キャッシュに保存
      this.cache.set(cacheKey, translatedText);

      return translatedText;
    } catch (error) {
      console.error('翻訳エラー:', error);
      return text; // エラー時は元のテキストを返す
    }
  }

  /**
   * 複数テキストを一括翻訳（バッチ翻訳）
   * @param {Array<string>} texts - 翻訳対象のテキスト配列
   * @param {string} targetLang - 翻訳先言語
   * @returns {Promise<Array<string>>} 翻訳結果の配列
   */
  async translateBatch(texts, targetLang) {
    if (targetLang === 'ja' || !texts || texts.length === 0) {
      return texts; // 日本語の場合は翻訳不要
    }

    // キャッシュチェック（バッチ用）
    const cacheKey = `batch_${texts.join('|')}_${targetLang}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: texts, // 配列で一括送信
          target: targetLang,
          source: 'ja'
        })
      });

      if (!response.ok) {
        throw new Error(`Batch translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedTexts = data.data.translations.map(t => t.translatedText);

      // キャッシュに保存
      this.cache.set(cacheKey, translatedTexts);

      return translatedTexts;
    } catch (error) {
      console.error('バッチ翻訳エラー:', error);
      // エラー時は個別翻訳にフォールバック
      return await this.translateMultipleTexts(texts, targetLang);
    }
  }

  /**
   * 複数テキストを順次翻訳（フォールバック用）
   * @param {Array<string>} texts - 翻訳対象のテキスト配列
   * @param {string} targetLang - 翻訳先言語
   * @returns {Promise<Array<string>>} 翻訳結果の配列
   */
  async translateMultipleTexts(texts, targetLang) {
    if (targetLang === 'ja') {
      return texts; // 日本語の場合は翻訳不要
    }

    const results = [];
    for (const text of texts) {
      const translated = await this.translateText(text, targetLang);
      results.push(translated);

      // API制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * シーンのタイトルを翻訳
   * @param {string} sceneTitle - シーンのタイトル
   * @param {string} targetLang - 翻訳先言語
   * @returns {Promise<string>} 翻訳されたシーンのタイトル
   */
  async translateSceneTitle(sceneTitle, targetLang) {
    return await this.translateText(sceneTitle, targetLang);
  }

  /**
   * シーンの例文を翻訳（バッチ翻訳 + ローカルストレージキャッシュ対応）
   * @param {Array} sceneItems - シーンの例文配列
   * @param {string} targetLang - 翻訳先言語
   * @param {string} sceneName - シーン名（キャッシュ用）
   * @returns {Promise<Array>} 翻訳された例文配列
   */
  async translateSceneItems(sceneItems, targetLang, sceneName = '') {
    if (targetLang === 'ja') {
      return sceneItems; // 日本語の場合は翻訳不要
    }

    // ローカルストレージキャッシュチェック
    if (this.localCache && sceneName) {
      const cachedData = this.localCache.get(sceneName, targetLang);
      if (cachedData) {
        console.log(`📦 ローカルストレージキャッシュヒット: ${sceneName} (${targetLang})`);
        return cachedData;
      }
    }

    // 翻訳対象テキストを抽出
    const textsToTranslate = [];
    const textMapping = [];

    sceneItems.forEach((item, index) => {
      // mainフィールドを翻訳
      if (item.main) {
        textsToTranslate.push(item.main);
        textMapping.push({ type: 'main', index: index, original: item.main });
      }

      // description.jaフィールドを翻訳
      if (item.description && item.description.ja) {
        textsToTranslate.push(item.description.ja);
        textMapping.push({ type: 'description', index: index, original: item.description.ja });
      }
    });

    // バッチ翻訳実行
    const translatedTexts = await this.translateBatch(textsToTranslate, targetLang);

    // 結果をマッピング
    const translatedItems = sceneItems.map((item, index) => {
      const translatedItem = { ...item };

      // mainフィールドは元の日本語を保持（音声再生用）
      // 翻訳結果をtranslatedMainフィールドに保存（表示用）
      const mainMapping = textMapping.find(m => m.type === 'main' && m.index === index);
      if (mainMapping) {
        const mainIndex = textMapping.indexOf(mainMapping);
        translatedItem.translatedMain = translatedTexts[mainIndex];
      }

      // descriptionフィールドの翻訳結果を適用
      const descMapping = textMapping.find(m => m.type === 'description' && m.index === index);
      if (descMapping) {
        const descIndex = textMapping.indexOf(descMapping);
        translatedItem.description = {
          ...item.description,
          [targetLang]: translatedTexts[descIndex]
        };
      }

      // romajiは翻訳対象外（そのまま保持）

      return translatedItem;
    });

    // ローカルストレージキャッシュに保存
    if (this.localCache && sceneName) {
      this.localCache.set(sceneName, targetLang, translatedItems);
    }

    return translatedItems;
  }

  /**
   * 言語名を取得
   * @param {string} langCode - 言語コード
   * @returns {string} 言語名
   */
  getLanguageName(langCode) {
    return this.supportedLanguages[langCode] || langCode;
  }

  /**
   * サポートされている言語の一覧を取得
   * @returns {Object} 言語コードと名前のマッピング
   */
  getSupportedLanguages() {
    return { ...this.supportedLanguages };
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.cache.clear(); // メモリキャッシュをクリア

    if (this.localCache) {
      this.localCache.clear(); // ローカルストレージキャッシュをクリア
    }

    console.log('🗑️ 全キャッシュクリア完了');
  }

  /**
   * キャッシュ統計を取得
   * @returns {Object} キャッシュ統計
   */
  getCacheStats() {
    const memoryStats = {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };

    const localStats = this.localCache ? this.localCache.getStats() : null;

    return {
      memory: memoryStats,
      local: localStats,
      total: {
        memoryItems: memoryStats.size,
        localItems: localStats ? localStats.totalItems : 0,
        totalItems: memoryStats.size + (localStats ? localStats.totalItems : 0)
      }
    };
  }
}

// グローバルインスタンスを作成
window.translationAPI = new TranslationAPI();

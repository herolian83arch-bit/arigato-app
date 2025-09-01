/**
 * Arigato App - 多言語翻訳API
 * Google翻訳APIを使用した段階的翻訳機能
 */

class TranslationAPI {
  constructor() {
    this.apiKey = 'AIzaSyCYxjAwaKi1KRwsYF0CvO69O5X0gCADdIs';
    this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
    this.cache = new Map(); // 翻訳結果のキャッシュ
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
   * 複数テキストを一括翻訳
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
   * シーンの例文を翻訳
   * @param {Array} sceneItems - シーンの例文配列
   * @param {string} targetLang - 翻訳先言語
   * @returns {Promise<Array>} 翻訳された例文配列
   */
  async translateSceneItems(sceneItems, targetLang) {
    if (targetLang === 'ja') {
      return sceneItems; // 日本語の場合は翻訳不要
    }

    const translatedItems = [];
    for (const item of sceneItems) {
      const translatedItem = { ...item };

      // textフィールドを翻訳
      if (item.text) {
        // HTMLタグを除去して翻訳
        const cleanText = item.text.replace(/<[^>]*>/g, '');
        const translatedText = await this.translateText(cleanText, targetLang);
        translatedItem.text = translatedText;
      }

      // noteフィールドを翻訳
      if (item.note) {
        const translatedNote = await this.translateText(item.note, targetLang);
        translatedItem.note = translatedNote;
      }

      // jaフィールドを翻訳
      if (item.ja) {
        const translatedJa = await this.translateText(item.ja, targetLang);
        translatedItem.ja = translatedJa;
      }

      // romajiは翻訳対象外（そのまま保持）

      translatedItems.push(translatedItem);

      // API制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
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
    this.cache.clear();
  }
}

// グローバルインスタンスを作成
window.translationAPI = new TranslationAPI();

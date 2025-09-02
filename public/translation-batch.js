/**
 * Arigato App - バッチ翻訳専用機能
 * オノマトペ辞典の高速翻訳機能
 */

class BatchTranslationManager {
  constructor() {
    this.translationAPI = window.translationAPI;
    this.batchSize = 15; // 1シーンの例文数
    this.maxRetries = 3; // 最大リトライ回数
  }

  /**
   * シーンの例文を高速バッチ翻訳
   * @param {Array} sceneItems - シーンの例文配列
   * @param {string} targetLang - 翻訳先言語
   * @param {string} sceneName - シーン名（ログ用）
   * @returns {Promise<Array>} 翻訳された例文配列
   */
  async translateSceneBatch(sceneItems, targetLang, sceneName = '') {
    const startTime = Date.now();
    console.log(`🚀 バッチ翻訳開始: ${sceneName} (${targetLang})`);

    try {
      // バッチ翻訳実行
      const translatedItems = await this.translationAPI.translateSceneItems(sceneItems, targetLang);

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`✅ バッチ翻訳完了: ${sceneName} (${targetLang}) - ${duration}ms`);

      return translatedItems;
    } catch (error) {
      console.error(`❌ バッチ翻訳エラー: ${sceneName} (${targetLang})`, error);

      // フォールバック: 個別翻訳
      return await this.fallbackTranslation(sceneItems, targetLang, sceneName);
    }
  }

  /**
   * フォールバック翻訳（個別翻訳）
   * @param {Array} sceneItems - シーンの例文配列
   * @param {string} targetLang - 翻訳先言語
   * @param {string} sceneName - シーン名（ログ用）
   * @returns {Promise<Array>} 翻訳された例文配列
   */
  async fallbackTranslation(sceneItems, targetLang, sceneName = '') {
    console.log(`🔄 フォールバック翻訳開始: ${sceneName} (${targetLang})`);

    const translatedItems = [];
    for (let i = 0; i < sceneItems.length; i++) {
      const item = sceneItems[i];
      const translatedItem = { ...item };

      try {
        // mainフィールドを翻訳
        if (item.main) {
          translatedItem.main = await this.translationAPI.translateText(item.main, targetLang);
        }

        // description.jaフィールドを翻訳
        if (item.description && item.description.ja) {
          translatedItem.description = {
            ...item.description,
            [targetLang]: await this.translationAPI.translateText(item.description.ja, targetLang)
          };
        }

        translatedItems.push(translatedItem);

        // 進捗表示
        if ((i + 1) % 5 === 0) {
          console.log(`📊 翻訳進捗: ${sceneName} ${i + 1}/${sceneItems.length}`);
        }

        // API制限を考慮して少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ 個別翻訳エラー: ${sceneName} [${i}]`, error);
        translatedItems.push(item); // エラー時は元のアイテムを保持
      }
    }

    console.log(`✅ フォールバック翻訳完了: ${sceneName} (${targetLang})`);
    return translatedItems;
  }

  /**
   * 翻訳パフォーマンス統計
   * @param {string} sceneName - シーン名
   * @param {number} itemCount - 例文数
   * @param {number} duration - 翻訳時間（ms）
   * @param {string} method - 翻訳方法
   */
  logPerformance(sceneName, itemCount, duration, method = 'batch') {
    const avgTimePerItem = duration / itemCount;
    const itemsPerSecond = (itemCount / duration) * 1000;

    console.log(`📈 翻訳パフォーマンス: ${sceneName}`);
    console.log(`   - 方法: ${method}`);
    console.log(`   - 例文数: ${itemCount}`);
    console.log(`   - 総時間: ${duration}ms`);
    console.log(`   - 平均時間/例文: ${avgTimePerItem.toFixed(2)}ms`);
    console.log(`   - 翻訳速度: ${itemsPerSecond.toFixed(2)}例文/秒`);
  }

  /**
   * バッチ翻訳の最適化設定
   * @param {Object} config - 設定オブジェクト
   */
  configure(config) {
    if (config.batchSize) {
      this.batchSize = config.batchSize;
    }
    if (config.maxRetries) {
      this.maxRetries = config.maxRetries;
    }
    console.log(`⚙️ バッチ翻訳設定更新:`, config);
  }

  /**
   * 翻訳キャッシュの状態確認
   * @returns {Object} キャッシュ統計
   */
  getCacheStats() {
    const cache = this.translationAPI.cache;
    const cacheSize = cache.size;
    const cacheKeys = Array.from(cache.keys());

    const stats = {
      size: cacheSize,
      keys: cacheKeys,
      batchKeys: cacheKeys.filter(key => key.startsWith('batch_')),
      individualKeys: cacheKeys.filter(key => !key.startsWith('batch_'))
    };

    console.log(`📊 キャッシュ統計:`, stats);
    return stats;
  }

  /**
   * キャッシュクリア
   */
  clearCache() {
    this.translationAPI.clearCache();
    console.log(`🗑️ 翻訳キャッシュクリア完了`);
  }
}

// グローバルインスタンスを作成
window.batchTranslationManager = new BatchTranslationManager();

// デバッグ用のグローバル関数
window.debugBatchTranslation = function() {
  console.log('🔍 バッチ翻訳デバッグ情報:');
  console.log('- TranslationAPI:', window.translationAPI);
  console.log('- BatchTranslationManager:', window.batchTranslationManager);
  console.log('- キャッシュ統計:', window.batchTranslationManager.getCacheStats());
};

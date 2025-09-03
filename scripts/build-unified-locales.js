#!/usr/bin/env node

/**
 * Arigato App - Unified Locale Builder
 * 個別シーンファイルを統合して、フロントエンドが期待する形式のJSONファイルを生成
 *
 * 使用方法:
 * npm run build-unified-locales
 *
 * 出力:
 * public/locales/{lang}.json (統合ファイル)
 */

const fs = require('fs').promises;
const path = require('path');

// サポート言語
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'ja': '日本語',
  'zh': '中文',
  'ko': '한국어',
  'pt': 'Português',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'it': 'Italiano',
  'ru': 'Русский'
};

/**
 * 個別シーンファイルを読み込み
 */
async function loadSceneFile(lang, sceneId) {
  try {
    const scenePath = path.join('public', 'locales', lang, `scene-${sceneId.toString().padStart(2, '0')}.json`);
    const content = await fs.readFile(scenePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ シーンファイル読み込み失敗 (${lang}/scene-${sceneId}):`, error.message);
    return null;
  }
}

/**
 * 言語の統合ファイルを生成
 */
async function buildUnifiedLocale(lang) {
  console.log(`🌐 ${SUPPORTED_LANGUAGES[lang]} (${lang}) の統合ファイルを生成中...`);

  const unifiedData = {
    scenes: {}
  };

  // 41シーンのデータを統合
  for (let sceneId = 1; sceneId <= 41; sceneId++) {
    const sceneData = await loadSceneFile(lang, sceneId);

    if (sceneData) {
      // シーンキーを生成（既存のフロントエンドの期待に合わせる）
      const sceneKey = `scene_${sceneId}`;

      unifiedData.scenes[sceneKey] = {
        title: sceneData.scene,
        messages: sceneData.messages.map(msg => ({
          number: msg.id,
          text: msg.text || msg.main, // textフィールドが存在する場合はそれを使用、なければmainを使用
          romaji: msg.romaji,
          note: msg.description,
          ja: msg.main // 日本語版の場合は元のテキストを保持
        }))
      };

      console.log(`  ✅ scene-${sceneId.toString().padStart(2, '0')} 統合完了`);
    } else {
      console.warn(`  ⚠️ scene-${sceneId.toString().padStart(2, '0')} 読み込み失敗`);
    }
  }

  return unifiedData;
}

/**
 * 統合ファイルを保存
 */
async function saveUnifiedLocale(lang, data) {
  try {
    const outputPath = path.join('public', 'locales', `${lang}.json`);
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`💾 ${lang}.json 保存完了`);
    return true;
  } catch (error) {
    console.error(`❌ ${lang}.json 保存失敗:`, error.message);
    return false;
  }
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log('🚀 Arigato App - Unified Locale Builder 開始');
    console.log(`📚 対象言語: ${Object.keys(SUPPORTED_LANGUAGES).length}言語`);
    console.log(`🎭 対象シーン: 41シーン`);

    // 各言語の統合ファイルを生成
    for (const lang of Object.keys(SUPPORTED_LANGUAGES)) {
      const unifiedData = await buildUnifiedLocale(lang);

      if (unifiedData && Object.keys(unifiedData.scenes).length > 0) {
        const success = await saveUnifiedLocale(lang, unifiedData);
        if (success) {
          console.log(`🎉 ${SUPPORTED_LANGUAGES[lang]} 統合完了！`);
        }
      } else {
        console.error(`❌ ${SUPPORTED_LANGUAGES[lang]} 統合失敗`);
      }
    }

    console.log('\n🎊 全言語の統合ファイル生成完了！');
    console.log('📁 出力先: public/locales/{lang}.json');
    console.log('🔧 フロントエンドが期待するパスに合わせました');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain()を呼び出し
if (require.main === module) {
  main();
}

module.exports = {
  buildUnifiedLocale,
  saveUnifiedLocale
};

#!/usr/bin/env node

/**
 * Arigato App - Locale Builder
 * 41シーン×10言語の翻訳ファイルを事前生成
 *
 * 使用方法:
 * 1. GOOGLE_TRANSLATE_API_KEY環境変数を設定
 * 2. npm run build-locales を実行
 *
 * 出力:
 * public/locales/{lang}/scene-{id}.json
 */

const fs = require('fs').promises;
const path = require('path');

// サポート言語（romaji以外）
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

// 翻訳対象フィールド
const TRANSLATABLE_FIELDS = ['main', 'description', 'scene'];

// Google翻訳API（実際の実装では環境変数から取得）
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

/**
 * テキストを翻訳（Google翻訳API使用）
 */
async function translateText(text, targetLang, sourceLang = 'ja') {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    console.warn('⚠️  Google翻訳APIキーが設定されていません。ダミーテキストを生成します。');
    return `[${targetLang.toUpperCase()}] ${text}`;
  }

  try {
    // Google翻訳APIの実装（実際のAPIキーがある場合）
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        source: sourceLang
      })
    });

    const data = await response.json();
    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error(`翻訳エラー (${targetLang}):`, error);
    return `[${targetLang.toUpperCase()}] ${text}`;
  }
}

/**
 * シーン別にデータを分割
 */
function splitDataByScene(data) {
  const scenes = {};

  data.forEach(item => {
    const sceneId = item.sceneId;
    if (!scenes[sceneId]) {
      scenes[sceneId] = {
        scene: item.scene,
        messages: []
      };
    }
    scenes[sceneId].messages.push(item);
  });

  return scenes;
}

/**
 * シーンデータを翻訳
 */
async function translateSceneData(sceneData, targetLang) {
  const translatedScene = {
    scene: await translateText(sceneData.scene, targetLang),
    messages: []
  };

  for (const message of sceneData.messages) {
    const translatedMessage = {
      id: message.id,
      sceneId: message.sceneId,
      romaji: message.romaji, // 翻訳除外
      text: message.text, // 翻訳除外
      main: await translateText(message.main, targetLang),
      description: await translateText(message.description.ja, targetLang),
      translation: message.translation // 既存翻訳を保持
    };

    translatedScene.messages.push(translatedMessage);
  }

  return translatedScene;
}

/**
 * 言語別の翻訳ファイルを生成
 */
async function generateLanguageFiles(data, targetLang) {
  console.log(`🌐 ${SUPPORTED_LANGUAGES[targetLang]} (${targetLang}) の翻訳を開始...`);

  const scenes = splitDataByScene(data);
  const langDir = path.join('public', 'locales', targetLang);

  // 言語ディレクトリを作成
  await fs.mkdir(langDir, { recursive: true });

  // 各シーンの翻訳ファイルを生成
  for (const [sceneId, sceneData] of Object.entries(scenes)) {
    const translatedScene = await translateSceneData(sceneData, targetLang);
    const sceneFile = path.join(langDir, `scene-${sceneId.padStart(2, '0')}.json`);

    await fs.writeFile(sceneFile, JSON.stringify(translatedScene, null, 2), 'utf8');
    console.log(`  ✅ scene-${sceneId.padStart(2, '0')}.json 生成完了`);
  }

  console.log(`🎉 ${SUPPORTED_LANGUAGES[targetLang]} の翻訳完了！`);
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log('🚀 Arigato App - Locale Builder 開始');
    console.log(`📚 対象言語: ${Object.keys(SUPPORTED_LANGUAGES).length}言語`);
    console.log(`🎭 対象シーン: 41シーン`);

    // dictionary.jsonを読み込み
    const dataPath = path.join('public', 'data', 'dictionary.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    console.log(`📖 データ読み込み完了: ${data.length}件`);

    // 各言語の翻訳ファイルを生成
    for (const lang of Object.keys(SUPPORTED_LANGUAGES)) {
      if (lang === 'ja') {
        // 日本語は元データをそのままコピー
        console.log(`🇯🇵 日本語: 元データをコピー中...`);
        const scenes = splitDataByScene(data);
        const langDir = path.join('public', 'locales', lang);
        await fs.mkdir(langDir, { recursive: true });

        for (const [sceneId, sceneData] of Object.entries(scenes)) {
          const sceneFile = path.join(langDir, `scene-${sceneId.padStart(2, '0')}.json`);
          await fs.writeFile(sceneFile, JSON.stringify(sceneData, null, 2), 'utf8');
        }
        console.log(`  ✅ 日本語データコピー完了`);
      } else {
        await generateLanguageFiles(data, lang);
      }
    }

    console.log('\n🎊 全言語の翻訳ファイル生成完了！');
    console.log('📁 出力先: public/locales/{lang}/scene-{id}.json');

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
  translateText,
  splitDataByScene,
  translateSceneData,
  generateLanguageFiles
};

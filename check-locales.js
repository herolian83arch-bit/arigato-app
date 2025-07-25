const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const localeData = files.map(file => ({
  name: file,
  data: JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'))
}));

// 1つ目を基準に比較
const base = localeData[0];
let ok = true;

for (const { name, data } of localeData) {
  // シーン名の一致チェック
  const baseScenes = Object.keys(base.data.scenes);
  const scenes = Object.keys(data.scenes);
  if (JSON.stringify(baseScenes) !== JSON.stringify(scenes)) {
    console.error(`❌ ${name}: シーン名が一致しません:`, scenes, '≠', baseScenes);
    ok = false;
  }
  // 各シーンのメッセージ数チェック
  for (const scene of baseScenes) {
    const baseMsgs = base.data.scenes[scene]?.messages || [];
    const msgs = data.scenes[scene]?.messages || [];
    if (baseMsgs.length !== msgs.length) {
      console.error(`❌ ${name}: ${scene} のメッセージ数が一致しません:`, msgs.length, '≠', baseMsgs.length);
      ok = false;
    }
  }
}

if (ok) {
  console.log('✅ 全てのlocales/*.jsonの整合性はOKです！');
} else {
  console.log('⚠️ 整合性に問題があります。上記エラーを修正してください。');
} 
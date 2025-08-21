import fs from "fs";
import path from "path";

const dictPath = path.resolve("public/data/dictionary.json");
const raw = fs.readFileSync(dictPath, "utf8");
const data = JSON.parse(raw);

// 1. 件数チェック
const total = data.length;
const sceneCount = new Set(data.map(d => d.sceneId)).size;

// 2. translation露出チェック
const translationLeak = data.filter(d => "translation" in d);

// 3. Object表示想定（例: [object Object]）
const objectLeak = data.filter(d =>
  JSON.stringify(d).includes("[object Object]")
);

// レポート出力
const now = new Date().toISOString().replace(/[:.]/g, "-");
const reportFile = `reports/verify-${now}.md`;
fs.mkdirSync("reports", { recursive: true });

const summary = `
# Verify Report (${now})
- Total entries: ${total}
- Unique scenes: ${sceneCount}
- Translation fields: ${translationLeak.length}
- [object Object] issues: ${objectLeak.length}
`;

fs.writeFileSync(reportFile, summary);
console.log(summary);
console.log(`Report saved to ${reportFile}`);

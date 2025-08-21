import fs from 'fs';
import path from 'path';

const ROOT = 'public/locales';
const targets: string[] = [];

(function walk(dir: string){
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)){
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name.endsWith('.json')) targets.push(p);
  }
})(ROOT);

const result: Record<string, number> = {};
for (const file of targets) {
  const txt = fs.readFileSync(file, 'utf8');
  // 文字列検索でざっくり数える（後段で厳密削除を実施）
  const count = (txt.match(/"translation"\s*:/g) || []).length;
  result[file] = count;
}

fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/audit-translation.json', JSON.stringify(result, null, 2));
console.log('Audit written to reports/audit-translation.json');


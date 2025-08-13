import fs from 'fs';
import path from 'path';

const ROOT = 'public/locales';
const edited: string[] = [];
const backups: Record<string, number> = {};

function stripTranslation(obj: any): any {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) return obj.map(stripTranslation);
    const out: any = {};
    for (const k of Object.keys(obj)) {
      if (k === 'translation') continue; // ← これだけを消す
      out[k] = stripTranslation(obj[k]);
    }
    return out;
  }
  return obj;
}

function processFile(file: string){
  const raw = fs.readFileSync(file, 'utf8');
  let data: any;
  try { data = JSON.parse(raw); } catch { return; }
  const stripped = stripTranslation(data);
  const out = JSON.stringify(stripped, null, 2); // インデント維持
  if (out !== raw) {
    edited.push(file);
    backups[file] = raw.length;
    fs.writeFileSync(file, out, 'utf8');
  }
}

(function walk(dir: string){
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)){
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name.endsWith('.json')) processFile(p);
  }
})(ROOT);

// まとめ：バックアップZIPを出力
fs.mkdirSync('reports', { recursive: true });
const manifest = JSON.stringify({ edited, backupsCount: Object.keys(backups).length, at: new Date().toISOString() }, null, 2);
fs.writeFileSync('reports/scrub-manifest.json', manifest);

console.log('Scrub done. Files edited:', edited.length);


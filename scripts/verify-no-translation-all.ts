import fs from 'fs';
import path from 'path';

const ROOT = 'public/locales';
const offenders: string[] = [];

function hasTranslation(obj: any): boolean {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) return obj.some(hasTranslation);
    if ('translation' in obj) return true;
    return Object.values(obj).some(hasTranslation);
  }
  return false;
}

function checkFile(file: string){
  const raw = fs.readFileSync(file, 'utf8');
  let data: any;
  try { data = JSON.parse(raw); } catch { offenders.push(file); return; }
  if (hasTranslation(data)) offenders.push(file);
}

(function walk(dir: string){
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)){
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name.endsWith('.json')) checkFile(p);
  }
})(ROOT);

fs.mkdirSync('reports', { recursive: true });
if (offenders.length) {
  fs.writeFileSync('reports/verify-no-translation-failed.json', JSON.stringify(offenders, null, 2));
  console.error('❌ translation 残存ファイル:', offenders.length);
  process.exit(1);
} else {
  fs.writeFileSync('reports/verify-no-translation-ok.json', JSON.stringify({ ok: true, at: new Date().toISOString() }, null, 2));
  console.log('✅ 全JSONから translation が完全に削除されています');
}


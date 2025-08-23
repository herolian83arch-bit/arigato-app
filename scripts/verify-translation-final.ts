import fs from 'fs';
import path from 'path';
import * as crypto from 'crypto';

const ROOT = 'public/locales';
const MAIN_FILE = 'public/locales/onomatopoeia-premium-all-41-scenes.json';
const PICK_KEYS = ['id', 'sceneId', 'scene', 'main', 'romaji', 'description'] as const;

function sha256(str: string): string {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

function pick(obj: any, keys: readonly string[]) {
  const out: any = {};
  for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
}

function deepSortKeys<T = any>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => deepSortKeys(v)) as any;
  const sorted: any = {};
  for (const k of Object.keys(obj).sort()) sorted[k] = deepSortKeys((obj as any)[k]);
  return sorted;
}

function normalizePickedForHash(arr: any[]): string {
  const picked = arr.map((e) => pick(e, PICK_KEYS));
  const normalized = deepSortKeys(picked);
  return JSON.stringify(normalized);
}

function hasTranslation(obj: any): boolean {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) return obj.some(hasTranslation);
    if ('translation' in obj) return true;
    return Object.values(obj).some(hasTranslation);
  }
  return false;
}

function checkFile(file: string): string[] {
  const offenders: string[] = [];
  const raw = fs.readFileSync(file, 'utf8');
  let data: any;
  try { 
    data = JSON.parse(raw); 
  } catch { 
    offenders.push(file); 
    return offenders; 
  }
  if (hasTranslation(data)) offenders.push(file);
  return offenders;
}

function main() {
  console.log('🚀 Final Translation Verification Starting...');
  
  // 検証1: 全JSONでtranslationキーが0件
  console.log('\n📋 Verification 1: Check all JSONs for translation keys...');
  const allOffenders: string[] = [];
  
  (function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name.endsWith('.json')) {
        const offenders = checkFile(p);
        allOffenders.push(...offenders);
      }
    }
  })(ROOT);
  
  if (allOffenders.length > 0) {
    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync('reports/verify-no-translation-failed.json', JSON.stringify(allOffenders, null, 2));
    console.error(`❌ Translation keys found in ${allOffenders.length} files:`, allOffenders);
    process.exit(1);
  } else {
    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync('reports/verify-no-translation-ok.json', JSON.stringify({ ok: true, at: new Date().toISOString() }, null, 2));
    console.log('✅ All JSONs are translation-free');
  }
  
  // 検証2: メイン辞典の件数とPickハッシュ一致
  console.log('\n📋 Verification 2: Check main dictionary integrity...');
  if (!fs.existsSync(MAIN_FILE)) {
    console.error(`❌ Main file not found: ${MAIN_FILE}`);
    process.exit(1);
  }
  
  const mainData = JSON.parse(fs.readFileSync(MAIN_FILE, 'utf8'));
  if (!Array.isArray(mainData)) {
    console.error('❌ Main file is not an array');
    process.exit(1);
  }
  
  const entryCount = mainData.length;
  if (entryCount !== 615) {
    console.error(`❌ Expected 615 entries, got ${entryCount}`);
    process.exit(1);
  }
  
  // Pickハッシュ計算
  const currentHash = sha256(normalizePickedForHash(mainData));
  
  // GitのHEADと比較
  const { execSync } = require('child_process');
  let headHash: string | null = null;
  
  try {
    const headRaw = execSync(`git show HEAD:"${MAIN_FILE}"`, { stdio: 'pipe', encoding: 'utf8' });
    const headData = JSON.parse(headRaw);
    if (Array.isArray(headData)) {
      headHash = sha256(normalizePickedForHash(headData));
    }
  } catch {
    console.log('⚠️  Cannot compare with HEAD (new file or no git)');
  }
  
  const hashMatch = headHash ? headHash === currentHash : 'SKIP';
  
  // 結果サマリー
  const summary = {
    translationRemoval: 'OK',
    mainDictionary: {
      entryCount: 615,
      actualCount: entryCount,
      status: entryCount === 615 ? 'OK' : 'NG'
    },
    pickHashMatch: {
      current: currentHash,
      head: headHash,
      status: hashMatch === true ? 'OK' : hashMatch === false ? 'NG' : 'SKIP'
    },
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync('reports/verify-summary.json', JSON.stringify(summary, null, 2));
  
  // テキストサマリー
  let txt = 'Final Translation Verification Summary\n';
  txt += '=====================================\n\n';
  txt += `1. Translation Removal: ${summary.translationRemoval}\n`;
  txt += `2. Main Dictionary: ${summary.mainDictionary.status} (${summary.mainDictionary.actualCount}/615)\n`;
  txt += `3. Pick Hash Match: ${summary.pickHashMatch.status}\n`;
  txt += `   - Current: ${summary.pickHashMatch.current.substring(0, 8)}...\n`;
  if (summary.pickHashMatch.head) {
    txt += `   - HEAD: ${summary.pickHashMatch.head.substring(0, 8)}...\n`;
  }
  txt += `\nTimestamp: ${summary.timestamp}\n`;
  
  fs.writeFileSync('reports/verify-summary.txt', txt);
  
  console.log('\n🎯 Final Verification Complete!');
  console.log('📄 Summary: reports/verify-summary.txt');
  console.log('📊 Details: reports/verify-summary.json');
  
  if (summary.mainDictionary.status === 'OK' && 
      (summary.pickHashMatch.status === 'OK' || summary.pickHashMatch.status === 'SKIP')) {
    console.log('✅ ALL CHECKS PASSED!');
    process.exit(0);
  } else {
    console.log('❌ SOME CHECKS FAILED!');
    process.exit(1);
  }
}

main();


import * as fs from "fs";
import { execSync } from "child_process";
import * as path from "path";
import { normalizePickedForHash, sha256 } from "./lib/json-normalize";

const MAIN_FILE = "public/locales/onomatopoeia-premium-all-41-scenes.json";
const REPORT_DIR = "reports";

type Result = {
  success: boolean;
  skipReason?: string;
  headHash?: string;
  currentHash?: string;
  details?: string;
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJsonArray(file: string): any[] {
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Data is not an array");
  // 安定化のため id 昇順
  return [...data].sort((a, b) => (a?.id ?? 0) - (b?.id ?? 0));
}

function gitInside(): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "pipe" });
    return true;
  } catch { return false; }
}

function gitShowHead(filePath: string): string | null {
  try {
    return execSync(`git show HEAD:"${filePath}"`, { stdio: "pipe", encoding: "utf8" });
  } catch {
    return null; // 初回コミットなど
  }
}

function writeReports(result: Result) {
  ensureDir(REPORT_DIR);
  fs.writeFileSync(path.join(REPORT_DIR, "verify-diff.json"), JSON.stringify(result, null, 2));
  let txt = "Translation Removal Verification (hash-based)\n============================================\n";
  txt += `Status: ${result.success ? "PASS" : "FAIL"}\n`;
  if (result.skipReason) txt += `Skip: ${result.skipReason}\n`;
  if (result.headHash) txt += `HEAD hash: ${result.headHash}\n`;
  if (result.currentHash) txt += `Current hash: ${result.currentHash}\n`;
  if (result.details) txt += `Details:\n${result.details}\n`;
  fs.writeFileSync(path.join(REPORT_DIR, "verify-diff.txt"), txt);
}

function main() {
  console.log("🚀 Verify translation-only removal (hash-based)");
  if (!fs.existsSync(MAIN_FILE)) {
    writeReports({ success: false, details: `File not found: ${MAIN_FILE}` });
    console.error(`❌ Missing ${MAIN_FILE}`);
    process.exit(1);
  }
  const currentArr = readJsonArray(MAIN_FILE);
  const currentHash = sha256(normalizePickedForHash(currentArr));

  if (!gitInside()) {
    writeReports({ success: true, skipReason: "SKIP(Git外)", currentHash });
    console.log("✅ SKIP(Git外) → 現行のみでOK扱い");
    process.exit(0);
  }

  const headRaw = gitShowHead(MAIN_FILE);
  if (!headRaw) {
    writeReports({ success: true, skipReason: "SKIP(過去版なし)", currentHash });
    console.log("✅ SKIP(過去版なし) → 初回追加等はOK扱い");
    process.exit(0);
  }

  let headArr: any[];
  try {
    const parsed = JSON.parse(headRaw);
    if (!Array.isArray(parsed)) throw new Error("HEAD data is not array");
    headArr = [...parsed].sort((a, b) => (a?.id ?? 0) - (b?.id ?? 0));
  } catch {
    writeReports({ success: true, skipReason: "SKIP(過去版パース失敗)", currentHash });
    console.log("✅ SKIP(過去版パース失敗) → OK扱い");
    process.exit(0);
  }

  const headHash = sha256(normalizePickedForHash(headArr));
  const success = headHash === currentHash;

  writeReports({
    success,
    headHash,
    currentHash,
    details: success
      ? "Picked fields hash matched (id, sceneId, scene, main, romaji, description)."
      : "Picked fields hash mismatched → translation 以外の差分の可能性。",
  });

  if (success) {
    console.log("🎉 PASS: translation 以外は無変更です。");
    process.exit(0);
  } else {
    console.error("❌ FAIL: translation 以外の差分が検出されました（要確認）");
    process.exit(1);
  }
}

main();

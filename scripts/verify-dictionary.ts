import * as fs from 'fs';
import * as path from 'path';

// 定数定義
const MAIN_FILE = "public/locales/onomatopoeia-premium-all-41-scenes.json";

interface DictionaryEntry {
  id: number;
  sceneId: number;
  scene: string;
  main: string;
  romaji: string;
  description: {
    ja: string;
    en: string;
    zh: string;
    ko: string;
  };
  translation?: any; // 削除されるべきフィールド
}

interface VerificationResult {
  success: boolean;
  totalEntries: number;
  translationKeysFound: number;
  missingRequiredFields: string[];
  emptyFields: string[];
  errors: string[];
  timestamp: string;
}

function findDictionaryFiles(): string[] {
  // メインファイルのみを対象とする
  if (fs.existsSync(MAIN_FILE)) {
    return [MAIN_FILE];
  }
  return [];
}

function verifyDictionaryFile(filePath: string): VerificationResult {
  const result: VerificationResult = {
    success: true,
    totalEntries: 0,
    translationKeysFound: 0,
    missingRequiredFields: [],
    emptyFields: [],
    errors: [],
    timestamp: new Date().toISOString()
  };

  try {
    console.log(`🔍 Verifying: ${filePath}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const data: DictionaryEntry[] = JSON.parse(content);

    if (!Array.isArray(data)) {
      result.errors.push('Data is not an array');
      result.success = false;
      return result;
    }

    result.totalEntries = data.length;
    console.log(`📊 Total entries: ${data.length}`);

    // 615件の存在を検証
    if (data.length !== 615) {
      result.errors.push(`Expected 615 entries, but found ${data.length}`);
      result.success = false;
    }

    const requiredFields = ['id', 'sceneId', 'scene', 'main', 'romaji', 'description'];
    
    data.forEach((entry, index) => {
      // translationキーの存在チェック
      if ('translation' in entry) {
        result.translationKeysFound++;
        result.errors.push(`Entry ${index} (ID: ${entry.id}) still has translation key`);
        result.success = false;
      }

      // 必須フィールドの存在チェック
      requiredFields.forEach(field => {
        if (!(field in entry)) {
          result.missingRequiredFields.push(`Entry ${index} (ID: ${entry.id}) missing ${field}`);
          result.success = false;
        }
      });

      // フィールドの空値チェック
      if (entry.main && entry.main.trim() === '') {
        result.emptyFields.push(`Entry ${index} (ID: ${entry.id}) has empty main field`);
        result.success = false;
      }

      if (entry.romaji && entry.romaji.trim() === '') {
        result.emptyFields.push(`Entry ${index} (ID: ${entry.id}) has empty romaji field`);
        result.success = false;
      }

      if (entry.description?.ja && entry.description.ja.trim() === '') {
        result.emptyFields.push(`Entry ${index} (ID: ${entry.id}) has empty description.ja field`);
        result.success = false;
      }
    });

    // 深さ優先でtranslationキーを探索
    const findTranslationKeys = (obj: any, path: string = ''): string[] => {
      const keys: string[] = [];
      
      if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (key === 'translation') {
            keys.push(currentPath);
          } else if (value && typeof value === 'object') {
            keys.push(...findTranslationKeys(value, currentPath));
          }
        }
      }
      
      return keys;
    };

    const translationPaths = findTranslationKeys(data);
    if (translationPaths.length > 0) {
      result.translationKeysFound = translationPaths.length;
      result.errors.push(`Found translation keys at paths: ${translationPaths.join(', ')}`);
      result.success = false;
    }

    console.log(`✅ Verification completed for ${filePath}`);
    console.log(`   - Total entries: ${result.totalEntries}`);
    console.log(`   - Translation keys found: ${result.translationKeysFound}`);
    console.log(`   - Missing required fields: ${result.missingRequiredFields.length}`);
    console.log(`   - Empty fields: ${result.emptyFields.length}`);
    console.log(`   - Errors: ${result.errors.length}`);

  } catch (error) {
    result.errors.push(`Failed to verify file: ${error}`);
    result.success = false;
  }

  return result;
}

function main() {
  console.log('🚀 Starting dictionary verification...');
  
  try {
    // 辞典ファイルを検索
    const dictionaryFiles = findDictionaryFiles();
    console.log(`📁 Found ${dictionaryFiles.length} potential dictionary files:`, dictionaryFiles);

    if (dictionaryFiles.length === 0) {
      console.error('❌ No dictionary files found');
      process.exit(1);
    }

    // 各ファイルを検証
    const results: { [file: string]: VerificationResult } = {};
    let overallSuccess = true;

    for (const file of dictionaryFiles) {
      const result = verifyDictionaryFile(file);
      results[file] = result;
      
      if (!result.success) {
        overallSuccess = false;
      }
    }

    // 結果を保存
    const reportPath = 'reports/verify-dictionary.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);

    // サマリー出力
    console.log('\n📋 Verification Summary:');
    console.log('='.repeat(50));
    
    Object.entries(results).forEach(([file, result]) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${path.basename(file)}`);
      console.log(`   Entries: ${result.totalEntries}, Translation keys: ${result.translationKeysFound}`);
      
      if (!result.success) {
        console.log(`   Errors: ${result.errors.length}`);
        result.errors.slice(0, 3).forEach(error => {
          console.log(`     - ${error}`);
        });
        if (result.errors.length > 3) {
          console.log(`     ... and ${result.errors.length - 3} more errors`);
        }
      }
    });

    console.log('\n' + '='.repeat(50));
    if (overallSuccess) {
      console.log('🎉 All dictionary files passed verification!');
      process.exit(0);
    } else {
      console.log('❌ Some dictionary files failed verification');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

main();

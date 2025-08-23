export type DictItem = {
  id: number;
  sceneId: number;
  scene: string;
  main: string;
  romaji?: string;
  description?: string | { ja?: string; en?: string; zh?: string; ko?: string };
  // translation は削除済み
};

export function getDescription(desc?: DictItem['description'], locale: 'ja'|'en'|'zh'|'ko'='ja'): string {
  if (!desc) return '';
  if (typeof desc === 'string') return desc;
  const d = desc as any;
  return d[locale] || d.ja || d.en || d.zh || d.ko || '';
}

export function normalizeForView(item: DictItem, locale: 'ja'|'en'|'zh'|'ko'='ja') {
  return {
    title: item.main?.trim() || '',
    romaji: item.romaji?.trim() || '',
    description: getDescription(item.description, locale).trim(),
  };
}


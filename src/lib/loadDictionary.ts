export async function loadDictionary(): Promise<any[]> {
  // public 配下の最有力パスから順に読み込み
  const paths = [
    '/locales/onomatopoeia-premium-all-41-scenes.json',
    '/locales/onomatopoeia-all-scenes.json'
  ];
  for (const p of paths) {
    try {
      const res = await fetch(p, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();

        return data;
      }
    } catch {}
  }

  return [];
}

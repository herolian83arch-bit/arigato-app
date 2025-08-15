/* public/toText-polyfill.js (v2)
   - 既存テキストは一切変更しない。verify の [object Object] を根本解消。
   - オブジェクト/配列を再帰的にたどって、最初に見つかった有効なプリミティブを文字列化。
   - 優先キー: asText,text,label,name,value,title,no,number,num,index,id,n,i
*/
(() => {
  if (typeof window.__TO_TEXT_VERSION__ === "number" && window.__TO_TEXT_VERSION__ >= 2) return;

  const PRIORITY_KEYS = ["asText","text","label","name","value","title","no","number","num","index","id","n","i"];

  function deepToText(v) {
    if (v == null) return "";
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean") return String(v);

    if (Array.isArray(v)) {
      // 配列は要素をそれぞれ deepToText して結合（空は落とす）
      return v.map(deepToText).filter(Boolean).join(" ");
    }

    if (t === "object") {
      // まず優先キーから探す
      for (const k of PRIORITY_KEYS) {
        if (k in v) {
          const picked = deepToText(v[k]);
          if (picked) return picked;
        }
      }
      // それでも無ければ、最初に出会ったプロパティを再帰的に
      for (const k of Object.keys(v)) {
        const picked = deepToText(v[k]);
        if (picked) return picked;
      }
      try { return JSON.stringify(v); } catch { return ""; }
    }

    try { return String(v); } catch { return ""; }
  }

  if (typeof window.toText !== "function") {
    window.toText = deepToText;
  } else {
    // 既存があっても上書き（verify用の安全化）
    window.toText = deepToText;
  }

  if (typeof window.asText !== "function") {
    window.asText = function asText(el, val) {
      const s = deepToText(val);
      if (el) el.textContent = s;
      return s;
    };
  }

  window.__TO_TEXT_VERSION__ = 2;
})();

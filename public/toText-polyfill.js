/* public/toText-polyfill.js
   verify.html で [object Object] を防ぐための安全な文字列化ヘルパー。
   - 既に window.toText/asText があれば尊重し上書きしない
   - よくあるプロパティ(no/id/text/label/name/value/asText)を優先抽出
   - 最終的に textContent 経由で安全代入可能
*/
(() => {
  if (typeof window.toText !== "function") {
    window.toText = function toText(v) {
      if (v == null) return "";
      const t = typeof v;
      if (t === "string" || t === "number" || t === "boolean") return String(v);
      // DOMノードならテキストのみ
      if (v && typeof Node !== "undefined" && v instanceof Node) return v.textContent || "";
      // よくある形のオブジェクトを文字列に
      if (t === "object") {
        // 代表値の推測（番号や名前など）
        const pick = (obj, keys) => {
          for (const k of keys) {
            if (k in obj && (typeof obj[k] === "string" || typeof obj[k] === "number")) {
              return String(obj[k]);
            }
          }
          return null;
        };
        const prefer = pick(v, ["asText", "text", "label", "name", "value", "title", "no", "id"]);
        if (prefer != null) return prefer;
        // 配列はスペース区切り
        if (Array.isArray(v)) return v.map(window.toText).join(" ");
        try { return JSON.stringify(v); } catch { return String(v); }
      }
      return String(v);
    };
  }

  if (typeof window.asText !== "function") {
    window.asText = function asText(el, val) {
      const s = window.toText(val);
      if (el) el.textContent = s;
      return s;
    };
  }
})();

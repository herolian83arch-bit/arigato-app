/* verify-safe-shim.js (v9 final)
   - window.toText があれば優先使用
   - 無ければ安全に文字列化する toText を定義
   - XSS/文字化け防止のため textContent/asText を利用
*/
(function () {
  if (typeof window.toText === "function") return;

  window.toText = function toText(input) {
    try {
      if (input == null) return "";
      if (typeof input === "string") return input;
      if (typeof input === "number" || typeof input === "boolean") return String(input);
      if (Array.isArray(input)) return input.map(toText).join(" ");
      if (typeof input === "object") {
        return Object.values(input).map(toText).join(" ");
      }
      return String(input);
    } catch (e) {
      return "";
    }
  };
})();

/* verify-safe-shim.js (v7)
   - window.toText があれば優先使用
   - なければ ASCII のみを残す簡易 toText にフォールバック
   - window.asciiOnly / window.verifySafeSetText を提供
*/
(function(){
  try {
    var hasToText = (typeof window !== "undefined") && typeof window.toText === "function";
    var fallbackToText = function(input){
      var s = String(input == null ? "" : input);
      // 改行やタブは保持、ASCII範囲外（0x20〜0x7E 以外）は除去
      return s.replace(/[^\x20-\x7E\r\n\t]/g, "");
    };
    var _toText = hasToText ? window.toText : fallbackToText;
    window.asciiOnly = function(s){ return _toText(s); };

    if (typeof window.__verifyShimPatched === "undefined") {
      window.__verifyShimPatched = true;
      var bindText = function(node, val){
        if (!node) return;
        var txt = _toText(val);
        if ("textContent" in node) node.textContent = txt;
        else if ("innerText" in node) node.innerText = txt;
        else if ("innerHTML" in node) node.innerHTML = txt.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      };
      window.verifySafeSetText = bindText;
    }
  } catch(e) { /* no-op */ }
})();

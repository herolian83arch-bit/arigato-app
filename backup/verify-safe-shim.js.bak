// verify.html用の安全描画シム
window.toText = function(val) {
  if (val == null) return '';
  if (typeof val === 'object') return '';
  return String(val);
};
window.safeText = function(node, val) {
  node.textContent = window.toText(val);
};
window.emphasizeOnomatopoeia = function(text) {
  const parts = window.toText(text).split(/(《[^》]+》)/);
  const fragment = document.createDocumentFragment();
  for (const part of parts) {
    if (/^《[^》]+》$/.test(part)) {
      const strong = document.createElement('strong');
      strong.textContent = part;
      fragment.appendChild(strong);
    } else {
      fragment.appendChild(document.createTextNode(part));
    }
  }
  return fragment;
};

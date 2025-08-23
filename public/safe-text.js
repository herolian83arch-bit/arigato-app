// 安全な文字列化（null, object, undefinedを空文字に）
export function toText(val) {
  if (val == null) return '';
  if (typeof val === 'object') return '';
  return String(val);
}

// ノードに安全にテキストを挿入	export function safeText(node, val) {
  node.textContent = toText(val);
}

// 《…》囲みの部分だけ太字ノード化（XSS安全）
export function emphasizeOnomatopoeia(text) {
  const parts = toText(text).split(/(《[^》]+》)/);
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
}

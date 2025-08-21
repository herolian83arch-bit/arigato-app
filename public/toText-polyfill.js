// toText polyfill: null, object, undefinedを空文字に
window.toText = function(val) {
  if (val == null) return '';
  if (typeof val === 'object') return '';
  return String(val);
};

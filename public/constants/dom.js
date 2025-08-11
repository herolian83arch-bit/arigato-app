// DOM操作の共通定数
// カード内コントロール要素の識別に使用

export const CONTROL_SELECTOR = '[data-card-control="true"]';

// コントロール要素かどうかを判定する関数
export function isFromControl(event) {
  const target = event.target || event.currentTarget;
  if (!target || !target.closest) return false;
  
  return !!target.closest(CONTROL_SELECTOR);
}

// コントロール要素のクリックイベントを安全に処理する関数
export function handleControlClick(event, callback) {
  if (isFromControl(event)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    if (typeof callback === 'function') {
      callback(event);
    }
    return true; // コントロール要素からのクリック
  }
  return false; // 通常のクリック
}

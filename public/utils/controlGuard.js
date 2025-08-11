// グローバルコントロールガード
// キャプチャ段階でコントロール要素からのイベントを一括無視

import { CONTROL_SELECTOR, isFromControl } from '../constants/dom.js';

// コントロール要素からのイベントかどうかを判定
export function isFromControlGlobal(ev) {
  const t = ev.target || ev.currentTarget;
  if (!t || !t.closest) return false;
  
  return !!t.closest(CONTROL_SELECTOR);
}

// グローバルコントロールガードをアタッチ
export function attachGlobalControlGuards() {
  const guard = (ev) => {
    if (isFromControlGlobal(ev)) {
      // キャプチャ段階で止める：下層/上層どちらのハンドラも発火させない
      if (ev.preventDefault) ev.preventDefault();
      if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      if (ev.stopPropagation) ev.stopPropagation();
      
      // デバッグ用（必要に応じて削除）
      console.log('Global guard: blocked event from control element', ev.type, ev.target);
    }
  };

  // キャプチャ = 第3引数 true
  document.addEventListener('pointerdown', guard, true);
  document.addEventListener('click', guard, true);
  document.addEventListener('mousedown', guard, true); // 一部UIライブラリ対策
  document.addEventListener('touchstart', guard, true); // モバイル対応
  
  console.log('Global control guards attached');
}

// グローバルコントロールガードをデタッチ
export function detachGlobalControlGuards() {
  // 必要なら removeEventListener を実装
  console.log('Global control guards detached');
}

// 既存のイベントハンドラーにガードを挿入するヘルパー
export function guardEvent(ev, callback) {
  if (isFromControlGlobal(ev)) {
    ev.preventDefault();
    ev.stopPropagation();
    return true; // コントロール要素からのイベント
  }
  
  if (typeof callback === 'function') {
    callback(ev);
  }
  return false; // 通常のイベント
}

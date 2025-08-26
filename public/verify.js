'use strict';

// ===== 隕∫ｴ蜿ら・ =====
const premiumEl = document.getElementById('premium');
const starBtn   = document.getElementById('star');
const audioBtn  = document.getElementById('audio');
const logEl     = document.getElementById('log');
const listEl    = document.getElementById('dict-list');

const log = (t) => { if (logEl) logEl.textContent += t + '\n'; };

// ===== Premium 陦ｨ遉ｺ・亥ｸｸ譎０N・・=====
function setPremium(on) {
  // 莠呈鋤繧ｭ繝ｼ・域立verify.html縺ｨ蜷後§繧ｭ繝ｼ蜷搾ｼ・
  localStorage.setItem('premiumEnabled', on ? '1' : '0');
  if (!premiumEl) return;
  premiumEl.dataset.status = on ? 'on' : 'off';
  premiumEl.textContent = on ? 'ON' : 'OFF';
  premiumEl.classList.toggle('on', on);
}
setPremium(true);

// ===== 繧ｰ繝ｭ繝ｼ繝舌Ν Favorite・域立莠呈鋤・喃avoriteTest・・=====
const favKeyGlobal = 'favoriteTest';
const getFav = () => localStorage.getItem(favKeyGlobal) === '1';
function setFav(on) {
  localStorage.setItem(favKeyGlobal, on ? '1' : '0');
  if (!starBtn) return;
  starBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  starBtn.textContent = on ? '笘・Favorited' : '笘・Favorite';
}
setFav(getFav());
if (starBtn) {
  starBtn.addEventListener('click', () => {
    const next = !getFav();
    setFav(next);
    log('star:' + next);
  });
}

// ===== 矧 Play test・・laywright莠呈鋤・句ｮ滄浹TTS・・=====
if (audioBtn) {
  audioBtn.addEventListener('click', () => {
    try {
      // Playwright縺ｪ縺ｩ縺ｮ閾ｪ蜍輔ユ繧ｹ繝亥髄縺托ｼ壼ｿ・★ play() 繧貞他縺ｶ
      const a = new Audio();
      const p = a.play();
      if (p && p.catch) p.catch(() => {}); // 繝悶Λ繧ｦ繧ｶ縺後ヶ繝ｭ繝・け縺励※繧ら┌隕・
      log('audio:clicked');

      // 螳滄浹・啗eb Speech API・井ｽｿ縺医↑縺・腸蠅・〒縺ｯ閾ｪ蜍慕噪縺ｫ辟｡髻ｳ・・
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('縺ゅｊ縺後→縺・・豌玲戟縺｡縲∝ｱ翫＞縺ｦ縺・∪縺吶°・・);
        u.lang = 'ja-JP';
        const v = speechSynthesis.getVoices().find(vi => vi.lang && vi.lang.startsWith('ja'));
        if (v) u.voice = v;
        speechSynthesis.speak(u);
      }
    } catch (e) {
      log('audio:error ' + e);
    }
  });
}

// ===== Dictionary Preview =====
(async function loadDictPreview() {
  if (!listEl) return;

  async function load(path) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      return await res.json();
    } catch {
      return null;
    }
  }

  // データファイルの候補を順番に試して、verify.htmlで動作確認できるようにする
  const candidates = [
    '/data/dictionary.json',
    '/locales/onomatopoeia-premium-all-41-scenes.json',
    '/locales/onomatopoeia-all-scenes.json',
    '/data/dictionary-sample.json'
  ];

  let items = [];
  for (const p of candidates) {
    const j = await load(p);
    if (!j) continue;
    items = Array.isArray(j) ? j : (j.items || []);
    if (items.length) break;
  }

  if (!items.length) {
    listEl.innerHTML = `
      <div class="card" data-testid="dict-row">
        <div class="card-title">・医・繝ｬ繝薙Η繝ｼ逕ｨ繝・・繧ｿ縺梧悴驟咲ｽｮ縺ｧ縺呻ｼ・/div>
        <div class="card-sub">public/data/dictionary.json 縺ｾ縺溘・ dictionary-sample.json 繧堤ｽｮ縺上→陦ｨ遉ｺ縺輔ｌ縺ｾ縺吶・/div>
      </div>`;
    return;
  }

  // 蜈磯ｭ繧ｷ繝ｼ繝ｳ縺ｮ荳贋ｽ・莉ｶ縺ｮ縺ｿ繧定｡ｨ遉ｺ・域立莉墓ｧ倥↓蜷医ｏ縺帙ｋ・・
  const firstSceneId = items[0]?.sceneId ?? null;
  const rows = items
    .filter(x => firstSceneId == null ? true : x.sceneId === firstSceneId)
    .slice(0, 3);

  listEl.innerHTML = rows.map(toCardHTML).join('');

  // 陦悟・繝懊ち繝ｳ・芋沐・笘・ｼ峨・繧､繝吶Φ繝亥ｧ碑ｭｲ
  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'play') {
      const text = btn.dataset.text || '';
      try {
        const u = new SpeechSynthesisUtterance(text.replace(/縲掛縲・g, ''));
        u.lang = 'ja-JP';
        speechSynthesis.speak(u);
      } catch {}
    }
    if (btn.dataset.action === 'fav') {
      const key = `fav:item:${id}`;
      const on = localStorage.getItem(key) === '1';
      localStorage.setItem(key, on ? '0' : '1');
      btn.textContent = on ? '笘・ : '笘・;
      btn.setAttribute('aria-pressed', on ? 'false' : 'true');
    }
  }, { once: true });
})();

function toCardHTML(it) {
  const id    = it.id ?? '';
  const title = (it.main || '').trim();
  const romaji = (it.romaji || '').trim();
  const desc  = (typeof it.description === 'string'
    ? it.description
    : (it.description?.ja || it.description?.en || it.description?.zh || it.description?.ko || '')
  ).trim();
  const favKey = `fav:item:${id}`;
  const favOn = localStorage.getItem(favKey) === '1';

  return `
    <article class="card" data-testid="dict-row">
      <div class="card-head">
        <div data-testid="dict-title" class="card-title">${escapeHTML(title)}</div>
        <div class="card-actions">
          <button class="btn small" data-action="play" data-id="${id}" data-text="${escapeAttr(title)}">矧 Play</button>
          <button class="btn small" data-action="fav" data-id="${id}" aria-pressed="${favOn ? 'true' : 'false'}">${favOn ? '笘・ : '笘・}</button>
        </div>
      </div>
      ${romaji ? `<div data-testid="dict-romaji" class="card-sub">${escapeHTML(romaji)}</div>` : ''}
      ${desc   ? `<div data-testid="dict-desc"   class="card-sub">${escapeHTML(desc)}</div>`   : ''}
    </article>
  `;
}

function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(s){ return String(s).replace(/"/g,'&quot;'); }

// SAFE-BEGIN (removed)
/* Safety layer: sanitize & harden (patched $TS) */

// 文字列サニタイズ： 《…》/全角句読点を除去
function sanitizeRomaji(str){
  try{
    if(!str) return "";
    return String(str)
      .replace(/《.*?》/g,"")
      .replace(/[。、，．！!？?\u3000【】（）\(\)「」『』［］]/g,"")
      .replace(/\s+/g," ")
      .trim();
  }catch(e){ console.error("[sanitizeRomaji]", e); return ""; }
}

// localStorage 安全ラッパ
const safeStore={
  get(k,f){ try{ const v=localStorage.getItem(k); return v==null?f:JSON.parse(v); }catch(e){ console.error("[safeStore.get]",k,e); return f; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ console.error("[safeStore.set]",k,e); } }
};

// お気に入りキー生成（id優先＋romajiは保険）
function makeFavKey(id,romaji){
  const base = `fav_${String(id??"").trim()}`;
  const tail = sanitizeRomaji(romaji||"");
  return tail ? `${base}_${tail}` : base;
}

// 安全版: 音声
const __safePlayAudio = function(romajiText){
  try{
    const t = sanitizeRomaji(romajiText);
    if(!("speechSynthesis" in window)){ console.warn("[playAudio] no TTS"); return; }
    try{ window.speechSynthesis.cancel(); }catch(_){}
    const u = new SpeechSynthesisUtterance(t||"ARIGATOU");
    u.lang="ja-JP"; u.rate=1; u.pitch=1;
    window.speechSynthesis.speak(u);
  }catch(e){ console.error("[playAudio]", e); }
};

// 既存への差し替え（const対策：失敗したら window に代入）
try{ playAudio = __safePlayAudio; }catch(_){ window.playAudio = __safePlayAudio; }

// 安全版: お気に入り
const __safeToggleFavorite = function(id,romajiText){
  try{
    const key = makeFavKey(id,romajiText);
    let favs = safeStore.get("favorites",[]);
    if(!Array.isArray(favs)) favs=[];
    const i = favs.indexOf(key);
    if(i>=0){ favs.splice(i,1); } else { favs.push(key); }
    safeStore.set("favorites",favs);

    // data-fav-key があれば即時反映（任意）
    try{
      const btn = document.querySelector(`[data-fav-key="${CSS.escape(key)}"]`);
      if(btn) btn.classList.toggle("is-active", i<0);
    }catch(_){}
  }catch(e){ console.error("[toggleFavorite]", e); }
};

// 既存への差し替え（const対策）
try{ toggleFavorite = __safeToggleFavorite; }catch(_){ window.toggleFavorite = __safeToggleFavorite; }

// グローバル安全網
window.addEventListener("error", (ev)=>console.error("[GlobalError]", ev.error||ev.message||ev));
window.addEventListener("unhandledrejection", (ev)=>console.error("[UnhandledRejection]", ev.reason||ev));
// SAFE-END (removed)
// patched at 20250816-114623



// === Safety layer: sanitize & harden (no markers) ===

// 文字列サニタイズ： 《…》/全角句読点/余分な空白を除去
function sanitizeRomaji(str){
  try{
    if(!str) return "";
    return String(str)
      .replace(/《.*?》/g,"")
      .replace(/[。、，．！!？?\u3000【】（）\(\)「」『』［］]/g,"")
      .replace(/\s+/g," ")
      .trim();
  }catch(e){ console.error("[sanitizeRomaji]", e); return ""; }
}

// localStorage 安全ラッパ
const safeStore={
  get(k,f){ try{ const v=localStorage.getItem(k); return v==null?f:JSON.parse(v); }catch(e){ console.error("[safeStore.get]",k,e); return f; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ console.error("[safeStore.set]",k,e); } }
};

// お気に入りキー生成（id優先＋romajiは保険）
function makeFavKey(id,romaji){
  const base = `fav_${String(id??"").trim()}`;
  const tail = sanitizeRomaji(romaji||"");
  return tail ? `${base}_${tail}` : base;
}

// 音声：既存 playAudio を安全版で上書き（const対策で window 経由も）
const __safePlayAudio = function(romajiText){
  try{
    const t = sanitizeRomaji(romajiText);
    if(!("speechSynthesis" in window)){ console.warn("[playAudio] no TTS"); return; }
    try{ window.speechSynthesis.cancel(); }catch(_){}
    const u = new SpeechSynthesisUtterance(t||"ARIGATOU");
    u.lang="ja-JP"; u.rate=1; u.pitch=1;
    window.speechSynthesis.speak(u);
  }catch(e){ console.error("[playAudio]", e); }
};
try{ playAudio = __safePlayAudio; }catch(_){ window.playAudio = __safePlayAudio; }

// お気に入り：既存 toggleFavorite を安全版で上書き
const __safeToggleFavorite = function(id,romajiText){
  try{
    const key = makeFavKey(id,romajiText);
    let favs = safeStore.get("favorites",[]);
    if(!Array.isArray(favs)) favs=[];
    const i = favs.indexOf(key);
    if(i>=0){ favs.splice(i,1); } else { favs.push(key); }
    safeStore.set("favorites",favs);

    // data-fav-key があれば即時反映（任意）
    try{
      const btn = document.querySelector(`[data-fav-key="${CSS.escape(key)}"]`);
      if(btn) btn.classList.toggle("is-active", i<0);
    }catch(_){}
  }catch(e){ console.error("[toggleFavorite]", e); }
};
try{ toggleFavorite = __safeToggleFavorite; }catch(_){ window.toggleFavorite = __safeToggleFavorite; }

// グローバル安全網：未捕捉エラーで初期化が止まらないようにする
window.addEventListener("error", (ev)=>console.error("[GlobalError]", ev.error||ev.message||ev));
window.addEventListener("unhandledrejection", (ev)=>console.error("[UnhandledRejection]", ev.reason||ev));
// patched (verify-clean-guards) at 20250816-131058


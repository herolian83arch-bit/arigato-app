'use strict';

// ===== è¦ç´ å‚ç…§ =====
const premiumEl = document.getElementById('premium');
const starBtn   = document.getElementById('star');
const audioBtn  = document.getElementById('audio');
const logEl     = document.getElementById('log');
const listEl    = document.getElementById('dict-list');

const log = (t) => { if (logEl) logEl.textContent += t + '\n'; };

// ===== Premium è¡¨ç¤ºï¼ˆå¸¸æ™‚ONï¼‰ =====
function setPremium(on) {
  // äº’æ›ã‚­ãƒ¼ï¼ˆæ—§verify.htmlã¨åŒã˜ã‚­ãƒ¼åï¼‰
  localStorage.setItem('premiumEnabled', on ? '1' : '0');
  if (!premiumEl) return;
  premiumEl.dataset.status = on ? 'on' : 'off';
  premiumEl.textContent = on ? 'ON' : 'OFF';
  premiumEl.classList.toggle('on', on);
}
setPremium(true);

// ===== ã‚°ãƒ­ãƒ¼ãƒãƒ« Favoriteï¼ˆæ—§äº’æ›ï¼šfavoriteTestï¼‰ =====
const favKeyGlobal = 'favoriteTest';
const getFav = () => localStorage.getItem(favKeyGlobal) === '1';
function setFav(on) {
  localStorage.setItem(favKeyGlobal, on ? '1' : '0');
  if (!starBtn) return;
  starBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  starBtn.textContent = on ? 'â˜… Favorited' : 'â˜† Favorite';
}
setFav(getFav());
if (starBtn) {
  starBtn.addEventListener('click', () => {
    const next = !getFav();
    setFav(next);
    log('star:' + next);
  });
}

// ===== ğŸ”Š Play testï¼ˆPlaywrightäº’æ›ï¼‹å®ŸéŸ³TTSï¼‰ =====
if (audioBtn) {
  audioBtn.addEventListener('click', () => {
    try {
      // Playwrightãªã©ã®è‡ªå‹•ãƒ†ã‚¹ãƒˆå‘ã‘ï¼šå¿…ãš play() ã‚’å‘¼ã¶
      const a = new Audio();
      const p = a.play();
      if (p && p.catch) p.catch(() => {}); // ãƒ–ãƒ©ã‚¦ã‚¶ãŒãƒ–ãƒ­ãƒƒã‚¯ã—ã¦ã‚‚ç„¡è¦–
      log('audio:clicked');

      // å®ŸéŸ³ï¼šWeb Speech APIï¼ˆä½¿ãˆãªã„ç’°å¢ƒã§ã¯è‡ªå‹•çš„ã«ç„¡éŸ³ï¼‰
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('ã‚ã‚ŠãŒã¨ã†ã®æ°—æŒã¡ã€å±Šã„ã¦ã„ã¾ã™ã‹ï¼Ÿ');
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

  // æ—§â†’æ–°ã®é †ã§ãƒ•ã‚©ãƒ¼ãƒ«ãƒãƒƒã‚¯ï¼ˆæ—§verify.htmläº’æ›ãƒ‘ã‚¹ã‚’å„ªå…ˆï¼‰
  const candidates = [
    '/locales/onomatopoeia-premium-all-41-scenes.json',
    '/locales/onomatopoeia-all-scenes.json',
    '/data/dictionary.json',
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
        <div class="card-title">ï¼ˆãƒ—ãƒ¬ãƒ“ãƒ¥ãƒ¼ç”¨ãƒ‡ãƒ¼ã‚¿ãŒæœªé…ç½®ã§ã™ï¼‰</div>
        <div class="card-sub">public/data/dictionary.json ã¾ãŸã¯ dictionary-sample.json ã‚’ç½®ãã¨è¡¨ç¤ºã•ã‚Œã¾ã™ã€‚</div>
      </div>`;
    return;
  }

  // å…ˆé ­ã‚·ãƒ¼ãƒ³ã®ä¸Šä½3ä»¶ã®ã¿ã‚’è¡¨ç¤ºï¼ˆæ—§ä»•æ§˜ã«åˆã‚ã›ã‚‹ï¼‰
  const firstSceneId = items[0]?.sceneId ?? null;
  const rows = items
    .filter(x => firstSceneId == null ? true : x.sceneId === firstSceneId)
    .slice(0, 3);

  listEl.innerHTML = rows.map(toCardHTML).join('');

  // è¡Œå†…ãƒœã‚¿ãƒ³ï¼ˆğŸ”Š/â˜†ï¼‰ã®ã‚¤ãƒ™ãƒ³ãƒˆå§”è­²
  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'play') {
      const text = btn.dataset.text || '';
      try {
        const u = new SpeechSynthesisUtterance(text.replace(/ã€Š|ã€‹/g, ''));
        u.lang = 'ja-JP';
        speechSynthesis.speak(u);
      } catch {}
    }
    if (btn.dataset.action === 'fav') {
      const key = `fav:item:${id}`;
      const on = localStorage.getItem(key) === '1';
      localStorage.setItem(key, on ? '0' : '1');
      btn.textContent = on ? 'â˜†' : 'â˜…';
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
          <button class="btn small" data-action="play" data-id="${id}" data-text="${escapeAttr(title)}">ğŸ”Š Play</button>
          <button class="btn small" data-action="fav" data-id="${id}" aria-pressed="${favOn ? 'true' : 'false'}">${favOn ? 'â˜…' : 'â˜†'}</button>
        </div>
      </div>
      ${romaji ? `<div data-testid="dict-romaji" class="card-sub">${escapeHTML(romaji)}</div>` : ''}
      ${desc   ? `<div data-testid="dict-desc"   class="card-sub">${escapeHTML(desc)}</div>`   : ''}
    </article>
  `;
}

function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(s){ return String(s).replace(/"/g,'&quot;'); }

$BEGIN
/* Safety layer: sanitize & harden (patched $TS) */

// •¶š—ñƒTƒjƒ^ƒCƒYF sct/‘SŠp‹å“Ç“_‚ğœ‹
function sanitizeRomaji(str){
  try{
    if(!str) return "";
    return String(str)
      .replace(/s.*?t/g,"")
      .replace(/[BACDI!H?\u3000yzij\(\)uvwxmn]/g,"")
      .replace(/\s+/g," ")
      .trim();
  }catch(e){ console.error("[sanitizeRomaji]", e); return ""; }
}

// localStorage ˆÀ‘Sƒ‰ƒbƒp
const safeStore={
  get(k,f){ try{ const v=localStorage.getItem(k); return v==null?f:JSON.parse(v); }catch(e){ console.error("[safeStore.get]",k,e); return f; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ console.error("[safeStore.set]",k,e); } }
};

// ‚¨‹C‚É“ü‚èƒL[¶¬iid—Dæ{romaji‚Í•ÛŒ¯j
function makeFavKey(id,romaji){
  const base = `fav_${String(id??"").trim()}`;
  const tail = sanitizeRomaji(romaji||"");
  return tail ? `${base}_${tail}` : base;
}

// ˆÀ‘S”Å: ‰¹º
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

// Šù‘¶‚Ö‚Ì·‚µ‘Ö‚¦iconst‘ÎôF¸”s‚µ‚½‚ç window ‚É‘ã“üj
try{ playAudio = __safePlayAudio; }catch(_){ window.playAudio = __safePlayAudio; }

// ˆÀ‘S”Å: ‚¨‹C‚É“ü‚è
const __safeToggleFavorite = function(id,romajiText){
  try{
    const key = makeFavKey(id,romajiText);
    let favs = safeStore.get("favorites",[]);
    if(!Array.isArray(favs)) favs=[];
    const i = favs.indexOf(key);
    if(i>=0){ favs.splice(i,1); } else { favs.push(key); }
    safeStore.set("favorites",favs);

    // data-fav-key ‚ª‚ ‚ê‚Î‘¦”½‰fi”CˆÓj
    try{
      const btn = document.querySelector(`[data-fav-key="${CSS.escape(key)}"]`);
      if(btn) btn.classList.toggle("is-active", i<0);
    }catch(_){}
  }catch(e){ console.error("[toggleFavorite]", e); }
};

// Šù‘¶‚Ö‚Ì·‚µ‘Ö‚¦iconst‘Îôj
try{ toggleFavorite = __safeToggleFavorite; }catch(_){ window.toggleFavorite = __safeToggleFavorite; }

// ƒOƒ[ƒoƒ‹ˆÀ‘S–Ô
window.addEventListener("error", (ev)=>console.error("[GlobalError]", ev.error||ev.message||ev));
window.addEventListener("unhandledrejection", (ev)=>console.error("[UnhandledRejection]", ev.reason||ev));
$END
// patched at 20250816-114623


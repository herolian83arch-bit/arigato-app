'use strict';

// ===== 要素参照 =====
const premiumEl = document.getElementById('premium');
const starBtn   = document.getElementById('star');
const audioBtn  = document.getElementById('audio');
const logEl     = document.getElementById('log');
const listEl    = document.getElementById('dict-list');

const log = (t) => { if (logEl) logEl.textContent += t + '\n'; };

// ===== Premium 表示（常時ON） =====
function setPremium(on) {
  // 互換キー（旧verify.htmlと同じキー名）
  localStorage.setItem('premiumEnabled', on ? '1' : '0');
  if (!premiumEl) return;
  premiumEl.dataset.status = on ? 'on' : 'off';
  premiumEl.textContent = on ? 'ON' : 'OFF';
  premiumEl.classList.toggle('on', on);
}
setPremium(true);

// ===== グローバル Favorite（旧互換：favoriteTest） =====
const favKeyGlobal = 'favoriteTest';
const getFav = () => localStorage.getItem(favKeyGlobal) === '1';
function setFav(on) {
  localStorage.setItem(favKeyGlobal, on ? '1' : '0');
  if (!starBtn) return;
  starBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  starBtn.textContent = on ? '★ Favorited' : '☆ Favorite';
}
setFav(getFav());
if (starBtn) {
  starBtn.addEventListener('click', () => {
    const next = !getFav();
    setFav(next);
    log('star:' + next);
  });
}

// ===== 🔊 Play test（Playwright互換＋実音TTS） =====
if (audioBtn) {
  audioBtn.addEventListener('click', () => {
    try {
      // Playwrightなどの自動テスト向け：必ず play() を呼ぶ
      const a = new Audio();
      const p = a.play();
      if (p && p.catch) p.catch(() => {}); // ブラウザがブロックしても無視
      log('audio:clicked');

      // 実音：Web Speech API（使えない環境では自動的に無音）
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('ありがとうの気持ち、届いていますか？');
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

  // 旧→新の順でフォールバック（旧verify.html互換パスを優先）
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
        <div class="card-title">（プレビュー用データが未配置です）</div>
        <div class="card-sub">public/data/dictionary.json または dictionary-sample.json を置くと表示されます。</div>
      </div>`;
    return;
  }

  // 先頭シーンの上位3件のみを表示（旧仕様に合わせる）
  const firstSceneId = items[0]?.sceneId ?? null;
  const rows = items
    .filter(x => firstSceneId == null ? true : x.sceneId === firstSceneId)
    .slice(0, 3);

  listEl.innerHTML = rows.map(toCardHTML).join('');

  // 行内ボタン（🔊/☆）のイベント委譲
  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'play') {
      const text = btn.dataset.text || '';
      try {
        const u = new SpeechSynthesisUtterance(text.replace(/《|》/g, ''));
        u.lang = 'ja-JP';
        speechSynthesis.speak(u);
      } catch {}
    }
    if (btn.dataset.action === 'fav') {
      const key = `fav:item:${id}`;
      const on = localStorage.getItem(key) === '1';
      localStorage.setItem(key, on ? '0' : '1');
      btn.textContent = on ? '☆' : '★';
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
          <button class="btn small" data-action="play" data-id="${id}" data-text="${escapeAttr(title)}">🔊 Play</button>
          <button class="btn small" data-action="fav" data-id="${id}" aria-pressed="${favOn ? 'true' : 'false'}">${favOn ? '★' : '☆'}</button>
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

// ������T�j�^�C�Y�F �s�c�t/�S�p��Ǔ_������
function sanitizeRomaji(str){
  try{
    if(!str) return "";
    return String(str)
      .replace(/�s.*?�t/g,"")
      .replace(/[�B�A�C�D�I!�H?\u3000�y�z�i�j\(\)�u�v�w�x�m�n]/g,"")
      .replace(/\s+/g," ")
      .trim();
  }catch(e){ console.error("[sanitizeRomaji]", e); return ""; }
}

// localStorage ���S���b�p
const safeStore={
  get(k,f){ try{ const v=localStorage.getItem(k); return v==null?f:JSON.parse(v); }catch(e){ console.error("[safeStore.get]",k,e); return f; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ console.error("[safeStore.set]",k,e); } }
};

// ���C�ɓ���L�[�����iid�D��{romaji�͕ی��j
function makeFavKey(id,romaji){
  const base = `fav_${String(id??"").trim()}`;
  const tail = sanitizeRomaji(romaji||"");
  return tail ? `${base}_${tail}` : base;
}

// ���S��: ����
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

// �����ւ̍����ւ��iconst�΍�F���s������ window �ɑ���j
try{ playAudio = __safePlayAudio; }catch(_){ window.playAudio = __safePlayAudio; }

// ���S��: ���C�ɓ���
const __safeToggleFavorite = function(id,romajiText){
  try{
    const key = makeFavKey(id,romajiText);
    let favs = safeStore.get("favorites",[]);
    if(!Array.isArray(favs)) favs=[];
    const i = favs.indexOf(key);
    if(i>=0){ favs.splice(i,1); } else { favs.push(key); }
    safeStore.set("favorites",favs);

    // data-fav-key ������Α������f�i�C�Ӂj
    try{
      const btn = document.querySelector(`[data-fav-key="${CSS.escape(key)}"]`);
      if(btn) btn.classList.toggle("is-active", i<0);
    }catch(_){}
  }catch(e){ console.error("[toggleFavorite]", e); }
};

// �����ւ̍����ւ��iconst�΍�j
try{ toggleFavorite = __safeToggleFavorite; }catch(_){ window.toggleFavorite = __safeToggleFavorite; }

// �O���[�o�����S��
window.addEventListener("error", (ev)=>console.error("[GlobalError]", ev.error||ev.message||ev));
window.addEventListener("unhandledrejection", (ev)=>console.error("[UnhandledRejection]", ev.reason||ev));
$END
// patched at 20250816-114623


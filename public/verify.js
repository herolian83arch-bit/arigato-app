const toT=(v,fb='')=>{try{if(v==null)return fb;const t=typeof v;if(t==='string'||t==='number'||t==='boolean')return String(v);if(Array.isArray(v))return v.map(x=>toT(x,'')).join('');for(const k of ['asText','text','value','id','sceneId']){if(v&&v[k]!=null){const s=toT(v[k],'');if(s)return s;}}if(v&&v.toString&&v.toString!==Object.prototype.toString){const s=String(v);if(s!=='[object Object]')return s;}return fb;}catch(e){return fb;}};
// verify.js：辞書カード読み込み＆表示（/public/data/dictionary.json）
const $ = (s, ctx = document) => ctx.querySelector(s);

const state = { all: [], filtered: [], scenes: [] };
const els = { q: null, scene: null, cards: null, count: null };

document.addEventListener('DOMContentLoaded', init);

async function init() {
  els.q = $('#q');
  els.scene = $('#scene');
  els.cards = $('#cards');
  els.count = $('#count');

  // /verify.html に辞書UIがない時は何もしない（他機能と分離）
  if (!els.cards) return;

  try {
    const res = await fetch('data/dictionary.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('JSON root is not an array');

    state.all = json;
    buildSceneOptions();
    bindEvents();
    applyFilter(); // 初期表示
  } catch (err) {
    console.error('[verify.js] 辞書読込エラー:', err);
    renderError(`辞書データの読み込みに失敗しました：${String(err.message || err)}`);
  }
}

function buildSceneOptions() {
  const set = new Map();
  for (const r of state.all) {
    const key = `${r.sceneId ?? ''}::${r.scene ?? ''}`;
    if (!set.has(key)) set.set(key, { sceneId: r.sceneId, scene: r.scene });
  }
  state.scenes = Array.from(set.values()).sort((a, b) => (a.sceneId ?? 0) - (b.sceneId ?? 0));

  if (els.scene) {
    els.scene.innerHTML = '';
    const optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = '全シーン';
    els.scene.appendChild(optAll);

    for (const s of state.scenes) {
      const opt = document.createElement('option');
      opt.value = String(s.sceneId ?? s.scene ?? '');
      opt.textContent = s.sceneId != null ? `#${s.sceneId} ${s.scene ?? ''}` : (s.scene ?? '');
      els.scene.appendChild(opt);
    }
  }
}

function bindEvents() {
  els.q?.addEventListener('input', applyFilter);
  els.scene?.addEventListener('change', applyFilter);
}

function applyFilter() {
  const q = (els.q?.value || '').trim().toLowerCase();
  const sceneVal = els.scene?.value || '';

  let list = state.all;

  if (sceneVal) {
    list = list.filter(r => {
      const idMatch = String(r.sceneId ?? '') === sceneVal;
      const nameMatch = (r.scene ?? '').toLowerCase() === sceneVal.toLowerCase();
      return idMatch || nameMatch;
    });
  }

  if (q) {
    list = list.filter(r =>
      String(r.id ?? '').includes(q) ||
      (r.scene ?? '').toLowerCase().includes(q) ||
      (r.main ?? '').toLowerCase().includes(q) ||
      (r.romaji ?? '').toLowerCase().includes(q) ||
      (r.description?.ja ?? '').toLowerCase().includes(q) ||
      extractOno(r.main).some(o => o.toLowerCase().includes(q))
    );
  }

  state.filtered = list;
  renderCards();
  updateCount();
}

function updateCount() {
  if (els.count) {
    const total = state.all.length;
    els.count.textContent = total ? `${state.filtered.length} / ${total}` : '';
  }
}

function renderCards() {
  if (!els.cards) return;
  const frag = document.createDocumentFragment();

  for (const r of state.filtered) {
    const art = document.createElement('article');
    art.className = 'card';
    art.setAttribute('role', 'listitem');

    const h3 = document.createElement('h3');
    const no = document.createElement('span');
    no.textContent = 'No.' + (toT(r.id, '-') || '-');
    const sc = document.createElement('span');
    sc.className = 'scene';
    sc.textContent = (toT(r.sceneId) ? ('#' + toT(r.sceneId) + ' ' + toT(r.scene)) : toT(r.scene));
    h3.append(no, sc);

    const main = document.createElement('div');
    main.className = 'main';
    main.innerHTML = highlightOno(escapeHTML(r.main ?? ''));

    const romaji = document.createElement('div');
    romaji.className = 'romaji';
    romaji.textContent = r.romaji || '';

    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = (toT(r.sceneId) ? ('#' + toT(r.sceneId) + ' ' + toT(r.scene)) : toT(r.scene));

    art.append(h3, main, romaji, desc);
    frag.appendChild(art);
  }

  els.cards.innerHTML = '';
  els.cards.appendChild(frag);
}

function renderError(msg) {
  els.cards.innerHTML = `<div class="card" role="alert">${escapeHTML(msg)}</div>`;
  updateCount();
}

// 《オノマトペ》抽出
function extractOno(text = '') {
  return Array.from(text.matchAll(/《([^》]+)》/g)).map(m => m[1]).filter(Boolean);
}

// 《…》を太字化
function highlightOno(escaped) {
  return escaped.replace(/《([^》]+)》/g, '《<span class="ono">$1</span>》');
}

// HTMLエスケープ
function escapeHTML(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

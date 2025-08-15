/* public/ux-bind.js
   - クリック委譲で🔊/★を必ず動かす
   - 🔊/★が単なる文字でも自動で<span/button>にラップ
   - 音声: data-audio/src があればそれを最優先。無ければ Web Speech API(ja-JP) でTTS
   - お気に入り: localStorage に保存（キー: fav/No.###）
   - safe-text.js 等でDOMが再構成されても MutationObserver で自動再バインド
*/
(() => {
  const root = () => document.querySelector(".dict") || document;

  // 近傍の「1エントリ」を推定（No.やカード/LI等）
  const closestEntry = (el) =>
    el.closest("[data-entry], .entry, li, article, section, .card, .item") || el.closest("*");

  // No.123 を抽出（最初に見える番号）
  const getNo = (entry) => {
    const m = (entry?.textContent || "").match(/No\.\s*(\d{1,4})/i);
    return m ? m[1] : null;
  };

  // 本文を取得（候補クラスが無い場合でもフォールバック）
  const getMainEl = (entry) =>
    entry.querySelector(".main, .sentence, .dict-main, [data-role='main'], .example") || entry;

  const getMainText = (entry) => (getMainEl(entry)?.textContent || "").replace(/🔊/g, "").trim();

  // --- お気に入り保存 ---
  const favKey = (no) => (no ? `fav/${no}` : null);
  const isFav = (no) => (no ? localStorage.getItem(favKey(no)) === "1" : false);
  const setFav = (no, val) => {
    const k = favKey(no);
    if (!k) return;
    if (val) localStorage.setItem(k, "1");
    else localStorage.setItem(k, "0");
  };

  const refreshFavButton = (btn, no) => {
    const on = isFav(no);
    btn.textContent = on ? "★" : "☆"; // 見た目は従来と同じ文字
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  };

  // --- 🔊 実再生 ---
  let currentAudio = null;
  const stopAllAudio = () => {
    if (currentAudio) {
      try { currentAudio.pause(); currentAudio.currentTime = 0; } catch {}
      currentAudio = null;
    }
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  const playAudio = (entry) => {
    stopAllAudio();
    // 1) 既存の <audio src> があればそれを優先
    const audioEl = entry.querySelector("audio[src]");
    if (audioEl) { currentAudio = audioEl; audioEl.play(); return; }
    // 2) data-audio / data-sound があればそれを使用
    const dataSrcEl = entry.querySelector("[data-audio], [data-sound]");
    const dataSrc = dataSrcEl?.dataset?.audio || dataSrcEl?.dataset?.sound;
    if (dataSrc) { currentAudio = new Audio(dataSrc); currentAudio.play(); return; }
    // 3) フォールバック：Web Speech API で本文を読み上げ（ja-JP）
    const text = getMainText(entry);
    if (!text || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = 0.95;
    // 可能なら日本語ボイスを選択
    const pick = () => speechSynthesis.getVoices().find(v => v.lang?.startsWith("ja")) || null;
    const v = pick();
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  };

  // --- テキスト内の 🔊 / ★ / ☆ を「見た目そのまま」でボタン化 ---
  //    既にラップ済みならスキップ。safe-text後でも再適用可。
  const wrapGlyphs = (scope) => {
    const candidates = Array.from((scope || root()).querySelectorAll(
      ".main, .sentence, .dict-main, [data-role='main'], .example, .title, .controls, .toolbar, .meta, .no, .number, .header, li, .card, p"
    ));
    const RE = /([🔊★☆])/;

    candidates.forEach((node) => {
      if (node.querySelector(".js-audio, .js-fav")) return; // 既にボタン化済み
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      const texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);

      texts.forEach((textNode) => {
        const parts = textNode.nodeValue.split(RE);
        if (parts.length === 1) return;

        const frag = document.createDocumentFragment();
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (part === "🔊") {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "js-audio";
            b.setAttribute("aria-label", "音声再生");
            b.textContent = "🔊";
            frag.appendChild(b);
          } else if (part === "★" || part === "☆") {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "js-fav";
            b.setAttribute("aria-label", "お気に入り");
            b.setAttribute("aria-pressed", "false");
            b.textContent = part;
            frag.appendChild(b);
          } else if (part) {
            frag.appendChild(document.createTextNode(part));
          }
        }
        textNode.parentNode.replaceChild(frag, textNode);
      });
    });
  };

  // --- 初期化：★状態を localStorage から反映 ---
  const initFavState = (scope) => {
    (scope || root()).querySelectorAll(".js-fav").forEach((btn) => {
      const entry = closestEntry(btn);
      const no = getNo(entry);
      refreshFavButton(btn, no);
    });
  };

  // --- クリック委譲（safe-text後でも壊れない） ---
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    // 🔊
    if (target.closest(".js-audio, [data-role='play'], .play-audio")) {
      const entry = closestEntry(target);
      playAudio(entry);
      e.preventDefault();
      return;
    }

    // ★
    const favBtn = target.closest(".js-fav, [data-role='favorite'], .fav");
    if (favBtn) {
      const entry = closestEntry(favBtn);
      const no = getNo(entry);
      const newVal = !isFav(no);
      setFav(no, newVal);
      // 同一エントリ内の★表示を揃える
      entry.querySelectorAll(".js-fav").forEach((b) => refreshFavButton(b, no));
      e.preventDefault();
      return;
    }
  }, true); // captureで早めに拾う

  // --- 起動＆監視（再描画にも耐える） ---
  const boot = () => {
    const r = root();
    wrapGlyphs(r);
    initFavState(r);

    // DOM更新を監視して再適用（安全バッファ）
    let timer = 0;
    const reapply = (node) => {
      if (timer) cancelAnimationFrame(timer);
      timer = requestAnimationFrame(() => {
        wrapGlyphs(node || r);
        initFavState(node || r);
      });
    };
    const obs = new MutationObserver((muts) => {
      // 大きく変わったときだけ軽くディバウンス
      reapply(r);
    });
    obs.observe(r, { subtree: true, childList: true, characterData: false });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 0));
  } else {
    setTimeout(boot, 0);
  }

})();

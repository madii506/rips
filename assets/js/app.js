// RIPS: the pack on the table, the live shelf of real slabs, and the market grid. Public data only.
(function () {
  const C = window.RIPS || {};
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = m => { const t = $('#toast'); if (!t) return; t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2800); };
  const getJ = async (u, ms = 12000) => { const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms); try { const r = await fetch(u, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); } finally { clearTimeout(t); } };
  const thumb = (u, w) => 'https://wsrv.nl/?url=' + encodeURIComponent(u) + '&w=' + w + '&output=webp&q=80';
  const usd0 = v => v == null || !isFinite(v) ? '—' : v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : v >= 1e5 ? '$' + Math.round(v / 1e3) + 'K' : '$' + Math.round(v).toLocaleString('en-US');
  const solFmt = v => v >= 1000 ? Math.round(v).toLocaleString('en-US') : v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
  const trunc = (s, n) => (s = String(s || '')).length > n ? s.slice(0, n - 1).trim() + '…' : s;
  const ripUsd = Number(C.ripUsd) || 2, pity = Number(C.pity) || 100, ticker = C.ticker || 'RIPS';
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  $$('[data-cfg]').forEach(el => { const v = C[el.dataset.cfg]; if (v != null && v !== '') el.textContent = v; });
  if (C.x) { const a = $('#xLink'); a.href = 'https://x.com/' + C.x; a.hidden = false; }
  if (C.seedHash) { $('#seedBox').textContent = C.seedHash; $('#seedBox').classList.add('hash'); }

  /* ---------- the pack mark: cut like a stone, one rip across it, split in two so the top can tear away ---------- */
  function packSVG(id) {
    const teeth = (y, up) => { let d = ''; for (let i = 0; i <= 12; i++) d += `L${(30 + i * 140 / 12).toFixed(1)},${(i % 2 ? (up ? y - 9 : y + 9) : y)} `; return d; };
    const zig = 'M20,156 L44,128 L58,146 L74,118 L90,140 L106,110 L122,134 L138,104 L154,126 L180,96';
    const art = `<path d="M30,36 ${teeth(36, true)} L170,36 L170,50 L30,50 Z" fill="url(#${id}c)"/>
      <path d="M30,220 L170,220 L170,234 ${teeth(234, false).trim().split(' ').reverse().join(' ')} L30,234 Z" fill="url(#${id}c)"/>
      <path d="M30,52 L100,52 L100,218 L30,218 Z" fill="url(#${id}l)"/><path d="M100,52 L170,52 L170,218 L100,218 Z" fill="url(#${id}r)"/>
      <path d="M30,52 L100,52 L64,135 Z" fill="#fff" opacity=".22"/><path d="M100,52 L170,52 L136,135 Z" fill="#000" opacity=".08"/>
      <path d="M30,218 L64,135 L100,218 Z" fill="#000" opacity=".1"/><path d="M100,218 L136,135 L170,218 Z" fill="#000" opacity=".2"/>
      <g clip-path="url(#${id}b)"><path d="${zig}" fill="none" stroke="#1a0c08" stroke-width="13" stroke-linejoin="round"/><path d="${zig}" fill="none" stroke="#fff3dc" stroke-width="5" stroke-linejoin="round"/></g>`;
    return `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg"><defs>
      <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd08a"/><stop offset="1" stop-color="#ff9a3c"/></linearGradient>
      <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6a1a"/><stop offset="1" stop-color="#e2480c"/></linearGradient>
      <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff9a3c"/><stop offset=".5" stop-color="#ff6a1a"/><stop offset="1" stop-color="#b8360a"/></linearGradient>
      <clipPath id="${id}b"><rect x="30" y="52" width="140" height="166"/></clipPath>
      <clipPath id="${id}t"><path d="M0,0 L200,0 L200,86 L180,96 L154,126 L138,104 L122,134 L106,110 L90,140 L74,118 L58,146 L44,128 L20,156 L0,165 Z"/></clipPath>
      <clipPath id="${id}u"><path d="M0,165 L20,156 L44,128 L58,146 L74,118 L90,140 L106,110 L122,134 L138,104 L154,126 L180,96 L200,86 L200,270 L0,270 Z"/></clipPath>
    </defs><g class="pk-bot" clip-path="url(#${id}u)">${art}</g><g class="pk-top" clip-path="url(#${id}t)">${art}</g></svg>`;
  }
  $$('[data-pack]').forEach((el, i) => { el.innerHTML = packSVG('p' + i); });

  /* ---------- background: thin crack lines round the pack, a few embers rising ---------- */
  (function lines() {
    const svg = $('#stLines'); if (!svg) return; const W = 900, H = 760, cx = W / 2, cy = H * .44; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    let s = 9; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; let d = '';
    for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2 + rnd() * .3; let r = 150; d += `M${(cx + Math.cos(a) * r).toFixed(0)},${(cy + Math.sin(a) * r * .9).toFixed(0)} `; for (let k = 0; k < 3; k++) { r += 70 + rnd() * 90; const aa = a + (rnd() - .5) * .3; d += `L${(cx + Math.cos(aa) * r).toFixed(0)},${(cy + Math.sin(aa) * r * .9).toFixed(0)} `; } }
    svg.innerHTML = `<path d="${d}"/>`;
  })();
  if (!reduce) { const E = $('#embers'); for (let i = 0; i < 22; i++) { const e = document.createElement('i'); e.style.left = (Math.random() * 100) + '%'; e.style.setProperty('--s', (2 + Math.random() * 3.5).toFixed(1) + 'px'); e.style.setProperty('--d', (9 + Math.random() * 10).toFixed(1) + 's'); e.style.setProperty('--dl', (-Math.random() * 18).toFixed(1) + 's'); e.style.setProperty('--x', ((Math.random() - .5) * 140).toFixed(0) + 'px'); e.style.setProperty('--o', (.25 + Math.random() * .5).toFixed(2)); E.appendChild(e); } }

  /* ---------- market data: real graded Pokémon listings through our own /api/market ---------- */
  const mcache = {};
  async function mFetch(v) { const c = mcache[v]; if (c && Date.now() - c.t < 55000) return c.j; const j = await getJ('/api/market?view=' + v); if (!j || !j.ok) throw new Error('bad'); mcache[v] = { j, t: Date.now() }; return j; }

  /* ---------- the shelf panel: one real slab at a time, and the odds a pack holding it would start at ---------- */
  let shelf = [], si = 0;
  function showSlab(i) {
    if (!shelf.length) return; si = (i + shelf.length) % shelf.length; const x = shelf[si];
    const value = x.insured || x.usd || 0;
    $('#shVal').textContent = value ? Math.round(value).toLocaleString('en-US') : '—';
    $('#shName').textContent = x.name || 'Graded card';
    $('#shGrade').textContent = x.gradeLabel || (x.grade ? 'Grade ' + x.grade : '—');
    $('#shGr').textContent = x.grader || '—'; $('#shYear').textContent = x.year || '—';
    $('#shAsk').textContent = solFmt(x.price) + ' SOL';
    const im = $('#shImg'); im.classList.remove('ld'); im.alt = x.name || ''; im.dataset.o = x.image || '';
    if (x.image) im.src = thumb(x.image, 260); else im.removeAttribute('src');
    const a = $('#shLink'); a.href = x.url; a.target = '_blank'; a.rel = 'noopener';
    const n = Math.max(2, Math.round(value / ripUsd)); $('#oddsN').textContent = n.toLocaleString('en-US');
    $('#oddsMeter').style.width = Math.min(100, 8 + 92 * (ripUsd / Math.max(value, ripUsd)) * 40) + '%';
  }
  $('#shImg').addEventListener('load', e => e.target.classList.add('ld'));
  $('#shImg').addEventListener('error', e => { const im = e.target, o = im.dataset.o; if (o && im.src !== o) { im.dataset.o = ''; im.src = o; } });
  $('#shPrev').onclick = () => showSlab(si - 1); $('#shNext').onclick = () => showSlab(si + 1);
  (async () => {
    try { const j = await mFetch('fair'); shelf = (j.items || []).filter(x => x.image && (x.insured || x.usd)); if (!shelf.length) { const k = await mFetch('new'); shelf = (k.items || []).filter(x => x.image); } showSlab(0); }
    catch { $('#shName').textContent = 'The card market is not answering right now.'; }
  })();

  /* ---------- see a pull: shake, tear, a real slab rises out ---------- */
  const stage = $('#stage'), tryBtn = $('#tryBtn'); let busy = false, opened = false;
  tryBtn.onclick = async () => {
    if (busy) return; busy = true;
    if (opened) { stage.classList.remove('torn'); opened = false; tryBtn.textContent = 'See a pull'; await sleep(650); busy = false; return; }
    const pool = shelf.length ? shelf : []; const x = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    const im = $('#pullImg');
    if (x && x.image) { im.src = thumb(x.image, 420); im.onerror = () => { if (im.src !== x.image) im.src = x.image; }; await Promise.race([new Promise(r => { im.onload = r; }), sleep(900)]); }
    $('#pullNm').textContent = x ? trunc(x.name, 38) : 'A real graded slab';
    $('#pullMt').textContent = x ? [x.grader && x.grade ? x.grader + ' ' + x.grade : x.gradeLabel, x.insured ? 'insured ' + usd0(x.insured) : null].filter(Boolean).join(' · ') : '';
    stage.classList.add('shake'); await sleep(reduce ? 50 : 560); stage.classList.remove('shake');
    stage.classList.add('torn'); opened = true; tryBtn.textContent = 'Seal it again'; busy = false;
  };

  /* ---------- connect, then rip (ripping switches on with the first pack) ---------- */
  const ripBtn = $('#ripBtn');
  function paintRip() {
    const W = window.MINTWALLET && window.MINTWALLET.W; const on = !!(W && W.pk);
    ripBtn.textContent = !on ? 'Connect to rip' : C.ca && C.seedHash ? `Rip · $${ripUsd} of $${ticker}` : 'Rips open at launch';
  }
  ripBtn.onclick = () => {
    const M = window.MINTWALLET; if (!M) return;
    if (!M.W.pk) { M.picker(); return; }
    toast(C.ca && C.seedHash ? 'Ripping switches on with the first pack. Watch X for the go.' : 'Rips open when $' + ticker + ' launches and the first pack is stocked.');
  };
  document.addEventListener('rips:wallet', paintRip); setTimeout(paintRip, 600);

  /* ---------- the coin: address and links only once it exists; burned straight from the supply ---------- */
  if (C.ca) {
    $('#caBox').innerHTML = `<div class="pn" style="padding:14px 16px"><div class="k">$${esc(ticker)}</div><div style="display:flex;gap:10px;align-items:center;margin-top:10px"><code style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:400 13px var(--mono)">${esc(C.ca)}</code><button class="btn gh sm" type="button" id="copyCa">Copy</button></div><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><a class="btn gh sm" href="https://pump.fun/coin/${esc(C.ca)}" target="_blank" rel="noopener">Buy ↗</a><a class="btn gh sm" href="https://dexscreener.com/solana/${esc(C.ca)}" target="_blank" rel="noopener">Chart ↗</a></div></div>`;
    $('#copyCa').onclick = async () => { try { await navigator.clipboard.writeText(C.ca); toast('Copied the $' + ticker + ' address.'); } catch { toast(C.ca); } };
    const burned = async () => { try { const r = await getJ('/api/live?ca=' + encodeURIComponent(C.ca)); if (r.burned != null) { $('#burnV').innerHTML = `${r.burned >= 1e6 ? (r.burned / 1e6).toFixed(2) + 'M' : Math.round(r.burned).toLocaleString('en-US')}<small>$${esc(ticker)}</small>`; $('#burnD').textContent = 'Burned so far, read from the supply.'; } } catch {} };
    burned(); setInterval(() => { if (!document.hidden) burned(); }, 30000);
  }

  /* ---------- the live tape: real slabs just listed ---------- */
  const tape = $('#tape');
  const fallbackTape = () => { const w = ['Fees stock the pack', 'Rip it', `Every rip burns $${ticker}`, 'Tear it open', 'Keep the slab']; const lap = w.map(t => `<span>${esc(t)}</span>`).join(''); tape.innerHTML = lap.repeat(4); };
  fallbackTape();
  tape.addEventListener('error', e => { if (e.target.tagName === 'IMG') e.target.remove(); }, true);
  (async () => { try { const j = await mFetch('new'); const it = (j.items || []).slice(0, 14); if (it.length < 3) return;
    const lap = it.map(x => `<span>${x.image ? `<img src="${esc(thumb(x.image, 48))}" alt="" loading="lazy">` : ''}<em>listed</em>${esc(trunc(x.name, 30))} <b>${esc([x.grader, x.grade].filter(Boolean).join(' '))}</b> ${solFmt(x.price)} SOL</span>`).join('');
    tape.innerHTML = lap + lap; tape.style.animationDuration = Math.max(40, tape.scrollWidth / 2 / 45).toFixed(0) + 's'; } catch {} })();

  /* ---------- the shelf section: three tabs of real listings ---------- */
  const mgrid = $('#mgrid'), mchip = $('#mktChip'), mtabs = $('#mktTabs'), mind = mtabs.querySelector('.tab-ind');
  let mview = 'fair', mreq = 0, mAt = 0, mStarted = false;
  const perView = () => innerWidth <= 1180 ? 8 : 12;
  const skeleton = n => Array.from({ length: n }, () => '<div class="mc sk shown"><div class="mimg"></div><div class="mbody"><i class="skl" style="width:84%"></i><i class="skl" style="width:52%"></i><i class="skl" style="width:40%;margin-top:auto"></i></div></div>').join('');
  function moveInd() { const b = mtabs.querySelector('button.on'); if (!b) return; mind.style.width = b.offsetWidth + 'px'; mind.style.transform = `translateX(${b.offsetLeft}px)`; }
  function mCard(x, i) {
    const gl = [x.grader, x.grade].filter(Boolean).join(' ') || x.gradeLabel || '';
    const meta = [x.year, x.insured ? 'insured ' + usd0(x.insured) : x.gradeLabel].filter(Boolean).join(' · ') || 'graded';
    const under = x.usd != null && x.insured ? Math.round((1 - x.usd / x.insured) * 100) : 0;
    return `<a class="mc" href="${esc(x.url)}" target="_blank" rel="noopener" style="--d:${(Math.min(i, 12) * .045).toFixed(3)}s" title="${esc(x.full || x.name)}"><div class="mimg">${x.image ? `<img src="${esc(thumb(x.image, 400))}" data-o="${esc(x.image)}" alt="${esc(x.name)}" loading="lazy" decoding="async">` : '<span class="noimg">NO PHOTO</span>'}${gl ? `<span class="grade${Number(x.grade) === 10 ? ' g10' : ''}">${esc(gl)}</span>` : ''}${under >= 3 ? `<span class="mval">${under}% under</span>` : ''}</div><div class="mbody"><div class="mname">${esc(x.name || 'Graded card')}</div><div class="mmeta">${esc(meta)}</div><div class="mprice"><b>${solFmt(x.price)} SOL</b><span>${x.usd != null ? '≈ ' + usd0(x.usd) : ''}</span></div></div></a>`;
  }
  function mChip() { if (!mAt) return; const s = Math.max(0, Math.round((Date.now() - mAt) / 1000)); mchip.className = 'chip live'; mchip.innerHTML = `<i></i>live · ${s < 5 ? 'just now' : s < 90 ? s + 's ago' : Math.round(s / 60) + 'm ago'}`; }
  function mRender(j) {
    const items = j.items || [], sig = mview + ':' + items.map(x => x.mint + x.price).join(','); mAt = j.at || Date.now(); mChip();
    if (mgrid.dataset.sig === sig) return; mgrid.dataset.sig = sig; mgrid.classList.toggle('empty', !items.length);
    if (!items.length) { mgrid.innerHTML = '<div class="mempty"><p>Nothing on this shelf right now. Try another one.</p></div>'; return; }
    mgrid.innerHTML = items.map(mCard).join(''); mgrid.scrollLeft = 0;
    mgrid.querySelectorAll('img').forEach(im => { if (im.complete && im.naturalWidth) im.classList.add('ld'); });
    requestAnimationFrame(() => requestAnimationFrame(() => mgrid.querySelectorAll('.mc').forEach(m => m.classList.add('shown'))));
  }
  async function loadMarket(v, quiet) {
    mview = v; const my = ++mreq;
    mtabs.querySelectorAll('button').forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); }); moveInd();
    if (!quiet && !(mcache[v] && Date.now() - mcache[v].t < 55000)) { mgrid.dataset.sig = ''; mgrid.classList.remove('empty'); mgrid.innerHTML = skeleton(perView()); }
    try { const j = await mFetch(v); if (my === mreq) mRender(j); }
    catch { if (my !== mreq) return; if (mcache[v]) { mRender(mcache[v].j); return; } if (quiet && mgrid.dataset.sig) return;
      mchip.className = 'chip'; mchip.innerHTML = '<i></i>offline'; mgrid.dataset.sig = ''; mgrid.classList.add('empty');
      mgrid.innerHTML = '<div class="mempty"><p>The card market is not answering right now.</p><button class="btn gh sm" type="button" data-retry>Try again</button></div>'; }
  }
  mgrid.innerHTML = skeleton(perView());
  mgrid.addEventListener('load', e => { if (e.target.tagName === 'IMG') e.target.classList.add('ld'); }, true);
  mgrid.addEventListener('error', e => { const im = e.target; if (im.tagName !== 'IMG') return; const o = im.dataset.o; if (o) { im.dataset.o = ''; im.src = o; } else { const n = document.createElement('span'); n.className = 'noimg'; n.textContent = 'NO PHOTO'; im.replaceWith(n); } }, true);
  mgrid.addEventListener('click', e => { if (e.target.closest('[data-retry]')) loadMarket(mview); });
  mtabs.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b && b.dataset.v !== mview) loadMarket(b.dataset.v); });
  addEventListener('resize', moveInd); if (document.fonts) document.fonts.ready.then(moveInd); moveInd();
  const mStart = () => { if (mStarted) return; mStarted = true; loadMarket('fair'); };
  if ('IntersectionObserver' in window) { const mo = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { mStart(); mo.disconnect(); } }, { rootMargin: '700px 0px' }); mo.observe($('#shelf')); } else mStart();
  setInterval(() => { if (!document.hidden && mStarted) mChip(); }, 5000);
  setInterval(() => { if (!document.hidden && mStarted) loadMarket(mview, true); }, 60000);

  /* ---------- reveals and the nav ---------- */
  const rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }); rv.forEach(e => io.observe(e)); setTimeout(() => rv.forEach(e => e.classList.add('vis')), 6000); }
  else rv.forEach(e => e.classList.add('vis'));
  const navA = $$('#nav a[href^="#"]');
  if ('IntersectionObserver' in window) { const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) navA.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' }); $$('main section[id]').forEach(s => io2.observe(s)); }
})();

// RIPS wallet button: connect Phantom, Solflare or Backpack, show the address and your bag. Read-only: it never signs.
(function () {
  const C = window.RIPS || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const short = a => a ? a.slice(0, 4) + '…' + a.slice(-4) : '';
  const store = { get: k => { try { return localStorage.getItem('rips:' + k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem('rips:' + k) : localStorage.setItem('rips:' + k, v); } catch {} } };
  const W = { pk: null, name: null, prov: null };
  const WALLETS = [
    { id: 'phantom', name: 'Phantom', get: () => (window.phantom && window.phantom.solana && window.phantom.solana.isPhantom ? window.phantom.solana : (window.solana && window.solana.isPhantom ? window.solana : null)), deep: u => `https://phantom.app/ul/browse/${encodeURIComponent(u)}?ref=${encodeURIComponent(location.origin)}`, color: '#ab9ff2' },
    { id: 'solflare', name: 'Solflare', get: () => (window.solflare && window.solflare.isSolflare ? window.solflare : null), deep: u => `https://solflare.com/ul/v1/browse/${encodeURIComponent(u)}?ref=${encodeURIComponent(location.origin)}`, color: '#fc7227' },
    { id: 'backpack', name: 'Backpack', get: () => (window.backpack && window.backpack.solana) || (window.backpack && window.backpack.isBackpack ? window.backpack : null), deep: null, color: '#e33e3f' },
  ];
  const btnHost = $('#navWallet'); if (!btnHost) return;
  const toast = m => { const t = $('#toast'); if (!t) return; t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600); };

  function paint() {
    if (W.pk) btnHost.innerHTML = `<button class="btn wbtn on" type="button" id="wBtn"><i class="wdot"></i>${esc(short(W.pk))}</button>`;
    else btnHost.innerHTML = `<button class="btn or sm wbtn" type="button" id="wBtn">Connect</button>`;
    $('#wBtn').onclick = e => { e.stopPropagation(); W.pk ? toggleMenu() : picker(); };
  }
  /* the picker: installed wallets first; on a phone with none installed, open the site inside the wallet's browser */
  function picker() {
    closeAll();
    const rows = WALLETS.map(w => { const p = w.get(); return `<button class="wrow" type="button" data-w="${w.id}"><span class="wlogo" style="--c:${w.color}">${w.name[0]}</span><span class="wn">${w.name}</span><span class="ws">${p ? 'detected' : w.deep ? 'open in app' : 'not installed'}</span></button>`; }).join('');
    const m = document.createElement('div'); m.className = 'wmodal'; m.id = 'wModal';
    m.innerHTML = `<div class="wcard" role="dialog" aria-label="Connect a wallet"><div class="whead"><b>Connect a wallet</b><button class="wx" type="button" aria-label="Close">×</button></div><div class="wlist">${rows}</div><p class="wfine">Read-only. RIPS only reads your public address to show your bag. It never asks you to sign anything.</p></div>`;
    document.body.appendChild(m); requestAnimationFrame(() => m.classList.add('on'));
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('.wx')) closeAll(); const r = e.target.closest('[data-w]'); if (r) connect(r.dataset.w); });
  }
  async function connect(id, silent) {
    const w = WALLETS.find(x => x.id === id); if (!w) return;
    const p = w.get();
    if (!p) { if (silent) return; if (w.deep && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) { location.href = w.deep(location.href); return; } window.open(w.id === 'phantom' ? 'https://phantom.app/download' : w.id === 'solflare' ? 'https://solflare.com/download' : 'https://backpack.app/downloads', '_blank', 'noopener'); return; }
    try {
      const r = await (silent ? p.connect({ onlyIfTrusted: true }) : p.connect());
      const pk = (r && r.publicKey) || p.publicKey; if (!pk) throw new Error('no key');
      W.pk = pk.toString(); W.name = w.name; W.prov = p; store.set('w', w.id);
      if (p.on) { try { p.on('accountChanged', k => { if (k) { W.pk = k.toString(); paint(); bag(); } else disconnect(); }); p.on('disconnect', () => disconnect(true)); } catch {} }
      closeAll(); paint(); if (!silent) toast(`Connected ${w.name}.`); bag();
      document.dispatchEvent(new CustomEvent('rips:wallet', { detail: W.pk }));
    } catch (e) { if (!silent) toast(/reject|denied|cancel/i.test(String(e && e.message)) ? 'You cancelled. Nothing connected.' : 'That wallet did not connect. Try again.'); }
  }
  async function disconnect(quiet) {
    try { W.prov && W.prov.disconnect && await W.prov.disconnect(); } catch {}
    W.pk = W.prov = W.name = null; store.set('w', null); closeAll(); paint(); if (!quiet) toast('Disconnected.');
    document.dispatchEvent(new CustomEvent('rips:wallet', { detail: null }));
  }
  let bagData = null;
  async function bag() {
    bagData = null; if (!W.pk) return;
    try { const qs = new URLSearchParams({ owner: W.pk }); if (C.ca) qs.set('ca', C.ca); const r = await fetch('/api/live?' + qs); bagData = await r.json(); } catch { bagData = { err: true }; }
    const m = $('#wMenu'); if (m) fillMenu(m);
  }
  function fillMenu(m) {
    const b = bagData;
    const sol = b && b.ownerSol != null ? b.ownerSol.toLocaleString('en-US', { maximumFractionDigits: 3 }) + ' SOL' : b && b.err ? '—' : '…';
    const tok = !C.ca ? 'at launch' : b && b.ownerBal != null ? b.ownerBal.toLocaleString('en-US', { maximumFractionDigits: 0 }) : b && b.err ? '—' : '…';
    m.innerHTML = `<div class="wm-h"><span class="wlogo sm" style="--c:${(WALLETS.find(w => w.name === W.name) || {}).color || '#ff7a1a'}">${esc((W.name || 'W')[0])}</span><div><div class="wm-n">${esc(W.name || 'Wallet')}</div><div class="wm-a">${esc(short(W.pk))}</div></div></div>
      <div class="wm-row"><span>Balance</span><b>${sol}</b></div><div class="wm-row"><span>$${esc(C.ticker || 'RIPS')}</span><b>${tok}</b></div>
      <div class="wm-act"><button type="button" data-a="copy">Copy address</button><a href="https://solscan.io/account/${esc(W.pk)}" target="_blank" rel="noopener">Solscan ↗</a><button type="button" data-a="off" class="off">Disconnect</button></div>`;
  }
  function toggleMenu() {
    const open = $('#wMenu'); if (open) { closeAll(); return; }
    closeAll(); const m = document.createElement('div'); m.className = 'wmenu'; m.id = 'wMenu'; fillMenu(m); btnHost.appendChild(m); requestAnimationFrame(() => m.classList.add('on'));
    m.addEventListener('click', async e => { e.stopPropagation(); const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'copy') { try { await navigator.clipboard.writeText(W.pk); toast('Address copied.'); } catch { toast(W.pk); } }
      if (a.dataset.a === 'off') disconnect(); });
    if (!bagData) bag();
  }
  function closeAll() { const m = $('#wModal'); if (m) m.remove(); const n = $('#wMenu'); if (n) n.remove(); }
  document.addEventListener('click', e => { if (!e.target.closest('#navWallet') && !e.target.closest('#wModal')) { const n = $('#wMenu'); if (n) n.remove(); } });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
  paint();
  // reconnect silently if this wallet already trusts the site
  const last = store.get('w'); if (last) setTimeout(() => connect(last, true), 400);
  window.MINTWALLET = { W, connect, disconnect, picker };
})();

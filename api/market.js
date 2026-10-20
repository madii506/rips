// GET /api/market?view=fair|tens|new — real listings of graded Pokémon cards on Solana: Collector Crypt's vaulted,
// tokenized cards as listed on Magic Eden. This is the market the vault buys from. Cached per view.
//   fair: graded cards from the newest 300 listings whose ask is at most 1.15x the card's insured value, most valuable first
//   tens: the cheapest Gem Mint 10s
//   new:  the newest listings
const ME = 'https://api-mainnet.magiceden.dev/v2/collections/collector_crypt/listings';
const SOL = 'So11111111111111111111111111111111111111112';
const POKE = [{ traitType: 'Category', value: 'Pokemon' }];
const TENS = ['GEM-MT 10', 'GEM MINT 10', 'PRISTINE 10', 'Pristine 10', 'Gem Mint 10', '10-PRISTINE', 'PERFECT 10', 'Perfect 10'].map(value => ({ traitType: 'The Grade', value }));
const VIEWS = {
  fair: { attrs: [POKE], sort: 'updatedAt', dir: 'desc', extra: '', pages: 3, ttl: 120000 },
  tens: { attrs: [POKE, TENS], sort: 'listPrice', dir: 'asc', extra: '&min_price=0.2', pages: 1, ttl: 60000 },
  new: { attrs: [POKE], sort: 'updatedAt', dir: 'desc', extra: '', pages: 1, ttl: 60000 },
};
VIEWS.grails = VIEWS.fair; // older pages asked for 'grails'
const cache = new Map(); let solUsd = { v: null, at: 0 };
async function getJson(url, ms = 9000) { const r = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { accept: 'application/json' } }); if (!r.ok) throw new Error('http ' + r.status); return r.json(); }
async function solPrice() {
  if (solUsd.v && Date.now() - solUsd.at < 120000) return solUsd.v;
  try { const j = await getJson('https://lite-api.jup.ag/price/v3?ids=' + SOL, 5000); const p = j && j[SOL] && Number(j[SOL].usdPrice); if (p) solUsd = { v: p, at: Date.now() }; } catch {}
  return solUsd.v;
}
function clean(name) {
  return String(name || '').replace(/^\d{4}\s+/, '').replace(/^#\S+\s+/, '').replace(/\b(PSA|CGC|BGS|SGC|TAG|ACE|Beckett)\s*\d+(\.\d)?\b/gi, '')
    .replace(/\b(Pokemon|Pokémon|Game)\b\s*$/i, '').replace(/\s+-\s*$/, '').replace(/\s{2,}/g, ' ').trim().slice(0, 80);
}
function shape(x, usd) {
  const t = x.token || {}; if (!t.mintAddress || !(x.price > 0)) return null;
  const a = Object.fromEntries((t.attributes || []).map(k => [k.trait_type, k.value]));
  const gradeStr = String(a['The Grade'] || '').trim(); if (!gradeStr || gradeStr === 'undefined') return null; // graded cards only
  const num = (gradeStr.match(/(\d+(?:\.\d)?)\s*$/) || gradeStr.match(/(\d+(?:\.\d)?)/) || [])[1] || null;
  const insured = Number(a['Insured Value']) > 0 ? Number(a['Insured Value']) : null;
  return { mint: t.mintAddress, name: clean(t.name), full: t.name, image: t.image || (x.extra && x.extra.img) || null, price: x.price, usd: usd ? x.price * usd : null,
    grader: a['Grading Company'] || null, grade: num, gradeLabel: gradeStr, year: a.Year || null, insured, url: `https://magiceden.io/item-details/${t.mintAddress}` };
}
module.exports = async (req, res) => {
  const view = new URL(req.url, 'http://x').searchParams.get('view') || 'fair';
  const send = (code, body, cc) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', cc || 'no-store'); res.end(JSON.stringify(body)); };
  const V = VIEWS[view]; if (!V) return send(400, { ok: false, msg: 'Unknown view.' });
  const key = V === VIEWS.fair ? 'fair' : view, cc = `public, max-age=0, s-maxage=${V.ttl / 1000}, stale-while-revalidate=300`;
  const c = cache.get(key); if (c && Date.now() - c.at < V.ttl) return send(200, c.v, cc);
  try {
    const q = `limit=100&attributes=${encodeURIComponent(JSON.stringify(V.attrs))}&sort=${V.sort}&sort_direction=${V.dir}${V.extra}`;
    const pages = Array.from({ length: V.pages }, (_, i) => getJson(`${ME}?offset=${i * 100}&${q}`).catch(e => (i ? [] : Promise.reject(e))));
    const [usd, ...lists] = await Promise.all([solPrice(), ...pages]);
    const seen = new Set(); let items = [];
    for (const x of lists.flat()) { const it = shape(x, usd); if (!it || seen.has(it.mint)) continue; seen.add(it.mint); items.push(it); }
    let checked = true;
    if (key === 'fair') {
      if (usd) items = items.filter(it => it.insured && it.usd <= it.insured * 1.15).sort((a, b) => b.insured - a.insured || a.price - b.price);
      else checked = false;
    }
    const v = { ok: true, view: key, at: Date.now(), solUsd: usd, checked, items: items.slice(0, 18) };
    cache.set(key, { v, at: Date.now() }); send(200, v, cc);
  } catch (e) { if (c) return send(200, c.v, 'public, max-age=0, s-maxage=30'); send(502, { ok: false, msg: 'The card market is not answering right now.' }); }
};

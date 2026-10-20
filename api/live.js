// GET /api/live?ca=<mint>&vault=<wallet> — the numbers the browser can't read itself:
// the token's supply (so the burn), the vault's SOL, and the cards the vault holds. Public data only, cached 20s.
const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const RPCS = [process.env.RPC_URL, 'https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com'].filter(Boolean);
const cache = new Map();
async function getJson(url, opt = {}, ms = 8000) {
  const r = await fetch(url, { ...opt, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error('http ' + r.status);
  return r.json();
}
async function rpc(method, params) {
  let last;
  for (const u of RPCS) {
    try { const j = await getJson(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }); if (j.error) { last = new Error(j.error.message); continue; } return j.result; }
    catch (e) { last = e; }
  }
  throw last || new Error('rpc down');
}
module.exports = async (req, res) => {
  const q = new URL(req.url, 'http://x').searchParams;
  const ca = (q.get('ca') || '').trim(), vault = (q.get('vault') || '').trim(), owner = (q.get('owner') || '').trim();
  const send = (code, body, cc) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', cc || 'no-store'); res.end(JSON.stringify(body)); };
  if ((ca && !B58.test(ca)) || (vault && !B58.test(vault)) || (owner && !B58.test(owner)) || (!ca && !vault && !owner)) return send(400, { ok: false, msg: 'Pass a valid ca, vault or owner.' });
  const key = ca + ':' + vault + ':' + owner, c = cache.get(key);
  if (c && Date.now() - c.at < (owner ? 8000 : 20000)) return send(200, c.v, owner ? 'no-store' : 'public, max-age=0, s-maxage=20');
  const out = { ok: true, at: Date.now() };
  await Promise.all([
    ca && rpc('getTokenSupply', [ca, { commitment: 'confirmed' }]).then(s => { const left = Number(s.value.uiAmountString || s.value.uiAmount || 0); out.supply = left; out.burned = Math.max(0, 1e9 - left); }).catch(() => { out.supplyErr = true; }),
    vault && rpc('getBalance', [vault, { commitment: 'confirmed' }]).then(b => { out.vaultSol = b.value / 1e9; }).catch(() => { out.vaultErr = true; }),
    vault && getJson(`https://api-mainnet.magiceden.dev/v2/wallets/${vault}/tokens?offset=0&limit=100`).then(list => {
      out.cards = (Array.isArray(list) ? list : []).filter(t => t && t.image).slice(0, 60).map(t => ({ mint: t.mintAddress, name: t.name, image: t.image, collection: t.collectionName || t.collection || null }));
    }).catch(() => { out.cardsErr = true; }),
    owner && rpc('getBalance', [owner, { commitment: 'confirmed' }]).then(b => { out.ownerSol = b.value / 1e9; }).catch(() => { out.ownerErr = true; }),
    owner && ca && rpc('getTokenAccountsByOwner', [owner, { mint: ca }, { encoding: 'jsonParsed', commitment: 'confirmed' }]).then(r => {
      out.ownerBal = (r.value || []).reduce((s, a) => s + Number(a.account.data.parsed.info.tokenAmount.uiAmountString || 0), 0);
    }).catch(() => { out.ownerErr = true; }),
  ]);
  cache.set(key, { v: out, at: Date.now() }); if (cache.size > 200) cache.clear();
  send(200, out, owner ? 'no-store' : 'public, max-age=0, s-maxage=20');
};

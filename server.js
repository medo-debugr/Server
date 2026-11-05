// Dedicated authoritative game server (zero npm dependencies, Node.js 18+).
//  - serves the game files from ./public (so one deploy = whole game)
//  - raw WebSocket at /ws: rooms (6-char code), reconnect, ping, input -> authoritative 60 Hz simulation -> 30 Hz snapshots
//  - keeps the kill-statistics API (/api/stats, /api/kills)
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), zlib = require('zlib');
const { upgrade } = require('./ws');
const { Match, STEP_MS, MAPS } = require('./sim');

const PORT = process.env.PORT || 3000;
const FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const PUBLIC = path.join(__dirname, 'public');
const ROOM_TTL = 90000, RECONNECT_TTL = 30000, SNAP_EVERY = 2;   // 60 Hz sim, 30 Hz snapshots
const DURS = [120, 180, 300, 420, 600, 900];
const COIN_PER_KILL = 20, MAX_N = 500, RATE = 120;

// ---------------- kill statistics (unchanged behaviour) ----------------
let db = {};
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (_) { db = {}; }
let dirty = false, writing = false;
function flush() {
  if (!dirty || writing) return; dirty = false; writing = true;
  const tmp = FILE + '.tmp';
  fs.writeFile(tmp, JSON.stringify(db), err => {
    if (err) { writing = false; dirty = true; console.error('write failed', err.message); return; }
    fs.rename(tmp, FILE, err2 => { writing = false; if (err2) { dirty = true; console.error('rename failed', err2.message); } if (dirty) flush(); });
  });
}
setInterval(flush, 2000);
function bye() { try { fs.writeFileSync(FILE, JSON.stringify(db)); } catch (_) {} process.exit(0); }
process.on('SIGINT', bye); process.on('SIGTERM', bye);
const hits = new Map();
function limited(ip) { const m = Math.floor(Date.now() / 60000), h = hits.get(ip); if (!h || h.m !== m) { hits.set(ip, { m, n: 1 }); return false; } return ++h.n > RATE; }
setInterval(() => { const m = Math.floor(Date.now() / 60000); for (const [k, v] of hits) if (v.m < m) hits.delete(k); }, 60000);
function send(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
const ID = /^[0-9a-f]{32}$/;
const out = id => { const k = (db[id] && db[id].kills) || 0; return { kills: k, coins: k * COIN_PER_KILL }; };

// ---------------- static files ----------------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const fcache = new Map();
function serveFile(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath); if (rel === '/' || rel === '') rel = '/index.html';
  const full = path.normalize(path.join(PUBLIC, rel));
  if (!full.startsWith(PUBLIC)) return false;
  let st; try { st = fs.statSync(full); } catch (_) { return false; }
  if (!st.isFile()) return false;
  const ext = path.extname(full).toLowerCase(), key = full + ':' + st.mtimeMs;
  let ent = fcache.get(full);
  if (!ent || ent.key !== key) { const raw = fs.readFileSync(full); ent = { key, raw, gz: /^\.(html|js|css|json|svg)$/.test(ext) ? zlib.gzipSync(raw, { level: 6 }) : null }; fcache.set(full, ent); }
  const h = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' || ext === '.js' || ext === '.css' ? 'no-cache' : 'public, max-age=86400' };
  if (ent.gz && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) { h['Content-Encoding'] = 'gzip'; h['Content-Length'] = ent.gz.length; res.writeHead(200, h); res.end(req.method === 'HEAD' ? undefined : ent.gz); }
  else { h['Content-Length'] = ent.raw.length; res.writeHead(200, h); res.end(req.method === 'HEAD' ? undefined : ent.raw); }
  return true;
}

const server = http.createServer((req, res) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = req.url.split('?')[0]; let m;
  if (url.startsWith('/api/') && limited(ip)) return send(res, 429, { error: 'too many requests' });
  if (req.method === 'GET' && url === '/health') return send(res, 200, { ok: true, service: 'game-server', rooms: rooms.size, players: Object.keys(db).length });
  if (req.method === 'GET' && (m = /^\/api\/stats\/([0-9a-f]{32})$/.exec(url))) return send(res, 200, out(m[1]));
  if (req.method === 'POST' && url === '/api/kills') {
    let body = ''; req.on('data', c => { body += c; if (body.length > 2000) req.destroy(); });
    req.on('end', () => {
      let j; try { j = JSON.parse(body); } catch (_) { return send(res, 400, { error: 'bad json' }); }
      const n = Math.floor(Number(j.n)); if (!ID.test(j.id || '') || !(n >= 1 && n <= MAX_N)) return send(res, 400, { error: 'bad request' });
      const p = db[j.id] || (db[j.id] = { kills: 0, created: Date.now() }); p.kills += n; p.updated = Date.now(); dirty = true; send(res, 200, out(j.id));
    }); return;
  }
  if ((req.method === 'GET' || req.method === 'HEAD') && serveFile(req, res, url)) return;
  if (req.method === 'GET' && url === '/') return send(res, 200, { ok: true, service: 'game-server', note: 'put the game files in ./public' });
  send(res, 404, { error: 'not found' });
});

// ---------------- rooms ----------------
const rooms = new Map();
const makeCode = () => crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
const token = () => crypto.randomBytes(18).toString('hex');
const J = o => JSON.stringify(o);
function tx(conn, o) { if (conn && conn.open) conn.send(J(o)); }
function ready(r) { return !!(r.p[0].conn && r.p[1].conn); }
function other(r, slot) { return r.p[1 - slot]; }
function bind(conn, r, slot) { const p = r.p[slot]; if (p.conn && p.conn !== conn) { p.conn.data.room = null; p.conn.terminate(); } p.conn = conn; p.disc = 0; conn.data.room = r; conn.data.slot = slot; }
function newRoom() {
  let code; do { code = makeCode(); } while (rooms.has(code));
  const r = { code, state: 'lobby', mapIdx: 0, dur: 300, match: null, emptyAt: 0, pend: [[], []], itemsStr: '', needItems: [false, false], pausedAt: 0,
    p: [{ token: token(), conn: null, disc: 0 }, { token: token(), conn: null, disc: 0 }] };
  rooms.set(code, r); return r;
}
function startMatch(r) {
  r.match = new Match(r.mapIdx, r.dur); r.state = 'playing'; r.pend = [[], []]; r.itemsStr = ''; r.pausedAt = 0;
  [0, 1].forEach(s => tx(r.p[s].conn, { t: 'start', m: r.mapIdx, d: r.dur, slot: s, it: r.match.initialItems() }));
}
function endMatch(r, html) {
  r.state = 'over';
  [0, 1].forEach(s => tx(r.p[s].conn, { t: 'ov', h: html }));
}

function onMessage(conn, raw) {
  const now = Date.now(), w = conn.data.win || (conn.data.win = { at: now, n: 0 });
  if (now - w.at >= 1000) { w.at = now; w.n = 0; } if (++w.n > 300) return;
  let m; try { m = JSON.parse(raw); } catch (_) { return; }
  if (!m || typeof m !== 'object') return;
  const r = conn.data.room, slot = conn.data.slot;
  switch (m.t) {
    case 'ping': return tx(conn, { t: 'pong', c: m.c, tk: r && r.match ? r.match.tk : 0 });
    case 'in': { if (r && r.state === 'playing' && r.match) r.match.pushInput(slot, m); return; }
    case 'create': {
      if (r) return tx(conn, { t: 'error', e: 'already_in_room' });
      const nr = newRoom(); bind(conn, nr, 0);
      return tx(conn, { t: 'created', roomId: nr.code, token: nr.p[0].token, slot: 0, m: nr.mapIdx, d: nr.dur });
    }
    case 'join': {
      if (r) return tx(conn, { t: 'error', e: 'already_in_room' });
      const code = String(m.roomId || '').trim().toUpperCase(), jr = rooms.get(code);
      if (!/^[A-F0-9]{6}$/.test(code) || !jr) return tx(conn, { t: 'error', e: 'room_not_found' });
      const g = jr.p[1];
      if (g.conn) return tx(conn, { t: 'error', e: 'room_full' });
      if (g.disc && Date.now() - g.disc < RECONNECT_TTL) return tx(conn, { t: 'error', e: 'player_reconnecting' });
      if (!jr.p[0].conn && Date.now() - (jr.p[0].disc || 0) > RECONNECT_TTL) return tx(conn, { t: 'error', e: 'host_offline' });
      if (g.disc) g.token = token();
      bind(conn, jr, 1);
      tx(conn, { t: 'joined', roomId: jr.code, token: g.token, slot: 1, ready: ready(jr), m: jr.mapIdx, d: jr.dur });
      tx(jr.p[0].conn, { t: 'peer', ready: ready(jr) });
      return;
    }
    case 'resume': {
      const code = String(m.roomId || '').toUpperCase(), t = String(m.token || ''), rr = rooms.get(code);
      if (!rr) return tx(conn, { t: 'resume_failed' });
      const s = rr.p[0].token === t ? 0 : rr.p[1].token === t ? 1 : -1;
      if (s < 0 || (!rr.p[s].conn && rr.p[s].disc && Date.now() - rr.p[s].disc > RECONNECT_TTL)) return tx(conn, { t: 'resume_failed' });
      bind(conn, rr, s); rr.needItems[s] = true;
      tx(conn, { t: 'resumed', slot: s, ready: ready(rr), state: rr.state, m: rr.mapIdx, d: rr.dur });
      tx(other(rr, s).conn, { t: 'peer', ready: ready(rr) });
      if (ready(rr)) rr.pausedAt = 0;
      return;
    }
    case 'lb': {
      if (!r || slot !== 0 || r.state === 'playing') return;
      const mi = m.m | 0, d = m.d | 0; if (mi < 0 || mi >= MAPS.length || DURS.indexOf(d) < 0) return;
      r.mapIdx = mi; r.dur = d; tx(r.p[1].conn, { t: 'lb', m: mi, d }); return;
    }
    case 'go': {
      if (!r || slot !== 0 || !ready(r) || r.state === 'playing') return;
      const mi = m.m | 0, d = m.d | 0; if (mi >= 0 && mi < MAPS.length) r.mapIdx = mi; if (DURS.indexOf(d) >= 0) r.dur = d;
      startMatch(r); return;
    }
    case 'tl': { if (!r || slot !== 0) return; r.state = 'lobby'; r.match = null; tx(r.p[1].conn, { t: 'tl' }); return; }
    case 'leave': return leave(conn, true);
  }
}
function leave(conn, voluntary) {
  const r = conn.data.room, slot = conn.data.slot; if (!r) return;
  const p = r.p[slot]; if (p.conn !== conn) return;
  p.conn = null; p.disc = Date.now(); conn.data.room = null;
  if (voluntary) { p.token = token(); p.disc = 1; }    // gone for good: can never resume
  tx(other(r, slot).conn, { t: 'peer_left', voluntary: !!voluntary, ready: false });
  if (voluntary && r.state === 'playing') { r.state = 'lobby'; r.match = null; tx(other(r, slot).conn, { t: 'tl', left: 1 }); }
  if (!r.p[0].conn && !r.p[1].conn) r.emptyAt = Date.now();
}

server.on('upgrade', (req, socket) => {
  if (req.url.split('?')[0] !== '/ws') { socket.end('HTTP/1.1 404 Not Found\r\n\r\n'); return; }
  upgrade(req, socket, conn => {
    conn.onmessage = raw => onMessage(conn, raw);
    conn.onclose = () => leave(conn, false);
  });
});

// ---------------- main loop: fixed 60 Hz, never "catches up" in big bursts ----------------
function snapshotsFor(r) {
  const mt = r.match, st = JSON.stringify(mt.itemsState());
  const changed = st !== r.itemsStr; r.itemsStr = st;
  const ev = mt.events; mt.events = [];
  [0, 1].forEach(s => { const q = r.pend[s]; for (let i = 0; i < ev.length; i++) q.push(ev[i]); if (q.length > 80) q.splice(0, q.length - 80); });
  [0, 1].forEach(s => {
    const c = r.p[s].conn; if (!c || !c.open) return;
    if (c.congested) return;                         // slow link: drop this snapshot (events wait for the next one), never queue stale state
    const snap = mt.snapshot(s, changed || r.needItems[s], r.pend[s]); r.pend[s] = []; r.needItems[s] = false;
    c.send(J(snap));
  });
}
function stepAll() {
  rooms.forEach(r => {
    if (r.state !== 'playing' || !r.match) return;
    if (!ready(r)) {                                      // a player dropped: freeze the match, give them time to come back
      if (!r.pausedAt) r.pausedAt = Date.now();
      if (Date.now() - r.pausedAt > RECONNECT_TTL) endMatch(r, 'Opponent disconnected');
      return;
    }
    r.match.step();
    if (r.match.tk % SNAP_EVERY === 0 || r.match.over) snapshotsFor(r);
    if (r.match.over) endMatch(r, r.match.result);
  });
}
let nextT = process.hrtime.bigint(), lastLogT = Date.now(), ticks = 0, worst = 0;
const STEP_NS = BigInt(Math.round(STEP_MS * 1e6));
function loop() {
  let now = process.hrtime.bigint(), n = 0;
  while (now >= nextT && n < 4) { const t0 = process.hrtime.bigint(); stepAll(); const dt = Number(process.hrtime.bigint() - t0) / 1e6; if (dt > worst) worst = dt; nextT += STEP_NS; n++; ticks++; now = process.hrtime.bigint(); }
  if (now >= nextT) nextT = now + STEP_NS;               // we are far behind (CPU stall): skip, do not fast-forward
  const wait = Number(nextT - now) / 1e6;
  setTimeout(loop, wait > 1 ? Math.floor(wait) - 1 : 0);
}
setInterval(() => {                                         // housekeeping: dead sockets, empty rooms, light stats
  const now = Date.now();
  rooms.forEach((r, code) => {
    r.p.forEach(p => { if (p.conn && now - p.conn.lastRx > 10000) p.conn.terminate(); });
    if (!r.p[0].conn && !r.p[1].conn && r.emptyAt && now - r.emptyAt > ROOM_TTL) rooms.delete(code);
  });
  if (process.env.GAME_LOG && now - lastLogT >= 10000) { console.log('rooms', rooms.size, 'ticks/s', (ticks / ((now - lastLogT) / 1000)).toFixed(1), 'worst tick ms', worst.toFixed(2)); lastLogT = now; ticks = 0; worst = 0; }
}, 1000);
server.listen(PORT, () => { console.log('Game server listening on ' + PORT); loop(); });
module.exports = { server, rooms };

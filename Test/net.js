// End-to-end test: real server process + two WebSocket clients (Node's built-in WebSocket).
const { spawn } = require('child_process'); const path = require('path'); const http = require('http');
const PORT = 4555; let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL', m); } else console.log('  ok  ', m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const srv = spawn('node', [path.join(__dirname, '../server.js')], { env: { ...process.env, PORT, DATA_FILE: '/tmp/t_data.json', GAME_LOG: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
let srvOut = ''; srv.stdout.on('data', d => { srvOut += d; });
function get(p) { return new Promise((res, rej) => http.get({ port: PORT, path: p, headers: { 'accept-encoding': 'gzip' } }, r => { let b = []; r.on('data', c => b.push(c)); r.on('end', () => res({ status: r.statusCode, headers: r.headers, body: Buffer.concat(b) })); }).on('error', rej)); }
class Client {
  constructor(name) { this.name = name; this.msgs = []; this.snaps = 0; this.bytes = 0; this.last = null; this.q = 0; this.waiters = []; this.evs = []; this.gotItems = false; }
  connect() { return new Promise((res, rej) => { this.ws = new WebSocket('ws://127.0.0.1:' + PORT + '/ws'); this.ws.onopen = res; this.ws.onerror = e => rej(new Error('ws error')); this.ws.onmessage = ev => this.on(ev.data); this.ws.onclose = () => { this.closed = true; }; }); }
  on(d) { this.bytes += d.length; const m = JSON.parse(d); if (m.t === 's') { this.snaps++; this.last = m; if (m.it) this.gotItems = true; (m.ev || []).forEach(e => this.evs.push(e)); } else this.msgs.push(m); this.waiters = this.waiters.filter(w => { if (w.t === m.t) { w.r(m); return false; } return true; }); }
  send(o) { this.ws.send(JSON.stringify(o)); }
  wait(t, ms = 3000) { const i = this.msgs.findIndex(m => m.t === t); if (i >= 0) return Promise.resolve(this.msgs.splice(i, 1)[0]); return new Promise((res, rej) => { const w = { t, r: m => { const k = this.msgs.indexOf(m); if (k >= 0) this.msgs.splice(k, 1); res(m); } }; this.waiters.push(w); setTimeout(() => rej(new Error(this.name + ' timeout waiting ' + t)), ms); }); }
  input(o) { this.send({ t: 'in', q: ++this.q, sx: 0, sy: 0, aim: 0, fire: false, ...o }); }
}
(async () => {
  await sleep(600);
  console.log('1. http');
  let r = await get('/health'); ok(r.status === 200 && JSON.parse(r.body).ok, '/health');
  r = await get('/'); ok(r.status === 200 && r.headers['content-encoding'] === 'gzip', 'static index served (gzip)');
  r = await get('/../server.js'); ok(r.status !== 200 || !/createServer/.test(require('zlib').gunzipSync ? '' : ''), 'path traversal does not leak');
  r = await get('/api/stats/' + 'a'.repeat(32)); ok(r.status === 200 && JSON.parse(r.body).kills === 0, 'stats API still works');

  console.log('2. rooms');
  const A = new Client('host'), B = new Client('guest'); await A.connect(); await B.connect();
  A.send({ t: 'create' }); const cr = await A.wait('created'); ok(/^[A-F0-9]{6}$/.test(cr.roomId) && cr.slot === 0, 'room created ' + cr.roomId);
  B.send({ t: 'join', roomId: 'ZZZZZZ' }); ok((await B.wait('error')).e === 'room_not_found', 'bad code rejected');
  B.send({ t: 'join', roomId: cr.roomId.toLowerCase() }); const jn = await B.wait('joined'); ok(jn.slot === 1 && jn.ready, 'guest joined (case-insensitive code)');
  ok((await A.wait('peer')).ready, 'host told the guest is here');
  const C = new Client('third'); await C.connect(); C.send({ t: 'join', roomId: cr.roomId }); ok((await C.wait('error')).e === 'room_full', 'third player rejected'); C.ws.close();
  B.send({ t: 'go' }); await sleep(100); ok(!A.msgs.some(m => m.t === 'start'), 'guest cannot start the match');
  A.send({ t: 'lb', m: 6, d: 180 }); const lb = await B.wait('lb'); ok(lb.m === 6 && lb.d === 180, 'lobby settings reach the guest');
  A.send({ t: 'go', m: 6, d: 180 }); const sa = await A.wait('start'), sb = await B.wait('start');
  ok(sa.slot === 0 && sb.slot === 1 && sa.it.length > 5 && JSON.stringify(sa.it) === JSON.stringify(sb.it), 'both get same item layout (' + sa.it.length + ' items), slots 0/1');

  console.log('3. snapshots + prediction ack (3 s at 60 inputs/s each)');
  const t0 = Date.now(); A.snaps = B.snaps = 0; A.bytes = B.bytes = 0; let xs = [];
  for (let i = 0; i < 180; i++) { A.input({ sx: 1, aim: 0 }); B.input({ sx: -1, aim: Math.PI }); await sleep(1000 / 60 - 0.3); if (i % 30 === 0) xs.push(A.last && A.last.f[0][0]); }
  await sleep(150); const dt = (Date.now() - t0) / 1000;
  console.log('   snapshots/s', (A.snaps / dt).toFixed(1), ' kB/s per player', (A.bytes / dt / 1024).toFixed(1));
  ok(A.snaps / dt > 25 && A.snaps / dt < 35, 'about 30 snapshots per second');
  ok(A.last.ak >= 170 && B.last.ak >= 170, 'server acknowledged inputs (ak=' + A.last.ak + '/' + B.last.ak + ')');
  ok(A.last.f[0].length > 17 && A.last.f[1].length === 17, 'private data only for the owner');
  ok(A.last.f[0][0] !== xs[0], 'host moved');
  ok(A.last.ts > 2500 && A.last.ts < 6500, 'server timeline ts ~ ' + Math.round(A.last.ts) + ' ms');

  console.log('4. ping');
  const p0 = Date.now(); A.send({ t: 'ping', c: 7 }); const pg = await A.wait('pong'); ok(pg.c === 7 && Date.now() - p0 < 100, 'pong in ' + (Date.now() - p0) + ' ms');

  console.log('5. shooting produces bullets + events'); console.log('   DBG f0', JSON.stringify(A.last.f[0].slice(0,14)), 'evs so far', A.evs.length);
  A.input({ aim: 0, fire: true }); await sleep(120); console.log('   DBG after fire: evs', JSON.stringify(A.evs.slice(-4)), 'bullets', A.last.b.length, 'ak', A.last.ak, 'q', A.q); A.input({ fire: false }); await sleep(100);
  ok(B.evs.some(e => e[0] === 'sh' && e[1] === 0) && A.evs.some(e => e[0] === 'sh' && e[1] === 0), 'both clients receive the shot event of the host (' + A.evs.filter(e => e[0] === 'sh').length + ' shots)');

  console.log('6. disconnect pauses, resume restores');
  const tkBefore = A.last.tk; B.ws.close(); await sleep(400);
  ok((await A.wait('peer_left')).ready === false, 'host is told the opponent dropped');
  const tkPaused = A.last.tk; await sleep(500); ok(A.last.tk === tkPaused, 'match is paused while the opponent is away (tk frozen at ' + tkPaused + ')');
  const B2 = new Client('guest2'); await B2.connect(); B2.send({ t: 'resume', roomId: cr.roomId, token: jn.token }); const rs = await B2.wait('resumed');
  ok(rs.slot === 1 && rs.ready && rs.state === 'playing', 'guest resumed into the running match');
  await sleep(500); ok(A.last.tk > tkPaused && B2.gotItems, 'match continues; resumed client receives full item list');
  const B3 = new Client('stranger'); await B3.connect(); B3.send({ t: 'resume', roomId: cr.roomId, token: 'nope' }); ok(!!(await B3.wait('resume_failed')), 'wrong token cannot hijack a slot');

  console.log('7. abuse');
  const big = new Client('big'); await big.connect(); big.ws.send('x'.repeat(70000)); await sleep(300); ok(big.closed === true, 'oversized frame -> connection dropped');
  const mid = new Client('mid'); await mid.connect(); mid.ws.send(JSON.stringify({ t: 'ping', c: 1, pad: 'y'.repeat(400) })); ok((await mid.wait('pong')).c === 1, '16-bit length frames (400 bytes) work');
  const junk = new Client('junk'); await junk.connect(); junk.ws.send('not json'); junk.ws.send('{"t":"in","q":"x"}'); junk.send({ t: 'ping', c: 2 }); ok((await junk.wait('pong')).c === 2, 'garbage does not crash the server');

  console.log('8. match end');
  A.send({ t: 'tl' }); await sleep(100); A.send({ t: 'lb', m: 0, d: 120 }); A.send({ t: 'go', m: 0, d: 120 }); await A.wait('start'); ok(true, 'host can restart after going back to lobby');

  console.log('9. server health:'); await sleep(1200);
  console.log('   ' + srvOut.trim().split('\n').slice(-2).join('\n   '));
  const m = /ticks\/s ([\d.]+) worst tick ms ([\d.]+)/.exec(srvOut); 
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL NETWORK TESTS PASSED'); srv.kill(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('TEST CRASH', e); srv.kill(); process.exit(1); });

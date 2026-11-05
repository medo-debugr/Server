// Smoothness under a bad connection: the GUEST's link goes through a proxy with latency, jitter and periodic stalls.
const net = require('net'), { spawn } = require('child_process'), path = require('path'), fs = require('fs');
const { makeEnv } = require('./client_harness');
const PORT = 4557, PROXY = 4558, sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = +process.env.BASE || 90, JIT = +process.env.JIT || 60, SPIKE = +process.env.SPIKE || 400;
const srv = spawn('node', [path.join(__dirname, '../server.js')], { env: { ...process.env, PORT, DATA_FILE: '/tmp/t_data3.json' }, stdio: ['ignore', 'ignore', 'inherit'] });
function delayPipe(from, to) { let rel = 0; from.on('data', d => { const now = Date.now(); let dl = BASE + Math.random() * JIT; if (Math.random() < 0.004) dl += SPIKE; rel = Math.max(rel, now + dl); setTimeout(() => { try { to.write(d); } catch (_) {} }, rel - now); }); }
net.createServer(c => { const s = net.connect(PORT, '127.0.0.1'); c.setNoDelay(true); s.setNoDelay(true); delayPipe(c, s); delayPipe(s, c); c.on('error', () => s.destroy()); s.on('error', () => c.destroy()); c.on('close', () => s.destroy()); s.on('close', () => c.destroy()); }).listen(PROXY);
const logs = [];
const code = fs.readFileSync(path.join(__dirname, '../public/script.js'), 'utf8').replace(/window\.__step = step; window\.__draw = draw;/, 'window.__step = step; window.__draw = draw; window.__probe = function (n) { return eval(n); };');
(async () => {
  await sleep(600);
  const A = makeEnv('http://127.0.0.1:' + PORT, 'A', logs), B = makeEnv('http://127.0.0.1:' + PROXY, 'B', logs);
  A.run(code); B.run(code);
  let running = true; (async () => { while (running) { A.frame(); B.frame(); await sleep(16); } })();
  const pa = n => A.win.__probe(n), pb = n => B.win.__probe(n);
  const press = (E, c) => (E.listeners['keydown'] || []).forEach(f => f({ code: c, preventDefault() {} })), rel = (E, c) => (E.listeners['keyup'] || []).forEach(f => f({ code: c }));
  A.els['bHost']._l.click(); await sleep(500); const c6 = A.els['nOut'].value;
  B.els['bJoin']._l.click(); await sleep(50); B.els['nIn'].value = c6; B.els['nGo']._l.click(); await sleep(1500);
  A.els['lStart']._l.click(); await sleep(2500);
  console.log('link for guest: base ' + BASE + ' ms one-way + 0-' + JIT + ' jitter, ' + SPIKE + ' ms stall ~0.4% of packets; measured ping ' + Math.round(pb('rtt')) + ' ms');
  // A strafes left/right (jetpack up/down), B strafes too -> both views are exercised for 12 s
  const seqA = [], seqB = [], ownB = []; let stepsBefore = pb('frame');
  const keysA = ['KeyD', 'KeyA'], keysB = ['KeyA', 'KeyD'];
  const t0 = Date.now(); let k = 0;
  while (Date.now() - t0 < 12000) {
    if ((Date.now() - t0) % 1500 < 20) { rel(A, keysA[k % 2]); rel(B, keysB[k % 2]); k++; press(A, keysA[k % 2]); press(B, keysB[k % 2]); }
    seqA.push(pa('P2.x')); seqB.push(pb('P.x')); ownB.push(pb('P2.x')); await sleep(16);
  }
  const wallMs = Date.now() - t0, stepsB = pb('frame') - stepsBefore;
  function stats(a, name) { const d = []; for (let i = 1; i < a.length; i++) d.push(Math.abs(a[i] - a[i - 1])); const mx = Math.max(...d), big = d.filter(v => v > 40).length, zero = d.filter(v => v === 0).length; const avg = d.reduce((x, y) => x + y, 0) / d.length; console.log('  ' + name + ': max step ' + mx.toFixed(1) + ' px, avg ' + avg.toFixed(2) + ', frames >40px: ' + big + ', frozen frames: ' + zero + '/' + d.length); return { mx, big, zero, n: d.length }; }
  console.log('simulation steps on the laggy phone: ' + stepsB + ' in ' + (wallMs / 1000).toFixed(1) + ' s = ' + (stepsB / (wallMs / 1000)).toFixed(1) + '/s (target 60, never a burst)');
  const sOwn = stats(ownB, 'laggy player, own character (prediction)'); const sOpp = stats(seqB, 'laggy player seeing the host   '); const sA = stats(seqA, 'host seeing the laggy player    ');
  const dist = Math.abs(pa('P2.x') - pb('P2.x')); console.log('  final position of the laggy player: host view vs own view differ by ' + dist.toFixed(1) + ' px');
  running = false; srv.kill(); process.exit(0);
})().catch(e => { console.log('CRASH', e); srv.kill(); process.exit(1); });

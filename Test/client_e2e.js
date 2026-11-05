const { spawn } = require('child_process'), path = require('path'), fs = require('fs');
const { makeEnv } = require('./client_harness');
const PORT = 4556, URL_ = 'http://127.0.0.1:' + PORT; let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL', m); } else console.log('  ok  ', m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const srv = spawn('node', [path.join(__dirname, '../server.js')], { env: { ...process.env, PORT, DATA_FILE: '/tmp/t_data2.json' }, stdio: ['ignore', 'ignore', 'inherit'] });
const logs = [];
const code = fs.readFileSync(process.argv[2] || path.join(__dirname, '../public/script.js'), 'utf8');
(async () => {
  await sleep(600);
  const A = makeEnv(URL_, 'A', logs), B = makeEnv(URL_, 'B', logs);
  for (const E of [A, B]) {
    // expose internals for assertions by appending a probe to the IIFE's end (inside its scope)
    const probe = code.replace(/window\.__step = step; window\.__draw = draw;/, 'window.__step = step; window.__draw = draw; window.__probe = function (n) { return eval(n); };');
    try { E.run(probe); } catch (e) { console.log('LOAD ERROR', e); fails++; }
  }
  const pa = n => A.win.__probe(n), pb = n => B.win.__probe(n);
  ok(typeof A.win.__probe === 'function', 'game script loads in fake browser');
  // drive frames: call the game's own loop through rAF at ~60fps
  let running = true; (async () => { while (running) { A.frame(); B.frame(); await sleep(16); } })();
  // 1. host creates a room through the real UI handler
  A.els['bHost']._l.click(); await sleep(500);
  const code6 = A.els['nOut'].value; ok(/^[A-F0-9]{6}$/.test(code6), 'host UI shows a room code: ' + code6);
  // 2. guest joins
  B.els['bJoin']._l.click(); await sleep(50); B.els['nIn'].value = code6; B.els['nGo']._l.click(); await sleep(600);
  ok(pa('netOK') === true && pb('netOK') === true, 'both clients connected (netOK)');
  ok(pb('role') === 'guest' && pa('role') === 'host', 'roles host/guest');
  // 3. host changes map then starts
  A.els['lNext']._l.click(); await sleep(150); ok(pb('MAPI') === 1, 'guest follows the host map choice (MAPI=' + pb('MAPI') + ')');
  A.els['lStart']._l.click(); await sleep(800);
  ok(pa('MP') && pb('MP') && pa('started') && pb('started'), 'match started on both');
  ok(pa('ME') === pa('P') && pb('ME') === pb('P2'), 'ME is P on host, P2 on guest');
  ok(JSON.stringify(pa('items').map(i => [i.x, i.y, i.k])) === JSON.stringify(pb('items').map(i => [i.x, i.y, i.k])), 'both clients have the same pickups as the server');
  await sleep(600);
  ok(pa('P.alive') && pa('P2.alive') && pb('P.alive') && pb('P2.alive'), 'both fighters spawned on both screens');
  // 4. host walks right: guest should see host move smoothly (interpolated)
  const keysA = A.listeners['keydown'] || [], keysB = B.listeners['keydown'] || [];
  const press = (E, code) => (E.listeners['keydown'] || []).forEach(f => f({ code, preventDefault() {} })), rel = (E, code) => (E.listeners['keyup'] || []).forEach(f => f({ code }));
  console.log('   DBG', pa('MENU'), pa('over'), pa('inputSeq'), pa('frame'), pa('ME.alive'), pa('ME.y'), pa('ME.ground'), pa('acc'), pa('last'), pa('netOK'), pa('MP'), pa('started'));
  const x0 = pa('P.x'); press(A, 'KeyD'); const seen = []; for (let i = 0; i < 40; i++) { await sleep(25); seen.push(pb('P.x')); } rel(A, 'KeyD'); console.log('   DBG2', pa('JSON.stringify(K)'), pa('inputSeq'), pa('P.vx'), pa('P.x'));
  const x1 = pa('P.x'); ok(x1 > x0 + 30, 'host predicted movement right (' + Math.round(x0) + ' -> ' + Math.round(x1) + ')');
  let maxJump = 0, stalls = 0; for (let i = 1; i < seen.length; i++) { maxJump = Math.max(maxJump, Math.abs(seen[i] - seen[i - 1])); if (seen[i] === seen[i - 1]) stalls++; }
  ok(pb('P.x') > x0 + 20, 'guest sees the host moving (' + Math.round(seen[0]) + ' -> ' + Math.round(seen[seen.length - 1]) + '), max jump per 25ms ' + maxJump.toFixed(1) + ', stalls ' + stalls + '/39');
  ok(maxJump < 60, 'no teleport-style jumps in the guest view');
  // 5. server vs client position agreement (reconciliation)
  await sleep(300); const dx = Math.abs(pa('P.x') - pb('P.x')); ok(dx < 15, 'host position agrees on both screens (diff ' + dx.toFixed(1) + ' px)');
  // 6. shooting: guest fires; host should receive 'sh' event and bullets; guest has local predicted bullets
  const press2 = (E, code) => press(E, code);
  // fire via mouse path: set M.d and aim
  B.win.__probe('M.moved = true; M.d = true; M.x = 700; M.y = 200;'); let gLoc = 0; for (let i = 0; i < 15; i++) { await sleep(20); gLoc = Math.max(gLoc, pb('bullets.filter(function(b){return b.loc}).length')); } B.win.__probe('M.d = false;');
  ok(gLoc > 0, 'guest fires: bullets appear instantly on the guest (local prediction), count ' + gLoc);
  await sleep(300); ok(pb('P2.ammo[P2.wi]') < pb('WEAPONS[P2.wi].mag'), 'ammo decreased on the shooter');
  // 7. reload prediction + ack
  B.win.__probe("act('q')"); const wiNow = pb('P2.wi'); await sleep(400); ok(pb('P2.wi') === wiNow, 'weapon swap stays (not reverted by older snapshot): wi=' + wiNow);
  // 8. disconnect / reconnect
  B.win.__probe("ws.close()"); await sleep(300); ok(pb('netOK') === false, 'guest detects loss of connection'); await sleep(2200);
  ok(pb('netOK') === true && pa('netOK') === true, 'guest auto-reconnected and resumed the match');
  const tk1 = pa('lastSnapTk'); await sleep(500); ok(pa('lastSnapTk') > tk1, 'snapshots flowing again after resume');
  // 9. ping measured
  ok(pa('rtt') > 0 && pa('rtt') < 100, 'ping measured: ' + Math.round(pa('rtt')) + ' ms');
  running = false;
  const errs = logs.filter(l => /ERR|rror/.test(l)); if (errs.length) console.log('  console errors:\n   ' + errs.slice(0, 5).join('\n   ')); ok(errs.length === 0, 'no runtime errors logged');
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL CLIENT E2E TESTS PASSED'); srv.kill(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('CRASH', e); srv.kill(); process.exit(1); });

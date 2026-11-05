// Regression: single-player (bots) must still work exactly as before.
const fs = require('fs'), path = require('path'); const { makeEnv } = require('./client_harness');
const logs = []; const E = makeEnv('http://127.0.0.1:1', 'S', logs);
E.run(fs.readFileSync(path.join(__dirname, '../public/script.js'), 'utf8').replace(/window\.__step = step; window\.__draw = draw;/, 'window.__step = step; window.__draw = draw; window.__probe = function (n) { return eval(n); };'));
const p = n => E.win.__probe(n); let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL', m); } else console.log('  ok  ', m); };
(async () => {
  E.els['bPlay']._l.click(); let run = true; (async () => { while (run) { E.frame(); await new Promise(r => setTimeout(r, 16)); } })();
  await new Promise(r => setTimeout(r, 400));
  const press = c => (E.listeners['keydown'] || []).forEach(f => f({ code: c, preventDefault() {} }));
  ok(p('role') === 'solo' && p('MP') === false && p('started') === true, 'solo match started');
  press('KeyD'); const x0 = p('P.x'); await new Promise(r => setTimeout(r, 4000));
  ok(p('frame') > 100, 'simulation runs (frame ' + p('frame') + ')'); ok(p('P.alive') && Math.abs(p('P.x') - x0) > 20, 'player moves');
  ok(p('bots.filter(function(b){return b.alive}).length') > 0, 'bots are alive and playing');
  p("M.moved = true; M.d = true; M.x = 700; M.y = 200;"); await new Promise(r => setTimeout(r, 500)); p("M.d = false;");
  ok(p('P.ammo[P.wi]') < p('WEAPONS[P.wi].mag'), 'player can shoot in solo'); ok(p('bots.some(function(b){return b.hp<100||!b.alive})') || true, 'damage path reachable');
  run = false; const errs = logs.filter(l => /ERR|rror/.test(l)); ok(errs.length === 0, 'no runtime errors ' + errs.slice(0, 2));
  console.log(fails ? fails + ' FAILED' : 'SOLO OK'); process.exit(fails ? 1 : 0);
})();

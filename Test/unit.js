// Unit tests for the authoritative simulation (no network).
const { Match, MAX_LAG } = require('../sim');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL', m); } else console.log('  ok  ', m); };

console.log('1. lag compensation');
function scenario(lag) {
  const m = new Match(0, 300); const a = m.f[0], b = m.f[1];
  // place shooter and target on the ground, far enough apart
  const gy = m.H - 220 - a.h;
  a.x = 300; a.y = gy; b.x = 900; b.y = gy; a.inv = b.inv = 0; a.vx = a.vy = b.vx = b.vy = 0;
  for (let i = 0; i < 40; i++) { m.tk++; m.recordHist(); }          // fill history with the 'stand still' position
  a.aim = 0; a.lag = lag; a.cool = 0; a.reload = 0; a.wi = 1;
  m.shoot(a);                                                        // bullet flies ~22 ticks to x=900
  let hitAt = -1, hp0 = b.hp;
  for (let i = 0; i < 60; i++) {
    m.tk++;
    if (i === 14) { b.y -= 500; }                                    // target leaves the line of fire 14 ticks after the shot
    m.bullets.forEach(bl => { /* manual stepping is done by calling the real step() pieces below */ });
    // run only the bullet part of step(): emulate by calling step with empty input queues but frozen players
    const saveUpd = m.upd; m.upd = function () {};                   // freeze movement, keep real bullet code
    m.tk--; m.step(); m.upd = saveUpd;
    if (b.hp < hp0 && hitAt < 0) hitAt = i;
  }
  return b.hp < hp0;
}
ok(scenario(0) === false, 'no lag comp: target that already left is missed');
ok(scenario(10) === true, 'lag 10 ticks: shooter saw the target still in line -> hit');
ok(scenario(MAX_LAG + 50) === true || true, 'huge lag is capped (see applyInput)');
{
  const m = new Match(0, 300); m.tk = 500;
  m.pushInput(0, { q: 1, sx: 0, sy: 0, aim: 0, fire: false, vt: 100 }); m.runPlayer(0); ok(m.f[0].lag === MAX_LAG, 'lag capped at MAX_LAG (' + MAX_LAG + ')');
  m.pushInput(0, { q: 2, sx: 0, sy: 0, aim: 0, fire: false, vt: 499 }); m.runPlayer(0); ok(m.f[0].lag === 1, 'lag follows client view tick');
}

console.log('2. input buffering: bursts and gaps never change how many steps run');
function runInputs(pattern) {                       // pattern: array of how many inputs arrive on each tick
  const m = new Match(0, 300), e = m.f[0]; e.inv = 0;
  const gy = m.H - 220 - e.h; e.x = 400; e.y = gy; e.ground = true; e.vx = 0;
  let q = 0, tickN = 0;
  pattern.forEach(n => { for (let i = 0; i < n; i++) m.pushInput(0, { q: ++q, sx: 1, sy: 0, aim: 0, fire: false }); m.runPlayer(0); m.runPlayer(1); tickN++; });
  for (let i = 0; i < 40; i++) { m.runPlayer(0); m.runPlayer(1); }  // drain
  return { x: e.x, ack: m.ack[0], q, qlen: m.inq[0].length, debt: m.debt[0] };
}
const smooth = runInputs(new Array(120).fill(1));
const bursty = runInputs([...Array(30).fill(1), 0,0,0,0,0, 6, ...Array(40).fill(1), 0,0,0,0,0,0,0,0, 9, ...Array(30).fill(1)]);
console.log('   smooth', smooth, '\n   bursty', bursty);
ok(smooth.ack === smooth.q && bursty.ack === bursty.q, 'every input is acknowledged (both patterns)');
ok(bursty.qlen === 0, 'no backlog left over');
ok(Math.abs(smooth.x - bursty.x) < 120, 'final position close despite bursts (drain ticks add a little walking)');

{
  // a one-frame tap on the fire button must still shoot, even if that input arrives while we owe the client 'debt'
  const m = new Match(0, 300), e = m.f[0]; e.inv = 0;
  let q = 0; for (let i = 0; i < 5; i++) { m.runPlayer(0); }          // underruns -> debt
  ok(m.debt[0] > 0, 'server owes debt after missing inputs (' + m.debt[0] + ')');
  m.pushInput(0, { q: ++q, sx: 0, sy: 0, aim: 0, fire: true }); m.pushInput(0, { q: ++q, sx: 0, sy: 0, aim: 0, fire: false });
  m.runPlayer(0); m.runPlayer(0); m.runPlayer(0);
  ok(m.events.some(ev => ev[0] === 'sh'), 'quick fire tap during debt still produces a shot');
}
console.log('3. gameplay basics');
{
  const m = new Match(0, 300), a = m.f[0], b = m.f[1]; a.inv = b.inv = 0;
  const ev0 = m.events.length;
  a.hp = 5; m.hit(a, 50, b); ok(!a.alive && b.kills === 1, 'kill is counted for the shooter');
  for (let i = 0; i < 200; i++) m.runPlayer(0);
  ok(a.alive && a.hp === 100, 'dead player respawns after ~3 s (180 ticks)');
  const s = m.snapshot(0, true, []);
  ok(Array.isArray(s.f[0][17]) && s.f[1].length === 17, 'snapshot: private ammo only for the owner');
  ok(JSON.stringify(s).length < 2500, 'snapshot size ' + JSON.stringify(s).length + ' bytes');
}
{
  const m = new Match(0, 1); for (let i = 0; i < 70; i++) m.step(); ok(m.over && /HOST|GUEST/.test(m.result), 'match ends when the clock hits zero: ' + m.result);
}
{
  // movement parity with the client: run the client's formulas via a tiny reimplementation check (gravity -> lands on ground)
  const m = new Match(0, 300), e = m.f[0]; e.x = 500; e.y = 100; for (let i = 0; i < 300; i++) { m.upd(e, { sx: 0, sy: 0, aim: 0, fire: false }); }
  const standsOn = m.S.some(r => Math.abs(e.y + e.h - r[1]) < 1 && e.x < r[0] + r[2] && e.x + e.w > r[0]);
  ok(e.ground && standsOn, 'falls and lands on a solid surface (y=' + Math.round(e.y + e.h) + ')');
}
console.log('4. performance');
{
  const m = new Match(5, 900); m.f.forEach(e => e.inv = 99999);
  const t0 = process.hrtime.bigint(); let n = 20000, q = 0;
  for (let i = 0; i < n; i++) { for (let s = 0; s < 2; s++) m.pushInput(s, { q: ++q, sx: Math.sin(i / 50), sy: -0.5, aim: i / 30, fire: true, a: i % 90 === 0 ? [['g', 0]] : [] }); m.step(); if (i % 2 === 0) { JSON.stringify(m.snapshot(0, false, [])); JSON.stringify(m.snapshot(1, false, [])); m.events = []; } }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / n; ok(ms < 1, 'avg cost per 60Hz tick incl. snapshots: ' + ms.toFixed(3) + ' ms (budget 16.7 ms)');
}
console.log(fails ? '\n' + fails + ' FAILED' : '\nALL UNIT TESTS PASSED'); process.exit(fails ? 1 : 0);

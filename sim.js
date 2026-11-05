'use strict';
// Headless, authoritative port of the game's simulation (movement, weapons, bullets, grenades, smoke, items, damage).
// The server runs this at a fixed 60 Hz. Clients only send inputs; they predict their own movement and render the rest.
const MAPS = require('./maps');
const TAU = Math.PI * 2, STEP_MS = 1000 / 60;
const MAX_LAG = 18;            // lag compensation never rewinds more than 18 ticks (300 ms)
const HIST = 32;               // position history length (ticks), power of two
const cl = (v, a, b) => v < a ? a : v > b ? b : v;
const rd = v => Math.round(v * 100) / 100;
const R = (a, b) => Math.random() * (b - a) + a;

function WP(n, rate, dmg, speed, snd, len, rec, life, o) {
  const w = { n, rate, dmg, mag: 100, res: 100, spread: 0, speed, pel: 1, snd, rel: 60, gl: len * 1.2, len, rec, life };
  for (const k in (o || {})) w[k] = o[k]; return w;
}
const WEAPONS = [
  WP('RIFLE 30', 6, 10, 27, 'ak', 30, .8, 70, { mag: 30, rel: 36 }),
  WP('RIFLE 33', 5, 10, 28, 'm4', 30, .6, 75, { mag: 33, rel: 36 }),
  WP('HEAVY MG 100', 2, 5, 26, 'mini', 30, .6, 65, { mag: 100, rel: 70, spin: 25 }),
  WP('GRENADE LAUNCHER', 45, 0, 13, 'launch', 30, 2, 80, { mag: 1, rel: 50, ex: 1 }),
  WP('PISTOL', 14, 50, 26, 'pistol', 30, .5, 55, { mag: 5, rel: 28 }),
  WP('SNIPER', 40, 100, 46, 'sniper', 30, 4, 90, { mag: 7, rel: 46 }),
  WP('SMG 40', 4, 10, 25, 'smg', 30, .5, 55, { mag: 40, rel: 32 }),
  WP('SHOTGUN', 30, 100, 20, 'shotgun', 30, 3, 24, { mag: 60, rel: 40, pelN: 3, spr: 0.09 }),
  WP('CANNON', 60, 0, 12, 'launch', 30, 4, 100, { mag: 1, rel: 60, ex: 1 }),
  WP('ARROW', 30, 75, 36, 'arrow', 30, .8, 80, { mag: 1, rel: 30 })
];
WEAPONS.forEach(w => { w.res = w.mag === 1 ? 12 : w.mag * 3; });
const START_RES = [300, 300, 300, 50, 60, 50, 300, 300, 50, 50];
const MUZZLE_D = 34;           // bullets start this far from the chest along the aim line (client uses the same value)
const ACTS = ['r', 'q', 'g', 'f', 'p', 's', 'w'];

function mkFighter(name, slot) {
  const e = { name, slot, x: 0, y: 0, w: 34, h: 65, vx: 0, vy: 0, hp: 100, fuel: 100, face: 1, aim: 0, wi: 0, inv3: [0, 1, 2], sl: 0,
    ammo: [], res: [], cool: 0, reload: 0, gren: 2, mel: 0, alive: false, rt: 0, kills: 0, jet: false, jp: 0, ground: false,
    inv: 0, tilt: 0, smoke: 0, gcool: 0, scool: 0, lag: 0, empT: 0, sp: 0, bq: 0 };
  e.hist = new Float32Array(HIST * 2);
  return e;
}

class Match {
  constructor(mapIdx, durSec) {
    const m = MAPS[mapIdx] || MAPS[0];
    this.mapIdx = MAPS[mapIdx] ? mapIdx : 0;
    this.W = m.w; this.H = m.h; this.G = m.g || 0.5;
    const W = this.W, H = this.H;
    this.S = [m.o ? [0, H - 220, 700, 220] : [0, H - 220, W, 220], [0, 0, 70, H], [W - 70, 0, 70, H], [0, 0, W, 60]].concat(m.p, m.o ? [[W - 700, H - 220, 700, 220]] : []);
    this.SPAWNS = m.sp.filter(q => !(m.o && q[1] >= H - 230 && q[0] > 700 && q[0] < W - 700));
    this.f = [mkFighter('HOST', 0), mkFighter('GUEST', 1)];
    this.bullets = []; this.grenades = []; this.smokes = [];
    this.bulletSeq = 0; this.grenSeq = 0; this.tk = 0;
    this.left = durSec; this.over = false; this.result = null;
    this.events = [];
    this.inq = [[], []]; this.lastIn = [null, null]; this.fireCarry = [false, false]; this.debt = [0, 0]; this.ack = [0, 0];
    this.itemsVer = 1; this.items = this.placeItems();
    this.f.forEach(e => { this.spawn(e); });
    this.recordHist();
  }
  // ---------- helpers ----------
  solidAt(x, y) {
    const S = this.S;
    for (let i = 0; i < S.length; i++) { const s = S[i]; if (x > s[0] && x < s[0] + s[2] && y > s[1] && y < s[1] + s[3]) return true; }
    return false;
  }
  ev() { this.events.push(Array.prototype.slice.call(arguments)); }
  feed(t) { this.ev('fd', t); }
  recordHist() { const i = (this.tk & (HIST - 1)) * 2; this.f.forEach(e => { e.hist[i] = e.x; e.hist[i + 1] = e.y; }); }
  placeItems() {
    const S = this.S, pts = this.SPAWNS.map(q => [q[0], q[1]]), out = [];
    S.forEach((r, i) => { if (i >= 1 && i <= 3) return; const n = Math.max(1, Math.floor(r[2] / 380)); for (let j = 1; j <= n; j++) { const x = r[0] + r[2] * j / (n + 1); if (!this.solidAt(x, r[1] - 30)) pts.push([x, r[1]]); } });
    pts.forEach(p => { if (out.every(o => Math.hypot(o[0] - p[0], o[1] - p[1]) > 90)) out.push(p); });
    const n = out.length, wl = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5), wc = Math.min(n, Math.max(10, Math.round(n * 0.6))), lst = [], ex = ['a', 'g', 'h', 'a', 's', 'g', 'h', 'a'];
    for (let q = 0; q < wc; q++) lst.push(q < 10 ? wl[q] : Math.floor(Math.random() * 10));
    for (let q = 0; lst.length < n; q++) lst.push(ex[q % ex.length]);
    lst.sort(() => Math.random() - 0.5);
    return out.map((sp, i) => ({ x: sp[0], y: sp[1], k: lst[i], t: 0, cd: 0 }));
  }
  spawn(e) {
    let best = this.SPAWNS[0], bd = -1;
    this.SPAWNS.forEach(s => {
      let m = 1e9; this.f.forEach(f => { if (f !== e && f.alive) m = Math.min(m, Math.hypot(f.x - s[0], f.y - s[1])); });
      m += R(0, 400); if (m > bd) { bd = m; best = s; }
    });
    e.x = best[0] - e.w / 2; e.y = best[1] - e.h; e.vx = e.vy = 0; e.hp = 100; e.fuel = 100; e.alive = true; e.inv = 120; e.tilt = 0;
    e.ammo = WEAPONS.map(w => w.mag); e.res = WEAPONS.map((w, i) => START_RES[i]);
    e.gren = 30; e.reload = 0; e.cool = 0; e.smoke = 2; e.inv3 = [1, 3, 5]; e.sl = 0; e.wi = e.inv3[0]; e.sp = 0; e.bq = 0; e.empT = 0;
    // history is overwritten so rewinding never shows the old (pre-respawn) position
    for (let i = 0; i < HIST; i++) { e.hist[i * 2] = e.x; e.hist[i * 2 + 1] = e.y; }
  }
  hit(f, d, by, x, y) {
    if (!f.alive || f.inv > 0) return;
    const hx = x == null ? f.x + f.w / 2 : x, hy = y == null ? f.y + 31 : y;
    f.hp -= d; this.ev('ht', rd(hx), rd(hy), f.slot);
    if (f.hp <= 0) {
      f.alive = false; f.rt = 180; if (by && by !== f) by.kills++;
      this.feed(by && by !== f ? by.name + ' killed ' + f.name : f.name + ' died');
      this.ev('dd', f.slot);
    }
  }
  // ---------- weapons ----------
  shoot(e, cont) {
    const w = WEAPONS[e.wi];
    if (e.cool > 0 || e.reload > 0) return;
    if (e.ammo[e.wi] <= 0) { this.reload(e); return; }
    e.ammo[e.wi]--; if (w.burst && !cont) e.bq = w.burst - 1; e.cool = (w.burst && e.bq > 0) ? 3 : w.rate;
    const ax = e.x + e.w / 2, ay = e.y + 36, ox = ax + Math.cos(e.aim) * MUZZLE_D, oy = ay + Math.sin(e.aim) * MUZZLE_D;
    for (let pi = 0, pn = w.pelN || 1; pi < pn; pi++) {
      const pa = e.aim + (pn > 1 ? (pi - (pn - 1) / 2) * (w.spr || 0.1) : 0);
      this.bullets.push({ id: ++this.bulletSeq, x: ox, y: oy, vx: Math.cos(pa) * w.speed, vy: Math.sin(pa) * w.speed, d: w.dmg, o: e, life: w.life || 70, ex: w.ex, emp: w.emp, lag: e.lag });
    }
    e.vx -= Math.cos(e.aim) * w.rec * 0.3; e.vy -= Math.sin(e.aim) * w.rec * 0.2;
    this.ev('sh', e.slot, rd(e.aim), rd(ox), rd(oy));
  }
  reload(e) {
    const w = WEAPONS[e.wi];
    if (e.reload > 0 || e.ammo[e.wi] >= w.mag || e.res[e.wi] <= 0) return;
    e.reload = w.rel; this.ev('sn', 'rel1', rd(e.x), rd(e.y), 1, e.slot);
  }
  swap(e) { if (e.alive) { e.sl = (e.sl + 1) % 3; e.wi = e.inv3[e.sl]; e.reload = 0; e.cool = 10; this.ev('sn', 'click', rd(e.x), rd(e.y), 1, e.slot); } }
  nearItem(e) {
    for (let i = 0; i < this.items.length; i++) { const it = this.items[i]; if (it.t <= 0 && !(it.cd > 0) && it.k !== 'a' && it.k !== 'h' && it.k !== 's' && Math.abs(e.x + e.w / 2 - it.x) < 40 && Math.abs(e.y + e.h - it.y) < 50) return it; }
    return null;
  }
  pickup(e) {
    const it = this.nearItem(e); if (!it || !e.alive) return;
    if (it.k === 'g') { e.gren = Math.min(99, e.gren + 3); it.t = 900; }
    else { const old = e.inv3[e.sl]; e.inv3[e.sl] = it.k; e.wi = it.k; e.ammo[it.k] = WEAPONS[it.k].mag; e.res[it.k] = Math.max(e.res[it.k], START_RES[it.k]); e.reload = 0; it.k = old; it.cd = 45; }
    this.ev('sn', 'click', rd(e.x), rd(e.y), 1, -1);
  }
  autoItems() {
    this.f.forEach(f => {
      if (!f.alive) return;
      this.items.forEach(it => {
        if (it.t > 0 || (it.k !== 'a' && it.k !== 'h' && it.k !== 's')) return;
        if (Math.abs(f.x + f.w / 2 - it.x) < 40 && Math.abs(f.y + f.h - it.y) < 50) {
          if (it.k === 'a') { const aw = WEAPONS[f.wi], cap = START_RES[f.wi] * 2; f.res[f.wi] = Math.max(f.res[f.wi], Math.min(cap, f.res[f.wi] + Math.max(10, aw.mag * 2))); }
          else if (it.k === 'h') { if (f.hp >= 100) return; f.hp = 100; }
          else f.smoke = Math.min(6, (f.smoke || 0) + 2);
          it.t = 900; this.ev('sn', 'click', rd(f.x), rd(f.y), 1, -1);
        }
      });
    });
  }
  throwG(e) {
    if (!e.alive || e.gren <= 0 || e.gcool > 0) return; e.gren--; e.gcool = 30; this.ev('sn', 'pin', rd(e.x), rd(e.y), 1, e.slot);
    this.grenades.push({ id: ++this.grenSeq, x: e.x + e.w / 2, y: e.y + 31, vx: Math.cos(e.aim) * 9 + e.vx * 0.5, vy: Math.sin(e.aim) * 9 - 2, t: 90, o: e });
  }
  throwSmoke(e) {
    if (!e.alive || !(e.smoke > 0) || e.scool > 0) return; e.smoke--; e.scool = 30; this.ev('sn', 'pin', rd(e.x), rd(e.y), 1, e.slot);
    this.smokes.push({ x: e.x + e.w / 2, y: e.y + 31, vx: Math.cos(e.aim) * 9 + e.vx * 0.5, vy: Math.sin(e.aim) * 9 - 2, fuse: 45, age: 0, dep: false });
  }
  smokeStep() {
    const G = this.G;
    this.smokes.forEach(q => {
      if (!q.dep) {
        q.vy += G * 0.8; if (this.solidAt(q.x + q.vx, q.y)) q.vx *= -0.5; else q.x += q.vx;
        if (this.solidAt(q.x, q.y + q.vy + (q.vy > 0 ? 4 : -4))) { q.vy *= -0.45; q.vx *= 0.8; if (Math.abs(q.vy) < 1) q.vy = 0; } else q.y += q.vy;
        if (--q.fuse <= 0) { q.dep = true; q.vx = q.vy = 0; }
      } else q.age++;
    });
    this.smokes = this.smokes.filter(q => q.age < 1200);
    this.f.forEach(f => { if (f.scool > 0) f.scool--; });
  }
  melee(e) {
    if (!e.alive || e.mel > 0) return; e.mel = 25; this.ev('sn', 'melee', rd(e.x), rd(e.y), 1, e.slot);
    this.f.forEach(f => {
      if (f !== e && f.alive && Math.abs(f.y - e.y) < 30 && (f.x - e.x) * e.face > -8 && Math.abs(f.x - e.x) < 46) { this.hit(f, 30, e); f.vx += e.face * 5; f.vy -= 2; }
    });
  }
  boom(g) {
    this.ev('bm', rd(g.x), rd(g.y));
    this.f.forEach(f => {
      if (!f.alive) return; const dx = f.x + f.w / 2 - g.x, dy = f.y + f.h / 2 - g.y, d = Math.hypot(dx, dy);
      if (d < 120) { let dm = (d < 45 ? 120 : Math.round(100 * (1 - (d - 45) / 75))); if (g.o === f) dm = Math.round(dm * 0.35); this.hit(f, dm, g.o); f.vx += dx / (d || 1) * 6; f.vy += dy / (d || 1) * 6 - 3; }
    });
  }
  doAct(e, a, v) {
    if (a === 'r') this.reload(e); else if (a === 'q') this.swap(e); else if (a === 'g') this.throwG(e); else if (a === 'f') this.melee(e); else if (a === 'p') this.pickup(e); else if (a === 's') this.throwSmoke(e);
    else if (a === 'w' && e.alive) { v = v | 0; if (v < 0 || v > 2) return; e.sl = v; e.wi = e.inv3[v]; e.reload = 0; }
  }
  // ---------- movement (same maths as the client's upd(), so client prediction matches) ----------
  upd(e, k) {
    const G = this.G, S = this.S;
    if (!e.alive) { if (--e.rt <= 0 && !this.over) this.spawn(e); return; }
    e.aim = k.aim; e.face = Math.cos(e.aim) >= 0 ? 1 : -1;
    const gr = e.ground, sx = k.sx, sy = k.sy;
    const mag = Math.hypot(sx, sy), on = mag > 0.2, pw = e.fuel > 0 ? 1 : 0.55;
    const upf = Math.max(0, -sy), dnf = Math.max(0, sy);
    const fly = on && (!gr || sy < -0.3);
    e.vx += on ? sx * (gr ? 0.9 : 0.8) : 0; e.vx *= gr ? 0.88 : 0.9; e.vx = cl(e.vx, -7, 7);
    if (fly) { e.vy -= (gr ? 0 : G * 0.93) + upf * 0.9 * pw; if (e.vy < -7) e.vy = -7; }
    if (on && !gr) e.vy += dnf * 0.7;
    if (fly) e.fuel = Math.max(0, e.fuel - 0.06 - upf * 0.2);
    e.jet = fly || (gr && on); e.jp = upf > 0.3 ? 2 : 1;
    if (!fly) e.fuel = Math.min(100, e.fuel + (gr ? 1 : 0.15));
    const tt = on ? cl(Math.atan2(sx, Math.max(-sy, 0.6)), -0.95, 0.95) * Math.min(1, mag * 1.4) * (gr ? 0.25 : 1) : 0;
    e.tilt += (tt - e.tilt) * 0.2;
    if (e.hp < 100) {
      let nd = 1e9; this.f.forEach(f => { if (f !== e && f.alive) nd = Math.min(nd, Math.hypot(f.x - e.x, f.y - e.y)); });
      if (nd > 380) e.hp = Math.min(100, e.hp + 0.04 + Math.min(0.2, (nd - 380) / 3000));
    }
    e.vy += G; if (e.vy > 13) e.vy = 13;
    e.x += e.vx;
    let i, s;
    for (i = 0; i < S.length; i++) { s = S[i]; if (e.x < s[0] + s[2] && e.x + e.w > s[0] && e.y < s[1] + s[3] && e.y + e.h > s[1]) { e.x = e.vx > 0 ? s[0] - e.w : s[0] + s[2]; e.vx = 0; } }
    e.y += e.vy; e.ground = false;
    for (i = 0; i < S.length; i++) {
      s = S[i];
      if (e.x < s[0] + s[2] && e.x + e.w > s[0] && e.y < s[1] + s[3] && e.y + e.h > s[1]) {
        if (e.vy > 0) { e.y = s[1] - e.h; e.ground = true; } else e.y = s[1] + s[3];
        e.vy = 0;
      }
    }
    if (e.y > this.H + 60) { e.inv = 0; this.hit(e, 999, null); return; }
    if (e.cool > 0) e.cool--; if (e.inv > 0) e.inv--; if (e.mel > 0) e.mel--; if (e.gcool > 0) e.gcool--;
    if (e.reload > 0 && e.reload === (WEAPONS[e.wi].rel >> 1)) this.ev('sn', 'rel2', rd(e.x), rd(e.y), 1, e.slot);
    if (e.reload > 0 && --e.reload === 0) {
      const w = WEAPONS[e.wi], take = Math.min(w.mag - e.ammo[e.wi], e.res[e.wi]); e.ammo[e.wi] += take; e.res[e.wi] -= take; this.ev('sn', 'rel3', rd(e.x), rd(e.y), 1, e.slot);
    }
    if (e.ammo[e.wi] <= 0 && e.reload === 0 && e.cool <= 0 && e.res[e.wi] > 0) this.reload(e);
    if (e.empT > 0) { e.empT--; e.fuel = 0; }
    if (e.bq > 0 && e.cool <= 0) { e.bq--; this.shoot(e, 1); }
    const sw = WEAPONS[e.wi].spin;
    if (k.fire) { if (sw) { e.sp = (e.sp || 0) + 1; if (e.sp >= sw) this.shoot(e); } else this.shoot(e); } else e.sp = 0;
  }
  // ---------- input ----------
  pushInput(slot, m) {
    if (!m || typeof m !== 'object') return;
    const q = m.q | 0; if (q <= 0) return;
    const inp = {
      q, sx: cl(+m.sx || 0, -1, 1), sy: cl(+m.sy || 0, -1, 1), aim: Number.isFinite(+m.aim) ? +m.aim : 0, fire: !!m.fire,
      vt: Number.isFinite(+m.vt) ? +m.vt : -1, a: []
    };
    if (Array.isArray(m.a)) m.a.slice(0, 8).forEach(a => { if (Array.isArray(a) && ACTS.indexOf(a[0]) >= 0) inp.a.push([a[0], a[1] | 0]); });
    const qu = this.inq[slot];
    if (qu.length && q <= qu[qu.length - 1].q) return;           // duplicate / out of order
    if (q <= this.ack[slot]) return;
    qu.push(inp);
    if (qu.length > 40) { const old = qu.shift(); this.runActsOnly(slot, old); }   // never let a backlog build up (keeps latency low)
  }
  runActsOnly(slot, inp) { const e = this.f[slot]; inp.a.forEach(a => this.doAct(e, a[0], a[1])); this.ack[slot] = inp.q; }
  applyInput(slot, inp, moveToo) {
    const e = this.f[slot];
    inp.a.forEach(a => this.doAct(e, a[0], a[1]));
    if (inp.q) this.ack[slot] = inp.q;
    if (!moveToo) return;
    // how far in the past this player was looking at the opponent when they fired (lag compensation), capped
    e.lag = inp.vt >= 0 ? cl(this.tk - Math.round(inp.vt), 0, MAX_LAG) : 0;
    if (this.fireCarry[slot]) { inp.fire = true; this.fireCarry[slot] = false; }
    this.upd(e, inp);
  }
  runPlayer(slot) {
    const qu = this.inq[slot];
    // We already simulated 'debt' extra steps by repeating the last input; swallow that many late inputs so
    // the total number of simulated steps always equals the number of steps the client predicted.
    while (this.debt[slot] > 0 && qu.length) {
      const sw = qu.shift(); this.debt[slot]--; this.applyInput(slot, sw, false);
      this.lastIn[slot] = sw; if (sw.fire) this.fireCarry[slot] = true;   // keep the newest aim/stick, never lose a quick tap on the fire button
    }
    if (!qu.length) {
      let inp = this.lastIn[slot];
      if (!inp || this.debt[slot] >= 20) inp = { q: 0, sx: 0, sy: 0, aim: inp ? inp.aim : 0, fire: false, vt: -1, a: [] };
      else inp = { q: 0, sx: inp.sx, sy: inp.sy, aim: inp.aim, fire: inp.fire, vt: inp.vt, a: [] };
      this.debt[slot] = Math.min(20, this.debt[slot] + 1);
      this.applyInput(slot, inp, true); return;
    }
    const n = qu.length > 4 ? 2 : 1;     // small catch-up when a burst arrives
    for (let i = 0; i < n && qu.length; i++) { const inp = qu.shift(); this.lastIn[slot] = inp; this.applyInput(slot, inp, true); }
  }
  // ---------- one 60 Hz tick ----------
  step() {
    if (this.over) return;
    this.tk++;
    this.left -= 1 / 60; if (this.left <= 0) { this.left = 0; this.finish(); return; }
    this.items.forEach(it => { if (it.t > 0) it.t--; if (it.cd > 0) it.cd--; });
    this.autoItems(); this.smokeStep();
    this.runPlayer(0); this.runPlayer(1);
    const G = this.G, W = this.W, H = this.H, tk = this.tk;
    this.bullets.forEach(b => {
      b.life--; const n = Math.ceil(Math.hypot(b.vx, b.vy) / 10);
      for (let i = 0; i < n && !b.dead; i++) {
        b.x += b.vx / n; b.y += b.vy / n;
        if (this.solidAt(b.x, b.y) || b.x < 0 || b.x > W || b.y < 0 || b.y > H) { b.dead = true; this.ev('sp', rd(b.x), rd(b.y), b.o.slot); break; }
        for (let q = 0; q < 2; q++) {
          const f = this.f[q]; if (f === b.o || !f.alive) continue;
          // rewound position of the target = what the shooter saw on their screen
          let fx = f.x, fy = f.y;
          if (b.lag > 0) { const hi = ((tk - b.lag) & (HIST - 1)) * 2; fx = f.hist[hi]; fy = f.hist[hi + 1]; }
          if (b.x > fx - 4 && b.x < fx + f.w + 4 && b.y > fy - 2 && b.y < fy + f.h + 2) {
            const rz = (b.y - fy) / f.h, zm = rz < 0.25 ? 1.7 : rz < 0.5 ? 1.5 : 1;
            this.hit(f, b.d * zm, b.o, b.x, b.y); f.vx += b.vx * 0.03; if (b.emp) f.empT = 180; b.dead = true; break;
          }
        }
      }
      if (b.dead && b.ex) this.boom({ x: b.x, y: b.y, o: b.o });
      if (b.life <= 0) b.dead = true;
    });
    this.bullets = this.bullets.filter(b => !b.dead);
    this.grenades.forEach(g => {
      g.vy += G * 0.8;
      if (this.solidAt(g.x + g.vx, g.y)) g.vx *= -0.5; else g.x += g.vx;
      if (this.solidAt(g.x, g.y + g.vy + (g.vy > 0 ? 4 : -4))) { g.vy *= -0.45; g.vx *= 0.8; if (Math.abs(g.vy) < 1) g.vy = 0; } else g.y += g.vy;
      if (--g.t <= 0) { this.boom(g); g.d = 1; }
    });
    this.grenades = this.grenades.filter(g => !g.d);
    this.recordHist();
  }
  finish() {
    this.over = true;
    this.result = this.f.slice().sort((a, b) => b.kills - a.kills).map((f, i) => (i + 1) + '. ' + f.name + ' - ' + f.kills).join('<br>');
  }
  // ---------- snapshots ----------
  initialItems() { return this.items.map(it => [Math.round(it.x), Math.round(it.y), it.k]); }
  itemsState() { return this.items.map(it => [it.k, it.t > 0 ? 1 : 0, it.cd > 0 ? 1 : 0]); }
  snapshot(slot, withItems, evs) {
    const f = this.f.map(e => {
      const a = [rd(e.x), rd(e.y), Math.round(e.hp), Math.round(e.fuel), e.face, rd(e.aim), e.wi, e.alive ? 1 : 0, e.rt, e.inv, e.kills, rd(e.tilt), e.jet ? e.jp : 0, e.mel, rd(e.vx), rd(e.vy), e.ground ? 1 : 0];
      if (e.slot === slot) a.push(e.ammo, e.res, e.gren, e.reload, e.inv3, e.smoke, e.sl);
      return a;
    });
    return {
      t: 's', tk: this.tk, ts: rd(this.tk * STEP_MS), ak: this.ack[slot], L: rd(this.left), f,
      b: this.bullets.map(b => [b.id, rd(b.x), rd(b.y), rd(b.vx), rd(b.vy), b.o.slot]),
      g: this.grenades.map(g => [g.id, rd(g.x), rd(g.y), rd(g.vx), rd(g.vy)]),
      sm: this.smokes.map(q => [rd(q.x), rd(q.y), q.age, q.dep ? 1 : 0]),
      it: withItems ? this.itemsState() : undefined,
      ev: evs || this.events
    };
  }
}
module.exports = { Match, WEAPONS, STEP_MS, MAPS, MAX_LAG };

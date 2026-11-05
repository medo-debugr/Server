// Mini-Militia style 2D shooter: side view, jetpack, 3 weapons, grenades, melee, reload, bots.
(function () {
'use strict';
var cv = document.getElementById('game'), c = cv.getContext('2d');
var W = 3000, H = 1400, G = 0.5, TAU = Math.PI * 2;
function R(a, b) { return Math.random() * (b - a) + a; }
function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
function mk(w, h) { var e = document.createElement('canvas'); e.width = w; e.height = h; return e; }
var seed = 5; function sr() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

// ---------------- Themes & maps ----------------
var THEMES = {
  grass:  { sky: ['#cfe3ee', '#e9f1ee'], far: ['#b9c9d1', '#9fb3bd'], hill: '#7fae66', hill2: '#5c9448', rock: ['#6b5c4c', '#7a6a58'], st: ['#a7a6a0', '#8d8c86'], edge: '#2f2820', se: '#3b342b', deco: 'grass' },
  forest: { sky: ['#bfe0d4', '#e3f1e6'], far: ['#8fb7a2', '#76a58c'], hill: '#5e9a52', hill2: '#3f7a3a', rock: ['#5f5242', '#6e604d'], st: ['#9c9a92', '#82807a'], edge: '#2a2118', se: '#352d22', deco: 'grass', trees: 1 },
  snow:   { sky: ['#cfe2f3', '#f4f9fc'], far: ['#d5e3ee', '#b8cfe0'], hill: '#eef6fb', hill2: '#d3e6f2', rock: ['#7f93a6', '#8fa4b8'], st: ['#b9cde0', '#a2b9d0'], edge: '#34495e', se: '#52697e', deco: 'snow' },
  desert: { sky: ['#f3d9a4', '#fbeccb'], far: ['#e0b97c', '#cfa162'], hill: '#e8c88a', hill2: '#d6b274', rock: ['#b48a4e', '#c29a5c'], st: ['#d8b87e', '#c5a068'], edge: '#5a3f1c', se: '#7a5a2e', deco: 'sand' },
  moon:   { sky: ['#0b1026', '#2b2f55'], far: ['#3a3f6a', '#2c3158'], hill: '#8d8fa3', hill2: '#6f7188', rock: ['#6c6e80', '#7b7d90'], st: ['#9a9cae', '#858799'], edge: '#1a1b26', se: '#2a2b3a', deco: 'moon', stars: 1 },
  cave:   { sky: ['#1b1410', '#2f2218'], far: ['#33251b', '#2a1e16'], hill: '#3a2b20', hill2: '#2a1e16', rock: ['#4a3a2c', '#54433a'], st: ['#6b5848', '#5d4c3e'], edge: '#0d0805', se: '#1a120c', deco: 'cave' },
  metal:  { sky: ['#9fb2c0', '#c9d4dc'], far: ['#8392a0', '#6f7e8c'], hill: '#7a8a97', hill2: '#667683', rock: ['#4b5560', '#58636f'], st: ['#6c7884', '#5f6b77'], edge: '#1c2228', se: '#2b333b', deco: 'metal' },
  lava:   { sky: ['#3a1410', '#8a3a1a'], far: ['#5a2018', '#46170f'], hill: '#4a1a12', hill2: '#3a130d', rock: ['#3c2c2a', '#4a3835'], st: ['#6a4a40', '#5a3c34'], edge: '#120504', se: '#2a0f0b', deco: 'lava' },
  tomb:   { sky: ['#8a7550', '#d6c496'], far: ['#8a7550', '#725f40'], hill: '#a58f62', hill2: '#8a764d', rock: ['#8a7048', '#977c52'], st: ['#b59a68', '#a38858'], edge: '#2a1f0e', se: '#4a3a1c', deco: 'sand' }
};
// Map layouts. Floor, side walls and ceiling are added automatically; p = extra solid blocks [x, y, w, h]; sp = spawn points [x, ground y].
var MAPS = [
  { n: 'Outpost', w: 3000, h: 1400, th: 'grass', p: [[250,980,420,70],[780,860,330,70],[1250,1020,260,60],[1650,900,450,80],[2300,1000,380,70],[2250,720,330,70],[1550,600,420,70],[900,560,380,70],[300,640,330,70],[120,330,300,70],[2600,420,330,70],[1100,300,400,70],[1900,380,300,70]],
    sp: [[150,1180],[2800,1180],[350,980],[2400,1000],[1700,900],[950,560],[1650,600],[180,330]] },
  { n: 'High Tower', w: 2600, h: 1400, th: 'grass', p: [[500,540,160,640],[380,480,400,60],[1940,540,160,640],[1820,480,400,60],[1210,340,180,840],[1060,300,480,60],[700,840,450,60],[1450,840,450,60],[100,1000,300,60],[2200,1000,300,60]],
    sp: [[580,480],[2020,480],[1300,300],[900,840],[1700,840],[200,1000],[2350,1000],[150,1180],[2450,1180]] },
  { n: 'Subdivision', w: 3000, h: 1400, th: 'metal', p: [[1440,60,120,800],[150,950,400,60],[650,760,350,60],[150,560,350,60],[800,450,350,60],[2450,950,400,60],[2000,760,350,60],[2500,560,350,60],[1850,450,350,60]],
    sp: [[350,950],[825,760],[325,560],[975,450],[2650,950],[2175,760],[2675,560],[2025,450],[600,1180],[2400,1180]] },
  { n: 'Bottleneck', w: 3000, h: 1400, th: 'forest', p: [[1300,60,400,700],[1300,960,400,220],[150,880,450,60],[700,640,350,60],[200,420,400,60],[2400,880,450,60],[1950,640,350,60],[2400,420,400,60]],
    sp: [[375,880],[875,640],[400,420],[2625,880],[2125,640],[2600,420],[200,1180],[2800,1180]] },
  { n: 'No Escape', w: 2600, h: 1400, th: 'lava', p: [[850,880,900,60],[1100,560,400,60],[150,1000,350,60],[2100,1000,350,60],[150,700,350,60],[2100,700,350,60],[600,60,300,250],[1700,60,300,250]],
    sp: [[1000,880],[1600,880],[1300,560],[325,1000],[2275,1000],[325,700],[2275,700],[300,1180],[2300,1180]] },
  { n: 'So Long', w: 3600, h: 1400, th: 'desert', p: [[200,1000,600,60],[1000,900,500,60],[1700,1000,600,60],[2500,900,500,60],[3000,1000,400,60],[400,700,500,60],[1200,650,600,60],[2100,700,500,60],[2800,650,500,60],[900,400,500,60],[1900,400,500,60]],
    sp: [[500,1000],[1250,900],[2000,1000],[2750,900],[3200,1000],[650,700],[1500,650],[2350,700],[3050,650],[1150,400],[2150,400],[300,1180],[3300,1180]] },
  { n: 'Lunarcy', w: 3000, h: 1400, th: 'moon', g: 0.25, p: [[300,1000,350,70],[900,850,300,70],[1500,1000,300,70],[2100,800,350,70],[2500,1000,300,70],[1300,600,400,70],[500,600,300,70],[2300,500,300,70],[1000,350,300,70],[1900,300,350,70]],
    sp: [[475,1000],[1050,850],[1650,1000],[2275,800],[2650,1000],[1500,600],[650,600],[2450,500],[1150,350],[2075,300],[200,1180],[2800,1180]] },
  { n: 'Ice Box', w: 2800, h: 1400, th: 'snow', p: [[1000,760,800,60],[1000,820,60,140],[1740,820,60,140],[200,1000,350,60],[2250,1000,350,60],[350,700,350,60],[2100,700,350,60],[1200,480,400,60]],
    sp: [[375,1000],[2425,1000],[525,700],[2275,700],[1400,480],[1400,760],[800,1180],[2000,1180],[1400,1180]] },
  { n: 'Snow Blind', w: 3000, h: 1400, th: 'snow', p: [[300,1050,400,60],[800,950,300,60],[1250,850,350,60],[1700,950,300,60],[2200,1050,400,60],[500,750,350,60],[1100,600,300,60],[1700,600,300,60],[2200,750,350,60],[1400,350,300,60]],
    sp: [[500,1050],[950,950],[1425,850],[1850,950],[2400,1050],[675,750],[1250,600],[1850,600],[2375,750],[1550,350],[150,1180],[2850,1180]] },
  { n: 'Pyramid', w: 3000, h: 1400, th: 'desert', p: [[950,1060,1100,120],[1150,940,700,120],[1300,820,400,120],[1400,700,200,120],[150,950,350,60],[2500,950,350,60],[300,650,350,60],[2350,650,350,60],[1250,400,500,60]],
    sp: [[1500,700],[1050,1060],[1950,1060],[1200,940],[1800,940],[325,950],[2675,950],[475,650],[2525,650],[1500,400],[300,1180],[2700,1180]] },
  { n: 'Catacombs', w: 3000, h: 1400, th: 'cave', p: [[70,400,900,80],[1300,400,900,80],[2550,400,380,80],[400,720,900,80],[1650,720,900,80],[70,980,700,80],[1100,980,800,80],[2250,980,680,80],[600,640,100,80],[2100,640,100,80],[450,900,100,80],[1400,900,100,80],[900,1100,100,80],[2000,1100,100,80]],
    sp: [[300,400],[1700,400],[2750,400],[1000,720],[2200,720],[300,980],[1500,980],[2600,980],[300,1180],[1500,1180],[2700,1180]] },
  { n: 'Overseer', w: 3000, h: 1400, th: 'forest', p: [[1380,660,240,520],[1100,600,800,60],[300,1050,300,60],[600,900,300,60],[900,760,300,60],[2400,1050,300,60],[2100,900,300,60],[1800,760,300,60],[150,500,300,60],[2550,500,300,60],[1300,300,400,60]],
    sp: [[450,1050],[750,900],[1000,760],[2550,1050],[2250,900],[1950,760],[1500,600],[1500,300],[300,500],[2700,500],[200,1180],[2800,1180]] },
  { n: 'Suspension', w: 3000, h: 1400, th: 'grass', p: [[200,800,1000,40],[1800,800,1000,40],[1000,550,1000,40],[600,1000,500,40],[1900,1000,500,40],[120,840,80,340],[2800,840,80,340],[1480,590,40,590],[300,350,400,40],[2300,350,400,40]],
    sp: [[500,800],[2500,800],[1500,550],[850,1000],[2150,1000],[500,350],[2500,350],[300,1180],[2700,1180]] },
  { n: 'Cliffhanger', w: 3000, h: 1400, th: 'forest', p: [[70,900,500,280],[70,620,300,280],[2430,800,500,380],[2630,500,300,300],[1000,900,300,60],[1700,700,300,60],[1300,500,400,60]],
    sp: [[480,900],[200,620],[2600,800],[2800,500],[1150,900],[1850,700],[1500,500],[900,1180],[1900,1180]] },
  { n: 'Crossfire', w: 3000, h: 1400, th: 'metal', p: [[200,1050,300,60],[600,900,300,60],[1000,750,300,60],[2500,1050,300,60],[2100,900,300,60],[1700,750,300,60],[1250,520,500,60],[200,550,300,60],[2500,550,300,60]],
    sp: [[350,1050],[750,900],[1150,750],[2650,1050],[2250,900],[1850,750],[1500,520],[350,550],[2650,550],[1000,1180],[2000,1180]] },
  { n: 'Undermine', w: 3000, h: 1400, th: 'cave', p: [[70,620,1230,100],[1700,620,1230,100],[400,900,500,60],[2100,900,500,60],[1200,950,600,60],[300,400,350,60],[2350,400,350,60],[1300,350,400,60]],
    sp: [[600,620],[2400,620],[475,400],[2525,400],[1500,350],[650,900],[2350,900],[1500,950],[300,1180],[2700,1180]] },
  { n: 'Crucible', w: 2600, h: 1400, th: 'lava', p: [[200,800,300,60],[450,950,300,60],[2100,800,300,60],[1850,950,300,60],[900,650,800,60],[300,450,400,60],[1900,450,400,60],[70,1060,260,120],[2270,1060,260,120]],
    sp: [[350,800],[600,950],[2250,800],[2000,950],[1300,650],[500,450],[2100,450],[200,1060],[2400,1060],[1300,1180]] },
  { n: 'Stronghold', w: 3000, h: 1400, th: 'tomb', p: [[150,800,500,60],[600,860,60,140],[150,740,60,60],[330,740,60,60],[520,740,60,60],[2350,800,500,60],[2340,860,60,140],[2790,740,60,60],[2610,740,60,60],[2420,740,60,60],[1300,900,400,60],[1100,600,800,60]],
    sp: [[270,800],[2730,800],[1500,900],[1500,600],[300,1180],[900,1180],[2100,1180],[2700,1180]] },
  { n: 'Entombed', w: 3000, h: 1400, th: 'tomb', p: [[200,1000,500,60],[800,900,300,60],[1200,1000,600,60],[1900,900,300,60],[2300,1000,500,60],[500,700,400,60],[1300,700,400,60],[2100,700,400,60],[900,450,300,60],[1700,450,300,60],[300,60,300,200],[1350,60,300,250],[2400,60,300,200]],
    sp: [[450,1000],[950,900],[1500,1000],[2050,900],[2550,1000],[700,700],[1500,700],[2300,700],[1050,450],[1850,450],[150,1180],[2850,1180]] },
  { n: 'Deadlock', w: 3000, h: 1400, th: 'metal', p: [[1440,300,120,500],[300,1000,400,60],[2300,1000,400,60],[300,700,400,60],[2300,700,400,60],[1000,850,300,60],[1700,850,300,60],[1000,500,300,60],[1700,500,300,60],[1200,1050,600,60]],
    sp: [[500,1000],[2500,1000],[500,700],[2500,700],[1150,850],[1850,850],[1150,500],[1850,500],[1500,1050],[1500,300],[150,1180],[2850,1180]] }
];
var SZ = { 'Outpost': [4200, 1500], 'High Tower': [3400, 1900], 'Subdivision': [3800, 1600], 'Bottleneck': [3600, 1700], 'No Escape': [3400, 1700], 'So Long': [5200, 1300], 'Lunarcy': [3600, 1700],
  'Ice Box': [3800, 1600], 'Snow Blind': [5400, 1200], 'Pyramid': [3800, 1600], 'Catacombs': [3600, 1700], 'Overseer': [3400, 1950], 'Suspension': [4200, 1500], 'Cliffhanger': [2600, 2600],
  'Crossfire': [3600, 1800], 'Undermine': [3600, 1800], 'Crucible': [3600, 1650], 'Stronghold': [3000, 2000], 'Entombed': [3600, 1800], 'Deadlock': [4000, 1500] };
// Map proportions follow the wiki's map thumbnails; the existing layouts are rescaled to the new width / height (ground stays 220 high, ceiling 60).
MAPS.forEach(function (m) {
  var z = SZ[m.n]; if (!z) return; var sx = z[0] / m.w, k = (z[1] - 280) / (m.h - 280), ry = function (y) { return Math.round(60 + (y - 60) * k); };
  m.p = m.p.map(function (r) { return [Math.round(r[0] * sx), ry(r[1]), r[2] > 100 ? Math.round(r[2] * sx) : Math.max(40, Math.round(r[2] * sx)), r[3] >= 200 ? Math.round(r[3] * k) : Math.max(40, Math.round(r[3] * Math.min(1, k)))]; });
  m.sp = m.sp.map(function (q) { return [Math.round(q[0] * sx), ry(q[1])]; }); m.w = z[0]; m.h = z[1];
});
var S = [], SPAWNS = [], TH = THEMES.grass, MAPI = 0, terrain = mk(1, 1), bgM = mk(1, 1), bgH = mk(1, 1);
function solidAt(x, y) {
  for (var i = 0; i < S.length; i++) { var s = S[i]; if (x > s[0] && x < s[0] + s[2] && y > s[1] && y < s[1] + s[3]) return true; }
  return false;
}
function vine(t, x1, x2, y) {
  var pts = []; t.lineJoin = 'round';
  for (var x = x1; x <= x2; x += 12) pts.push([x, y + Math.sin(x * 0.13) * 3 + (sr() - 0.5) * 3]);
  [[10, '#25502a'], [6, '#69b351']].forEach(function (l) {
    t.lineWidth = l[0]; t.strokeStyle = l[1]; t.beginPath();
    pts.forEach(function (p, i) { i ? t.lineTo(p[0], p[1]) : t.moveTo(p[0], p[1]); }); t.stroke();
  });
  for (var q = x1 + 10; q < x2 - 6; q += 26) {
    var up = sr() < 0.6; t.fillStyle = '#4f9a3f'; t.strokeStyle = '#25502a'; t.lineWidth = 2;
    t.beginPath(); t.moveTo(q - 5, y); t.lineTo(q, y + (up ? -16 : 14)); t.lineTo(q + 5, y); t.closePath(); t.fill(); t.stroke();
  }
}
function plant(t, x, y) {
  for (var pass = 0; pass < 2; pass++) {
    t.strokeStyle = pass ? '#5fae48' : '#24502b'; t.lineWidth = pass ? 3 : 6; t.lineCap = 'round';
    for (var i = -4; i <= 4; i++) { t.beginPath(); t.moveTo(x, y); t.quadraticCurveTo(x + i * 7, y - 30, x + i * 13, y - 42 + Math.abs(i) * 6); t.stroke(); }
  }
}
// ---- props (trees, cacti, crates, torches ...) drawn into the terrain layer ----
function tree(t, x, y) {
  t.fillStyle = '#5b3d22'; t.strokeStyle = '#2b1a0c'; t.lineWidth = 3; t.fillRect(x - 7, y - 70, 14, 72); t.strokeRect(x - 7, y - 70, 14, 72);
  [[0, -105, 38], [-26, -85, 28], [26, -85, 28]].forEach(function (b) { t.fillStyle = '#3f8a3a'; t.beginPath(); t.arc(x + b[0], y + b[1], b[2], 0, TAU); t.fill(); t.stroke(); });
}
function pine(t, x, y) {
  t.fillStyle = '#4a3322'; t.fillRect(x - 6, y - 24, 12, 26);
  [[-18, 46], [-52, 38], [-84, 30]].forEach(function (b) {
    t.fillStyle = '#2f6b4a'; t.strokeStyle = '#173a28'; t.lineWidth = 3; t.beginPath(); t.moveTo(x - b[1], y + b[0] + 4); t.lineTo(x, y + b[0] - 44); t.lineTo(x + b[1], y + b[0] + 4); t.closePath(); t.fill(); t.stroke();
    t.fillStyle = '#fff'; t.beginPath(); t.moveTo(x - b[1] * 0.45, y + b[0] - 24); t.lineTo(x, y + b[0] - 44); t.lineTo(x + b[1] * 0.45, y + b[0] - 24); t.closePath(); t.fill();
  });
}
function cactus(t, x, y) {
  t.fillStyle = '#4f9a4f'; t.strokeStyle = '#24502b'; t.lineWidth = 3;
  [[x - 9, y - 80, 18, 82], [x - 30, y - 50, 22, 10], [x - 30, y - 70, 10, 30], [x + 8, y - 36, 22, 10], [x + 20, y - 56, 10, 30]].forEach(function (r) { t.fillRect(r[0], r[1], r[2], r[3]); t.strokeRect(r[0], r[1], r[2], r[3]); });
}
function crate(t, x, y) {
  t.fillStyle = '#9a6a35'; t.strokeStyle = '#4a2f12'; t.lineWidth = 3; t.fillRect(x - 20, y - 40, 40, 40); t.strokeRect(x - 20, y - 40, 40, 40);
  t.beginPath(); t.moveTo(x - 20, y - 40); t.lineTo(x + 20, y); t.moveTo(x + 20, y - 40); t.lineTo(x - 20, y); t.stroke();
}
function barrel(t, x, y) {
  t.fillStyle = '#6a7480'; t.strokeStyle = '#20262c'; t.lineWidth = 3; t.fillRect(x - 14, y - 42, 28, 42); t.strokeRect(x - 14, y - 42, 28, 42);
  t.fillStyle = '#c0392b'; t.fillRect(x - 14, y - 32, 28, 6); t.fillRect(x - 14, y - 14, 28, 6);
}
function torch(t, x, y) {
  var g = t.createRadialGradient(x, y - 58, 4, x, y - 58, 70); g.addColorStop(0, 'rgba(255,190,80,.4)'); g.addColorStop(1, 'rgba(255,190,80,0)');
  t.fillStyle = g; t.fillRect(x - 70, y - 128, 140, 140);
  t.fillStyle = '#4a3322'; t.fillRect(x - 3, y - 50, 6, 50);
  t.fillStyle = '#ffa52e'; t.beginPath(); t.arc(x, y - 58, 9, 0, TAU); t.fill(); t.fillStyle = '#fff1a8'; t.beginPath(); t.arc(x, y - 56, 5, 0, TAU); t.fill();
}
function boulder(t, x, y) {
  t.fillStyle = '#8e90a0'; t.strokeStyle = '#2a2b3a'; t.lineWidth = 3; t.beginPath(); t.moveTo(x - 30, y); t.lineTo(x - 22, y - 26); t.lineTo(x, y - 36); t.lineTo(x + 24, y - 24); t.lineTo(x + 32, y); t.closePath(); t.fill(); t.stroke();
}
function antenna(t, x, y) {
  t.strokeStyle = '#c9ccd8'; t.lineWidth = 3; t.beginPath(); t.moveTo(x, y); t.lineTo(x, y - 70); t.moveTo(x - 14, y - 52); t.lineTo(x + 14, y - 52); t.stroke();
  t.fillStyle = '#e53935'; t.beginPath(); t.arc(x, y - 72, 5, 0, TAU); t.fill();
}
function decorate(t, x, y, w, h, k) {
  var d = TH.deco, xx, wide = w > 250, px = x + 40 + sr() * Math.max(1, w - 80);
  if (d === 'grass') { vine(t, x, x + w, y); if (wide) plant(t, x + w * (0.2 + sr() * 0.6), y - 3); if (TH.trees && w > 300) tree(t, px, y); }
  else if (d === 'snow') {
    t.fillStyle = '#fff'; t.strokeStyle = '#8fb3cc'; t.lineWidth = 2; t.beginPath(); t.moveTo(x, y + 4);
    for (xx = x; xx <= x + w; xx += 12) t.lineTo(xx, y - 5 - sr() * 5);
    t.lineTo(x + w, y + 14); t.lineTo(x, y + 14); t.closePath(); t.fill(); t.stroke();
    for (xx = x + 14; xx < x + w - 10; xx += 36 + sr() * 20) { t.fillStyle = '#d8eefa'; t.beginPath(); t.moveTo(xx - 5, y + h); t.lineTo(xx, y + h + 12 + sr() * 16); t.lineTo(xx + 5, y + h); t.fill(); }
    if (wide) pine(t, px, y - 4);
  } else if (d === 'sand') {
    t.fillStyle = '#ead39a'; t.fillRect(x, y, w, 8); t.strokeStyle = 'rgba(90,60,25,.4)'; t.lineWidth = 2;
    for (var c1 = 0; c1 < w / 140; c1++) { var cx = x + sr() * w, cy = y + 14 + sr() * Math.max(1, h - 24); t.beginPath(); t.moveTo(cx, cy); t.lineTo(cx + 18, cy + 10); t.lineTo(cx + 8, cy + 22); t.stroke(); }
    if (wide) cactus(t, px, y);
  } else if (d === 'moon') {
    t.fillStyle = 'rgba(0,0,0,.28)'; for (var c2 = 0; c2 < w / 150; c2++) { t.beginPath(); t.ellipse(x + sr() * w, y + 5, 14 + sr() * 14, 5, 0, 0, TAU); t.fill(); }
    if (wide) { sr() < 0.5 ? boulder(t, px, y) : antenna(t, px, y); }
  } else if (d === 'cave') {
    t.fillStyle = '#46552e'; t.fillRect(x, y, w, 5);
    for (xx = x + 10; xx < x + w - 6; xx += 38 + sr() * 24) { t.fillStyle = TH.st[1]; t.strokeStyle = TH.edge; t.lineWidth = 2; t.beginPath(); t.moveTo(xx - 8, y + h); t.lineTo(xx, y + h + 10 + sr() * 18); t.lineTo(xx + 8, y + h); t.closePath(); t.fill(); t.stroke(); }
    if (w > 300) torch(t, px, y);
  } else if (d === 'metal' || d === 'lava') {
    if (d === 'metal') {
      t.save(); t.beginPath(); t.rect(x, y, w, 9); t.clip(); t.fillStyle = '#e0b020'; t.fillRect(x, y, w, 9); t.fillStyle = '#222';
      for (xx = x - 10; xx < x + w; xx += 24) { t.beginPath(); t.moveTo(xx, y + 9); t.lineTo(xx + 9, y); t.lineTo(xx + 21, y); t.lineTo(xx + 12, y + 9); t.closePath(); t.fill(); }
      t.restore();
    } else { t.fillStyle = '#ff6a1a'; t.fillRect(x, y, w, 4); t.fillStyle = 'rgba(255,120,30,.55)'; for (xx = x + 20; xx < x + w - 10; xx += 46 + sr() * 30) t.fillRect(xx, y + 6, 3, 10 + sr() * 16); }
    if (wide) { sr() < 0.5 ? crate(t, px, y) : barrel(t, px, y); }
  }
}
// ---- extra scenery props (visual only) ----
function barrel2(t,x,y,c){t.fillStyle=c;t.strokeStyle='#1a1a1a';t.lineWidth=3;t.fillRect(x-14,y-44,28,44);t.strokeRect(x-14,y-44,28,44);t.fillStyle='rgba(0,0,0,.28)';t.fillRect(x-14,y-34,28,5);t.fillRect(x-14,y-14,28,5);t.fillStyle='rgba(255,255,255,.25)';t.fillRect(x-9,y-42,4,40);}
function sandbags(t,x,y){t.fillStyle='#c9b27a';t.strokeStyle='#5a4a28';t.lineWidth=3;[[-20,-9],[8,-9],[36,-9],[-6,-27],[22,-27]].forEach(function(b){t.beginPath();t.ellipse(x+b[0],y+b[1],16,9,0,0,TAU);t.fill();t.stroke();});}
function bush(t,x,y,c){t.fillStyle=c;t.strokeStyle='rgba(0,0,0,.45)';t.lineWidth=2.5;[[-16,-12,14],[0,-18,18],[16,-12,14]].forEach(function(b){t.beginPath();t.arc(x+b[0],y+b[1],b[2],0,TAU);t.fill();t.stroke();});}
function flowers(t,x,y){var cs=['#ff5a7a','#ffd34d','#fff','#b388ff'];for(var i=-2;i<=2;i++){t.strokeStyle='#2f6b2a';t.lineWidth=2;t.beginPath();t.moveTo(x+i*9,y);t.lineTo(x+i*9,y-16-Math.abs(i)*2);t.stroke();t.fillStyle=cs[i+2>3?0:i+2];t.beginPath();t.arc(x+i*9,y-18-Math.abs(i)*2,4,0,TAU);t.fill();}}
function rocks(t,x,y,c){t.fillStyle=c;t.strokeStyle='rgba(0,0,0,.5)';t.lineWidth=2.5;[[-14,10],[8,16],[24,8]].forEach(function(b){t.beginPath();t.moveTo(x+b[0]-b[1],y);t.lineTo(x+b[0]-b[1]*.5,y-b[1]);t.lineTo(x+b[0]+b[1]*.6,y-b[1]*.8);t.lineTo(x+b[0]+b[1],y);t.closePath();t.fill();t.stroke();});}
function shroom(t,x,y){t.fillStyle='#eee';t.fillRect(x-4,y-14,8,14);t.fillStyle='#d6392b';t.beginPath();t.arc(x,y-14,13,Math.PI,0);t.fill();t.fillStyle='#fff';t.fillRect(x-6,y-21,4,4);t.fillRect(x+3,y-19,4,4);}
function flag(t,x,y,c){t.fillStyle='#444';t.fillRect(x-2,y-90,4,90);t.fillStyle=c;t.strokeStyle='#222';t.lineWidth=2;t.beginPath();t.moveTo(x+2,y-88);t.lineTo(x+42,y-78);t.lineTo(x+2,y-62);t.closePath();t.fill();t.stroke();}
function sign(t,x,y){t.fillStyle='#6b4a2b';t.fillRect(x-3,y-46,6,46);t.fillStyle='#b9894f';t.strokeStyle='#3a2410';t.lineWidth=2.5;t.beginPath();t.moveTo(x-22,y-44);t.lineTo(x+14,y-44);t.lineTo(x+24,y-35);t.lineTo(x+14,y-26);t.lineTo(x-22,y-26);t.closePath();t.fill();t.stroke();}
function lamp(t,x,y){var g=t.createRadialGradient(x,y-86,3,x,y-86,60);g.addColorStop(0,'rgba(255,240,170,.55)');g.addColorStop(1,'rgba(255,240,170,0)');t.fillStyle=g;t.fillRect(x-60,y-146,120,120);t.fillStyle='#333';t.fillRect(x-3,y-84,6,84);t.fillStyle='#ffe98a';t.beginPath();t.arc(x,y-88,8,0,TAU);t.fill();}
function crystal(t,x,y,c){t.fillStyle=c;t.strokeStyle='rgba(255,255,255,.7)';t.lineWidth=2;[[-12,30],[0,46],[12,26]].forEach(function(b){t.beginPath();t.moveTo(x+b[0]-8,y);t.lineTo(x+b[0],y-b[1]);t.lineTo(x+b[0]+8,y);t.closePath();t.fill();t.stroke();});}
function snowman(t,x,y){t.fillStyle='#fff';t.strokeStyle='#8fb3cc';t.lineWidth=2.5;[[0,-14,16],[0,-40,12]].forEach(function(b){t.beginPath();t.arc(x+b[0],y+b[1],b[2],0,TAU);t.fill();t.stroke();});t.fillStyle='#e8742a';t.fillRect(x,y-42,12,4);t.fillStyle='#000';t.fillRect(x-5,y-45,3,3);t.fillRect(x+2,y-45,3,3);}
function bones(t,x,y){t.strokeStyle='#efe6cf';t.lineWidth=4;t.lineCap='round';t.beginPath();t.moveTo(x-18,y-4);t.lineTo(x+18,y-4);t.moveTo(x-12,y-9);t.lineTo(x+12,y+1);t.stroke();t.fillStyle='#efe6cf';t.beginPath();t.arc(x,y-14,9,0,TAU);t.fill();t.fillStyle='#222';t.fillRect(x-5,y-16,3,4);t.fillRect(x+2,y-16,3,4);}
function pillar(t,x,y){t.fillStyle='#b59a68';t.strokeStyle='#2a1f0e';t.lineWidth=3;t.fillRect(x-12,y-70,24,70);t.strokeRect(x-12,y-70,24,70);t.fillRect(x-18,y-78,36,10);t.strokeRect(x-18,y-78,36,10);}
function vent(t,x,y){t.fillStyle='#2a0f0b';t.beginPath();t.moveTo(x-20,y);t.lineTo(x-8,y-30);t.lineTo(x+8,y-30);t.lineTo(x+20,y);t.fill();t.fillStyle='#ff6a1a';t.fillRect(x-6,y-32,12,5);}
function pick(a){return a[Math.floor(sr()*a.length)];}
var BR=function(t,x,y){barrel2(t,x,y,pick(['#c0392b','#4a6b2a','#d8a31a','#2f5f9a']));},
  CR=function(t,x,y){crate(t,x,y);if(sr()<.5)crate(t,x,y-40);if(sr()<.5)crate(t,x+42,y);},
  BU=function(t,x,y){bush(t,x,y,'#4f9a3f');}, RK=function(t,x,y){rocks(t,x,y,TH.st[0]);}, FG=function(t,x,y){flag(t,x,y,pick(['#d32c1b','#2a6fd3','#e0a020']));},
  CY=function(t,x,y){crystal(t,x,y,pick(['#6fd3ff','#b388ff','#7bf0a0']));}, CYO=function(t,x,y){crystal(t,x,y,'#ff9a3a');};
var PROPS={grass:[BR,CR,sandbags,BU,flowers,RK,sign,FG],snow:[BR,CR,sandbags,pine,snowman,RK,sign],sand:[BR,CR,sandbags,cactus,bones,RK,pillar,FG],
  moon:[BR,CR,boulder,antenna,CY,lamp,FG],cave:[BR,CR,torch,CY,shroom,RK,sign],metal:[BR,CR,sandbags,lamp,FG,sign],lava:[BR,CR,vent,RK,CYO,bones]};
function props(t,x,y,w,h,i2){
  if(w<140)return; var L=PROPS[TH.deco]||PROPS.grass,n=Math.max(1,Math.floor(w/(i2===0?300:220))),used=[],q,a,ok;
  for(q=0;q<n*3&&used.length<n;q++){
    var px=x+50+sr()*(w-100); ok=!solidAt(px,y-70)&&!solidAt(px,y-10);
    used.forEach(function(u){if(Math.abs(u-px)<110)ok=false;});
    SPAWNS.forEach(function(sp){if(Math.abs(sp[1]-y)<8&&Math.abs(sp[0]-px)<90)ok=false;});
    if(ok){used.push(px);pick(L)(t,px,y);}
  }
  if(TH.deco==='grass'&&i2>3){for(var xx=x+24;xx<x+w-20;xx+=44+sr()*30){var ln=18+sr()*34;t.strokeStyle='#2f6b2a';t.lineWidth=3;t.beginPath();t.moveTo(xx,y+h);t.lineTo(xx+sr()*6-3,y+h+ln);t.stroke();t.fillStyle='#5fae48';t.beginPath();t.arc(xx,y+h+ln,5,0,TAU);t.fill();}}
}
function cloud(g,x,y,k,a){g.fillStyle='rgba(255,255,255,'+a+')';[[0,0,26],[28,-12,22],[56,0,28],[26,8,24],[86,8,20]].forEach(function(b){g.beginPath();g.arc(x+b[0]*k,y+b[1]*k,b[2]*k,0,TAU);g.fill();});}
function bgExtras(){
  var m=bgM.getContext('2d'),h=bgH.getContext('2d'),d=TH.deco,i;
  if(d!=='cave'&&d!=='lava'&&!TH.stars)for(i=0;i<6;i++)cloud(m,130+i*380+sr()*90,30+sr()*80,.6+sr()*.5,d==='snow'?.9:.65);
  if(d==='sand'){var g=m.createRadialGradient(1800,80,5,1800,80,90);g.addColorStop(0,'#fff6c8');g.addColorStop(.35,'#ffd45a');g.addColorStop(1,'rgba(255,210,90,0)');m.fillStyle=g;m.fillRect(1700,0,200,180);}
  if(TH.stars){m.fillStyle='#3d7bd8';m.beginPath();m.arc(1750,90,44,0,TAU);m.fill();m.fillStyle='#4fae5a';m.beginPath();m.arc(1738,80,16,0,TAU);m.fill();m.beginPath();m.arc(1765,102,10,0,TAU);m.fill();}
  if(d==='grass')for(i=40;i<2380;i+=70+sr()*60){var ty=110+Math.sin(i/2400*TAU*2)*30+Math.sin(i/2400*TAU*5)*12;h.fillStyle=TH.hill2;h.fillRect(i-2,ty-26,4,28);h.beginPath();h.arc(i,ty-34,16,0,TAU);h.fill();}
}
function buildBg() {
  bgM = mk(2400, 420); bgH = mk(2400, 300);
  var m = bgM.getContext('2d');
  [[TH.far[0], 0.55, 150], [TH.far[1], 0.8, 90]].forEach(function (l) {
    m.fillStyle = l[0]; m.beginPath(); m.moveTo(0, 420);
    for (var x = 0; x <= 2400; x += 20) m.lineTo(x, 420 - l[2] - (Math.sin(x / 2400 * TAU * 3 + l[1]) * 70 + Math.sin(x / 2400 * TAU * 7) * 30) * l[1] - 60);
    m.lineTo(2400, 420); m.fill();
  });
  if (TH.stars) { m.fillStyle = '#fff'; for (var i = 0; i < 90; i++) m.fillRect(sr() * 2400, sr() * 200, 2, 2); }
  var h = bgH.getContext('2d');
  h.fillStyle = TH.hill; h.beginPath(); h.moveTo(0, 300);
  for (var x2 = 0; x2 <= 2400; x2 += 10) h.lineTo(x2, 110 + Math.sin(x2 / 2400 * TAU * 2) * 30 + Math.sin(x2 / 2400 * TAU * 5) * 12);
  h.lineTo(2400, 300); h.fill();
  if (TH.deco === 'grass') {
    h.fillStyle = TH.hill2;
    for (var q = 0; q < 2400; q += 16) {
      var y = 110 + Math.sin(q / 2400 * TAU * 2) * 30 + Math.sin(q / 2400 * TAU * 5) * 12;
      h.beginPath(); h.moveTo(q, y + 4); h.lineTo(q + 6, y - 10 - sr() * 14); h.lineTo(q + 12, y + 4); h.fill();
    }
  }
}
function buildMap(i) {
  var m = MAPS[i]; MAPI = i; W = m.w; H = m.h; G = m.g || 0.5; TH = THEMES[m.th]; seed = 5 + i * 11;
  S = [m.o ? [0, H - 220, 700, 220] : [0, H - 220, W, 220], [0, 0, 70, H], [W - 70, 0, 70, H], [0, 0, W, 60]].concat(m.p, m.o ? [[W - 700, H - 220, 700, 220]] : []);
  SPAWNS = m.sp.filter(function (q) { return !(m.o && q[1] >= H - 230 && q[0] > 700 && q[0] < W - 700); });
  terrain = mk(W, H);
  var t = terrain.getContext('2d');
  S.forEach(function (s, i2) {
    var x = s[0], y = s[1], w = s[2], h = s[3];
    t.save(); t.beginPath(); t.rect(x, y, w, h); t.clip();
    t.fillStyle = i2 % 2 ? TH.rock[1] : TH.rock[0]; t.fillRect(x, y, w, h);
    for (var k = 0; k < w * h / 1100; k++) {
      var px = x + sr() * w, py = y + sr() * h, r = 10 + sr() * 18, v = 5 + Math.floor(sr() * 2);
      t.beginPath();
      for (var j = 0; j < v; j++) { var a = j / v * TAU + sr() * 0.5, rr = r * (0.7 + sr() * 0.5); t.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr); }
      t.closePath(); t.fillStyle = sr() < 0.5 ? TH.st[0] : TH.st[1]; t.fill(); t.strokeStyle = TH.se; t.lineWidth = 2.5; t.stroke();
    }
    t.restore();
    t.strokeStyle = TH.edge; t.lineWidth = 5; t.strokeRect(x, y, w, h);
    if (i2 > 3 || i2 === 0) { decorate(t, x, y, w, h, i2); props(t, x, y, w, h, i2); }
  });
  buildBg(); bgExtras(); placeItems();
}

// ---------------- Audio (synthesized) ----------------
var AC = null, master, noiseBuf, jetG;
var SETT = { snd: 1, mus: 1 }; try { var sv_ = JSON.parse(localStorage.getItem('mm_set') || '{}'); if (sv_.snd === 0) SETT.snd = 0; if (sv_.mus === 0) SETT.mus = 0; } catch (e_) { }
function saveSet() { try { localStorage.setItem('mm_set', JSON.stringify(SETT)); } catch (e_) { } }
var SND = { uzi: [3200, .09, .35, 160], shotgun: [1500, .3, .8, 90], sniper: [4500, .45, .7, 120], boom: [900, .8, 1, 55],
  click: [6000, .05, .3, 0, 'highpass'], melee: [800, .12, .4, 140], hit: [2500, .05, .25, 0, 'bandpass'], pin: [3000, .08, .3, 700, 'highpass'] };
SND.pistol=[3800,.12,.4,220]; SND.magnum=[2200,.24,.75,120]; SND.smg=[3400,.07,.3,180]; SND.ak=[2600,.11,.5,140]; SND.m4=[3000,.09,.4,170]; SND.mini=[3200,.06,.28,200];
SND.laser=[6000,.14,.25,1400,'bandpass']; SND.flame=[900,.2,.3,0,'bandpass']; SND.launch=[700,.4,.85,80]; SND.emp=[1500,.45,.6,700,'bandpass'];
SND.arrow=[5200,.18,.45,520,'bandpass'];
SND.dieme=[600,1,.9,240]; SND.diebot=[1800,.55,.7,520,'bandpass'];
function audio() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination);
      noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var s = AC.createBufferSource(), f = AC.createBiquadFilter(); s.buffer = noiseBuf; s.loop = true;
      f.type = 'bandpass'; f.frequency.value = 700; jetG = AC.createGain(); jetG.gain.value = 0;
      s.connect(f); f.connect(jetG); jetG.connect(master); s.start();
    } catch (e) { AC = null; }
  }
  if (AC && AC.state === 'suspended') AC.resume();
}
function tone(f0, f1, d, v, type, dl) {
  var n = AC.currentTime + (dl || 0), o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, n); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), n + d);
  g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(0.001, n + d); o.connect(g); g.connect(master); o.start(n); o.stop(n + d + 0.02);
}
function nz(fr, d, v, dl) {
  var n = AC.currentTime + (dl || 0), s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = fr; f.Q.value = 2;
  g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(0.001, n + d); s.connect(f); f.connect(g); g.connect(master); s.start(n, Math.random() * 0.5); s.stop(n + d);
}
// Reload: 1) magazine release (click + soft thunk)  2) magazine slides in (rising chirp)  3) bolt locks (crisp clack + small bell)
var SNDF = {
  rel1: function (v) { tone(1500, 800, .05, .26 * v, 'triangle'); nz(4500, .04, .28 * v); tone(320, 150, .1, .3 * v, 'sine', .04); },
  rel2: function (v) { nz(2600, .07, .22 * v); tone(900, 1700, .09, .16 * v, 'triangle', .02); },
  rel3: function (v) { tone(1900, 900, .04, .3 * v, 'square'); nz(3800, .05, .42 * v); tone(240, 90, .12, .5 * v, 'sine', .03); tone(1568, 1568, .22, .12 * v, 'sine', .07); tone(2093, 2093, .2, .08 * v, 'sine', .11); }
};
function snd(t, vol) {
  if (!SETT.snd) return;
  if (AC && SNDF[t]) { SNDF[t](vol == null ? 1 : vol); return; }
  if (!AC || !SND[t]) return; var P_ = SND[t], n = AC.currentTime, v = vol == null ? 1 : vol;
  var s = AC.createBufferSource(); s.buffer = noiseBuf;
  var f = AC.createBiquadFilter(); f.type = P_[4] || 'lowpass';
  f.frequency.setValueAtTime(P_[0], n); f.frequency.exponentialRampToValueAtTime(Math.max(60, P_[0] / 6), n + P_[1]);
  var g = AC.createGain(); g.gain.setValueAtTime(P_[2] * v, n); g.gain.exponentialRampToValueAtTime(0.001, n + P_[1]);
  s.connect(f); f.connect(g); g.connect(master); s.start(n, Math.random() * 0.5); s.stop(n + P_[1]);
  if (P_[3]) {
    var o = AC.createOscillator(), og = AC.createGain(); o.frequency.setValueAtTime(P_[3], n); o.frequency.exponentialRampToValueAtTime(30, n + P_[1]);
    og.gain.setValueAtTime(P_[2] * 0.8 * v, n); og.gain.exponentialRampToValueAtTime(0.001, n + P_[1]); o.connect(og); og.connect(master); o.start(n); o.stop(n + P_[1]);
  }
}

// ---- menu music: light synthesized combat loop ----
var musG = null, musTimer = 0, musStep = 0;
function music(on) {
  if (!AC) return; if (!musG) { musG = AC.createGain(); musG.gain.value = 0; musG.connect(master); }
  musG.gain.setTargetAtTime(on ? (MENU ? 0.16 : 0.08) : 0, AC.currentTime, 0.4);
  if (on && !musTimer) musTimer = setInterval(musTick, 150);
  if (!on && musTimer && musG.gain.value < 0.005) { clearInterval(musTimer); musTimer = 0; }
}
function musTick() {
  var n = AC.currentTime + 0.05, i = musStep++ % 32, bass = [55, 55, 65.4, 49][(i >> 3) % 4];
  if (i % 2 === 0) {
    var o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.value = bass * (i % 8 === 6 ? 1.5 : 1);
    f.type = 'lowpass'; f.frequency.value = 400; g.gain.setValueAtTime(0.5, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.28);
    o.connect(f); f.connect(g); g.connect(musG); o.start(n); o.stop(n + 0.3);
  }
  if (i % 8 === 4 || i % 16 === 0 || i % 4 === 2) {
    var s2 = AC.createBufferSource(), h = AC.createBiquadFilter(), g2 = AC.createGain(), kick = i % 16 === 0;
    s2.buffer = noiseBuf; h.type = kick ? 'lowpass' : 'highpass'; h.frequency.value = kick ? 200 : 1800 + (i % 8 === 4 ? 0 : 3000);
    g2.gain.setValueAtTime(kick ? 0.9 : i % 8 === 4 ? 0.5 : 0.15, n); g2.gain.exponentialRampToValueAtTime(0.001, n + (kick ? 0.2 : 0.1));
    s2.connect(h); h.connect(g2); g2.connect(musG); s2.start(n, Math.random() * 0.5); s2.stop(n + 0.25);
  }
}
// ---------------- Fighters ----------------
function WP(n, rate, dmg, speed, snd, len, rec, life, o) {
  var w = { n: n, rate: rate, dmg: dmg, mag: 100, res: 100, spread: 0, speed: speed, pel: 1, snd: snd, rel: 60, gl: len * 1.2, len: len, rec: rec, life: life };
  for (var k in (o || {})) w[k] = o[k]; return w;
}
// Names / roles from the Mini Militia Classic wiki "Items & Weapons" table. The wiki has no numbers, so damage / speed / rate are tuned from its descriptions.
// 0-2 = starting loadout (Mini Eagle / SPAS-12 / M93BA), 3+ = map pickups. 100 rounds each, straight shots (no spread).
var WEAPONS = [
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
WEAPONS.forEach(function (w) { w.res = w.mag === 1 ? 12 : w.mag * 3; });   // spare rounds (bots)
// Spare rounds the players always start with (per weapon, in picture order): sprays 300, launcher/cannon/arrow 50, pistol 60, sniper 50. Hand grenades 30.
var START_RES = [300, 300, 300, 50, 60, 50, 300, 300, 50, 50];
;
function fighter(name, col, bot) {
  return { name: name, col: col, bot: bot, x: 0, y: 0, w: 34, h: 65, vx: 0, vy: 0, hp: 100, fuel: 100, face: 1, aim: 0, wi: 0, inv3: [0, 1, 2], sl: 0,
    ammo: [], res: [], cool: 0, reload: 0, gren: 2, mel: 0, alive: false, rt: 0, kills: 0, step: 0, jet: false, ground: false,
    fl: 0, inv: 0, tilt: 0, jp: 0, joined: false, an: { c: 0, la: 0, rl: 0, ll: 0, lift: 0, kb: 0 }, ai: { t: 0, sd: 1, err: 0, of: 0 } };
}
// The character: exactly the original player's colours (red cap, red shirt, white limbs, blue pants). No outfits.
var CHAR = { hat: '#D32C1B', shirt: '#CF2213', under: '#FFF5F4', sleeve: '#E31B15', pants: '#4093BD', limbL: '#fff', limbD: '#fff' };

// ---- FIT: body-only outfits (torso). Head, cap, arms and legs stay the original. Pictures load from the internet. ----
var SKIN_URLS = [
  'https://i.postimg.cc/9QLm8F1w/Chat-GPT-Image-28-aktwbr-2026-09-32-34-m-(1).png',
  'https://i.postimg.cc/NjCt8Cf1/Chat-GPT-Image-28-aktwbr-2026-09-34-14-m-(1).png',
  'https://i.postimg.cc/fTwQGQVk/Gemini-Generated-Image-wp026mwp026mwp02.png',
  'https://i.postimg.cc/6qtFxC51/Gemini-Generated-Image-ok2xdeok2xdeok2x.jpg',
  'https://i.postimg.cc/K8RwbGxG/Gemini-Generated-Image-ta7494ta7494ta74.png'
];
var SKIN_TORSO = 1;   // how much of the picture's character (from the bottom) is used as the body: 1 = all of it, stretched to the exact body size
var SKIN = SKIN_URLS.map(function (u) {
  var o = { img: null, cv: null, ok: false, col: null }, im = new Image(); im.crossOrigin = 'anonymous';
  im.onload = function () { try { o.cv = skinTorso(im); o.col = skinColors(o.cv); o.ok = !!o.cv; } catch (e_) { o.ok = false; } if (typeof fitRefresh === 'function') fitRefresh(); };
  im.onerror = function () { o.ok = false; }; im.src = u; o.img = im; return o;
});
// Find the character in the picture (drop the plain background), keep only its torso part.
function skinTorso(im) {
  var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, 700 / Math.max(w, h)), W2 = Math.max(1, Math.round(w * k)), H2 = Math.max(1, Math.round(h * k));
  var t = document.createElement('canvas'); t.width = W2; t.height = H2; var g = t.getContext('2d'); g.drawImage(im, 0, 0, W2, H2);
  var d = g.getImageData(0, 0, W2, H2), p = d.data, bg = [[0, 0], [W2 - 1, 0], [0, H2 - 1], [W2 - 1, H2 - 1]].map(function (q) { var i = (q[1] * W2 + q[0]) * 4; return [p[i], p[i + 1], p[i + 2]]; });
  var b = [0, 0, 0]; bg.forEach(function (q) { b[0] += q[0] / 4; b[1] += q[1] / 4; b[2] += q[2] / 4; });
  var x0 = W2, y0 = H2, x1 = -1, y1 = -1;
  for (var y = 0; y < H2; y++) for (var x = 0; x < W2; x++) {
    var i = (y * W2 + x) * 4, a = p[i + 3];
    var df = Math.abs(p[i] - b[0]) + Math.abs(p[i + 1] - b[1]) + Math.abs(p[i + 2] - b[2]);
    if (a > 40 && df > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = W2 - 1; y1 = H2 - 1; }
  var bw = x1 - x0 + 1, bh = y1 - y0 + 1, ty = y0 + Math.round(bh * (1 - SKIN_TORSO)), th = y1 - ty + 1;
  var o = document.createElement('canvas'); o.width = bw; o.height = th; var og = o.getContext('2d'); og.drawImage(t, x0, ty, bw, th, 0, 0, bw, th);
  // remove the plain background colour from the crop
  var e = og.getImageData(0, 0, bw, th), q = e.data;
  for (var n = 0; n < q.length; n += 4) { if (Math.abs(q[n] - b[0]) + Math.abs(q[n + 1] - b[1]) + Math.abs(q[n + 2] - b[2]) < 60) q[n + 3] = 0; }
  og.putImageData(e, 0, 0); return o;
}

// Dominant colour of the body picture -> cap, sleeves, arms, legs and pants take it.
function skinColors(cv_) {
  var g = cv_.getContext('2d'), w = cv_.width, h = cv_.height, p = g.getImageData(0, 0, w, h).data, bins = {}, best = null, bn = 0;
  for (var i = 0; i < p.length; i += 4) {
    if (p[i + 3] < 128) continue;
    var key = (p[i] >> 5) * 64 + (p[i + 1] >> 5) * 8 + (p[i + 2] >> 5), b = bins[key] || (bins[key] = { n: 0, r: 0, g: 0, b: 0 });
    b.n++; b.r += p[i]; b.g += p[i + 1]; b.b += p[i + 2]; if (b.n > bn) { bn = b.n; best = b; }
  }
  var r = best ? best.r / best.n : 120, gg = best ? best.g / best.n : 120, bb = best ? best.b / best.n : 120;
  function hx(k) { function z(v) { v = Math.max(0, Math.min(255, Math.round(v * k))); return (v < 16 ? '0' : '') + v.toString(16); } return '#' + z(r) + z(gg) + z(bb); }
  return { hat: hx(0.8), shirt: hx(1), under: hx(1.15), sleeve: hx(1), pants: hx(0.7), limbL: hx(1.1), limbD: hx(1.1) };
}

// ---- FIT: body skin + hair + cap + face ----
var HAIR_COLS = ['#2b1b10', '#0d0d0d', '#8a5a2b', '#e0b04a', '#c8431f', '#e9e9ee', '#2f7be0', '#e2569e'];
var HAIR_N = ['Short', 'Spiky', 'Mohawk', 'Afro', 'Long', 'Ponytail', 'Bun', 'Swoop', 'Pompadour', 'Curly'];
var CAP_N = ['Classic', 'Beanie', 'Helmet', 'Cowboy', 'Top Hat', 'Bandana', 'Crown', 'Viking', 'Wizard', 'Beret'];
var FACE_N = ['Classic', 'Happy', 'Angry', 'Laugh', 'Cool', 'Sad', 'Shocked', 'Wink', 'Cute', 'Pirate'];

// ---- SHOES: 10 designs. Drawn in a local frame whose origin is the ankle (the character faces +x). ----
var SHOE_N = ['Army Boot', 'Combat Black', 'White Sneaker', 'Red Sneaker', 'Brown Boot', 'Desert Boot', 'Blue Runner', 'Gold Boot', 'Camo Boot', 'Neon Runner'];
//             upper      sole       collar  accent     laces
var SHOE_D = [
  ['#556b2f', '#1c1c1c', 3.4, '#8a9a4a', '#d8c88a'],
  ['#232323', '#4a4a4a', 3.8, '#5a5a5a', '#b5b5b5'],
  ['#f6f6f6', '#c9ced4', 0.8, '#d32c1b', '#8a8f96'],
  ['#d83a2a', '#ffffff', 0.8, '#ffffff', '#ffffff'],
  ['#8a5528', '#2b1a0c', 3.4, '#b87a40', '#ead7ab'],
  ['#d2b27a', '#9a7a48', 2.2, '#b99a62', '#fff1d0'],
  ['#2b74e0', '#ffffff', 0.8, '#7fe0ff', '#ffffff'],
  ['#f0bb25', '#3a2a05', 3.4, '#fff1b0', '#5a3a05'],
  ['#5a6e32', '#1f2610', 3.4, '#3a4520', '#cfc08a'],
  ['#2ee66a', '#202020', 0.8, '#ff3da6', '#ffffff']
];
function shoeUpper(hi) {
  c.beginPath(); c.moveTo(-4.5, -hi); c.lineTo(3.7, -hi); c.lineTo(4.2, 1.3); c.bezierCurveTo(7.3, 1.5, 9.8, 2.3, 11.3, 4); c.lineTo(11.5, 5); c.lineTo(-5.1, 5); c.lineTo(-4.9, 0.6); c.closePath();
}
function drawShoe(i) {
  var d = SHOE_D[i] || SHOE_D[0], hi = d[2], y;
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = 0.9; c.strokeStyle = '#17120f';
  c.fillStyle = d[0]; shoeUpper(hi); c.fill(); c.stroke();
  if (i === 8) {   // camo blotches
    c.save(); shoeUpper(hi); c.clip();
    c.fillStyle = '#34401c'; [[-2.5, -1, 3.2, 2], [4, 2.6, 3.6, 1.8], [9.5, 3.4, 2.4, 1.4], [-1, 3.6, 2.8, 1.4]].forEach(function (b) { c.beginPath(); c.ellipse(b[0], b[1], b[2], b[3], 0.4, 0, TAU); c.fill(); });
    c.fillStyle = '#7a5a2a'; [[1.5, -1.6, 2.2, 1.2], [6, 1.6, 2, 1.1], [-3, 2, 1.6, 1]].forEach(function (b) { c.beginPath(); c.ellipse(b[0], b[1], b[2], b[3], -0.3, 0, TAU); c.fill(); });
    c.restore();
  }
  c.strokeStyle = d[3]; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-3.2, 3.5); c.quadraticCurveTo(1.5, 3.3, 4.8, 1.7); c.stroke();
  c.strokeStyle = d[4]; c.lineWidth = 0.8;
  for (y = -hi + 1; y < 1.3; y += 1.5) { c.beginPath(); c.moveTo(1.4, y); c.lineTo(3.9, y + 0.5); c.stroke(); }
  c.fillStyle = d[1]; rp(-5.6, 4.4, 17.6, 2.3, 1.1); c.fill(); c.strokeStyle = '#17120f'; c.lineWidth = 0.9; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(8.6, 3.1, 2, 0.9, 0.5, 0, TAU); c.fill();
  c.restore();
}
// ---- OUTFITS: full-costume pictures (cap, both arms in 2 poses, torso, legs, boots). Pictures load from the internet. ----
var HEAD_TOUCH = 24.6;   // headBottom for a new outfit: the bottom of the head picture sits exactly on the top of the torso (use 'headBottom: HEAD_TOUCH' in the outfit)
var OUTFIT_N = ['Masked', 'Kung Fu', 'Pharaoh', 'Pirate', 'Helmet', 'Mask', 'Outfit 3', 'Outfit 4', 'Outfit 5', 'Outfit 6', 'Outfit 7', 'Outfit 8', 'Outfit 9', 'Outfit 10', 'Outfit 11', 'Outfit 12', 'Outfit 13', 'Outfit 14', 'Outfit 15', 'Outfit 16', 'Outfit 18', 'Outfit 19', 'Outfit 21', 'Outfit 22', 'Outfit 23', 'Outfit 24', 'Outfit 25', 'Outfit 26', 'Outfit 27', 'Outfit 28', 'Outfit 29', 'Outfit 30', 'Outfit 31', 'Outfit 32', 'Outfit 33', 'Enemy'];
var OUTFITS = [{   // Masked (postimg gallery YSVtNZW) - 8 parts: legs include the boot
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'DSfy5YPL/02-head-mask.png',
    hL: 'ZWYKjDxB/01-left-upper-arm.png',
    hR: '21j8TX7W/03-right-upper-arm.png',
    fL: 'BjZQNwB2/04-left-lower-arm-hand.png',
    fR: 'k2jMHFTW/06-right-lower-arm-hand.png',
    torso: 'qNmBFX1R/05-torso.png',
    legL: 'LJy4WBxT/07-left-leg.png',
    legR: 'jD8q1QMc/08-right-leg.png'
  }, parts: {}, mm: true, capBox: [40, 27, 38], capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true, bodyFit: true
}, {
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'rD3zq7VR/02-straw-hat.png',
    hL: '5XTjfD4q/01-left-horizontal-arm.png',
    hR: 'pm4yP3Wf/03-right-horizontal-arm.png',
    torso: 'yDtW721T/04-kung-fu-torso-sash.png',
    fL: '8FvccwcR/05-left-forearm-glove.png',
    fR: '06SjjZjJ/06-right-forearm-glove.png',
    legL: '2qWyyTyG/07-left-pant-leg.png',
    legR: 'LqP55v5v/08-right-pant-leg.png',
    bootL: 'Tyb11Q1t/09-left-boot.png',
    bootR: 'Y4F0080y/10-right-boot.png'
  }, parts: {}, bootFit: true, capBox: [46, 9, 26]
}, {   // Pharaoh (postimg gallery 851x6b4) - 8 parts: legs include the boot
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'kRFqvxVW/02-pharaoh-head.png',
    hL: 'sGR3Wn2g/01-left-horizontal-arm.png',
    hR: 'T5XTbkPp/03-right-horizontal-arm.png',
    fL: '4HbsQzKf/04-left-hanging-arm.png',
    fR: 'WtMNVP9v/06-right-hanging-arm.png',
    torso: 'rzSVTLh6/05-torso.png',
    legL: 'qg8JrdmJ/07-left-leg.png',
    legR: 'XXwjW027/08-right-leg.png'
  }, parts: {}, mm: true, capBox: [40, 27, 38], capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true, bodyFit: true
}, {
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'ZvbD07bP/01-pirate-hat.png',
    hL: 'Lh2WyXtp/02-left-horizontal-arm.png',
    hR: '5jgRDVgB/03-right-horizontal-arm.png',
    torso: 'SjdvHhdz/04-pirate-coat-torso.png',
    fL: 'MXqLsT76/05-left-forearm-glove.png',
    fR: 'hhcYCjLf/06-right-forearm-glove.png',
    legL: 'Dm6MRT6c/07-left-pant-leg.png',
    legR: '9zbnshb1/08-right-pant-leg.png',
    bootL: 'BtpVR0pm/09-left-boot.png',
    bootR: '23GKgDG9/10-right-boot.png'
  }, parts: {}, bootFit: true, capBox: [44, 9, 26]
}, {   // Helmet (postimg gallery MpJMHcy)
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'bJstFjgS/01-helmet.png',
    hL: '26MBsX9F/03-left-upper-arm.png',
    hR: 'xChbwFpG/02-right-upper-arm.png',
    torso: 'NM5HPwDN/04-torso.png',
    fL: 'JnGkdWx2/05-left-forearm-hand.png',
    fR: '1tfqYZB7/06-right-forearm-hand.png',
    legL: 'V6pbxHZF/07-left-leg.png',
    legR: 'QtwW2nYb/08-right-leg.png',
    bootL: 'qRSCPZDw/09-left-boot.png',
    bootR: 'MTNjCr3t/10-right-boot.png'
  }, parts: {}, bootFit: true, capBox: [42, 27, 38], mm: true, hideHead: true
}, {   // Mask (postimg gallery 8vtff27)
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'NjrHrPwk/01-head-mask.png',
    hL: 'g26Z6BPM/02-left-fist-arm.png',
    hR: 'QdWTWnrY/03-right-fist-arm.png',
    torso: 'fR090gh6/06-torso.png',
    fL: '0yJwJHqH/04-left-hand-arm.png',
    fR: 'wB8s5c64/05-right-hand-arm.png',
    legL: 'tgQVdtXM/07-left-leg.png',
    legR: 'JhVB3c1F/08-right-leg.png',
    bootL: 'YSKmNfpZ/09-left-foot.png',
    bootR: 'QMGWgkXR/10-right-foot.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head'
}, {   // Outfit 3 (postimg gallery L4bq3th)
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'fbNJSzCV/01-alras.png',
    hL: 'DzT84v6s/02-aldhra%CA%BF-al%CA%BFlwy-alaysr.png',
    hR: 'TP6p5d0n/03-aldhra%CA%BF-al%CA%BFlwy-alaymn.png',
    torso: '43QnzD27/06-aljsm.png',
    fL: 'YSzj15D0/04-aldhra%CA%BF-alsfly-alaysr.png',
    fR: 'FK47krpj/05-aldhra%CA%BF-alsfly-alaymn.png',
    legL: '7LnbgFtT/07-alrjl-alysry.png',
    legR: 'W4wtMBYk/08-alrjl-alymny.png',
    bootL: 'VNW5jxZt/09-alqdm-alysry.png',
    bootR: 'vmtDWJ2f/10-alqdm-alymny.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head'
}, {   // Outfit 4 (postimg gallery t45LhWG)
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'KK8JN4kB/01-head.png',
    hL: '06XZHxDD/02-upper-arm-left.png',
    hR: 'VSZ4H1nj/03-upper-arm-right.png',
    torso: 'B8nMgtLm/04-torso.png',
    fL: '2qS2w3bT/05-forearm-left.png',
    fR: 'qtDQZ0yx/06-forearm-right.png',
    legL: 'FfCGnm3T/07-leg-left.png',
    legR: '3yf9b7m9/08-leg-right.png',
    bootL: 'LqQv0RLy/09-boot-left.png',
    bootR: '67bz1wnj/10-boot-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5   // Outfit 4 only: this head design needs to sit a bit lower than the standard (HEAD_TOUCH)
}, {   // Outfit 5 (postimg gallery QcD0n18)
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'q6NqrPbp/01-head.png',
    torso: 'RqhNwtS9/02-torso.png',
    hL: 'Th1pnbR7/03-upper-arm-left.png',
    hR: 'mhkt79bp/04-upper-arm-right.png',
    fL: 'yWxk0R1s/05-forearm-hand-left.png',
    fR: 'qgqz2KJB/06-forearm-hand-right.png',
    legL: 'RqhNwtS0/07-leg-piece-left.png',
    legR: 'z3vVThz3/08-leg-piece-right.png',
    bootL: 'K4jRtTG1/09-boot-left.png',
    bootR: 'pySyCdrV/10-boot-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 6 (postimg gallery VXRvjPL)
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'xqBTHFp5/01-head.png',
    torso: 'N5TGx7ZS/02-torso.png',
    hL: '4mt41bjW/03-upper-arm-left.png',
    hR: 'BXDZCcRd/04-upper-arm-right.png',
    fL: 'Lnf4VBrK/05-forearm-hand-left.png',
    fR: 'Bj0S7P0q/06-forearm-hand-right.png',
    legL: 'dhYsNZY7/07-leg-piece-left.png',
    legR: 'yDH1p3H3/08-leg-piece-right.png',
    bootL: '87SpXfSM/09-boot-left.png',
    bootR: '18r9kRm8/10-boot-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 7 (postimg gallery TPbRNfj)
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'rzRq8Nyw/01-head.png',
    torso: 'jLVtCnCw/02-torso.png',
    hL: 'Hj8Tp9W5/03-upper-arm-left.png',
    hR: 'fkSMwfWm/04-upper-arm-right.png',
    fL: 'N5hBL2Lr/05-forearm-hand-left.png',
    fR: 'bsXpdSdQ/06-forearm-hand-right.png',
    legL: 'Tp8fh5hV/07-leg-piece-left.png',
    legR: 'SJ0kjYjL/08-leg-piece-right.png',
    bootL: '6ystT4TL/09-boot-left.png',
    bootR: 'bsXpdSdL/10-boot-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 8 (postimg gallery c8FxJsK)
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'zHTmTp3n/01-head.png',
    torso: 'rz4L6ygd/02-torso.png',
    hL: 'F1SQtFGZ/03-upper-arm-left.png',
    hR: 'c63Nq1T3/04-upper-arm-right.png',
    fL: 'nCtfn8wq/05-forearm-hand-left.png',
    fR: 'kBdP7rh0/06-forearm-hand-right.png',
    legL: 'zV1Yqmcq/07-leg-piece-left.png',
    legR: 'qzXVRmPf/08-leg-piece-right.png',
    bootL: 'fJjnLHGh/09-boot-left.png',
    bootR: 'Wh6L39Bv/10-boot-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 9 (postimg gallery jnCsqd0)
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'pyqXCTmQ/01-head.png',
    hL: 'vcT8Nsn2/02-upper-arm-left.png',
    hR: 'QHCNy37f/03-upper-arm-right.png',
    fL: 'F7zFB4S6/04-lower-arm-left.png',
    fR: 'TKWdTJC7/05-lower-arm-right.png',
    torso: 'F7zFB4cX/06-torso.png',
    legL: 'CRfhwsmW/07-leg-left.png',
    legR: 'TyMR154H/08-leg-right.png',
    bootL: 'Ff59zkBM/09-boot-left.png',
    bootR: '945W0wkf/10-boot-right.png'
  }, parts: {}, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5, legIn: 1.5, bootFit: true
}, {   // Outfit 10 (postimg gallery zgN30bq)
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'cvcDgV9Q/01-head.png',
    hL: 'cK9XTfNW/02-upper-arm-left.png',
    hR: '06WcZ7qx/03-upper-arm-right.png',
    fL: 'rdnQg52v/04-lower-arm-left.png',
    fR: 'sQbKCyXZ/05-lower-arm-right.png',
    torso: 'phmkSy2d/06-torso.png',
    legL: 'XGtx63Jx/07-leg-left.png',
    legR: 'R62Gx9Fb/08-leg-right.png',
    bootL: 'k6LwP94F/09-boot-left.png',
    bootR: '7GjXrDhy/10-boot-right.png'
  }, parts: {}, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5, legIn: 1.5, bootFit: true
}, {   // Outfit 11 (postimg gallery sRRRLDc)
  base: 'https://i.postimg.cc/',
  files: {
    hL: 'vcBWR36M/01-arm-left.png',
    cap: 'xcCKrtNh/02-head.png',
    hR: '6y3dsYGs/03-arm-right.png',
    fL: 'PPxmG2vg/04-hand-arm-left.png',
    torso: '1ftpxJNS/05-torso.png',
    fR: 'LnXzdNZK/06-hand-arm-right.png',
    legL: 'tYMF9WhQ/07-leg-left.png',
    legR: 'rKP5qxS6/08-leg-right.png',
    bootL: 'BXV2JHx0/09-shoe-left.png',
    bootR: 'vcN5GfWy/10-shoe-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 12 (postimg gallery XFdrrWw)
  base: 'https://i.postimg.cc/',
  files: {
    hL: 'DSG4FDvC/01-arm-left.png',
    cap: 'mP91RqLC/02-head.png',
    hR: '5XzQ1G4K/03-arm-right.png',
    fL: 'xXmNY7f6/04-forearm-left.png',
    torso: 'LJPgR79N/05-torso.png',
    fR: '87vfD3pb/06-forearm-right.png',
    legL: 'VJt01TfH/07-leg-left.png',
    legR: 'Xr5B3hjP/08-leg-right.png',
    bootL: '0zSKx3k3/09-shoe-left.png',
    bootR: '5XzQ1G4T/10-shoe-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 13 (postimg gallery WjgJ21S)
  base: 'https://i.postimg.cc/',
  files: {
    hL: 'crgrMjny/01-arm-left.png',
    cap: '9rRrtS73/02-head.png',
    hR: 'TpLpqSDx/03-arm-right.png',
    fL: 'KRkRrVM2/04-hand-arm-left.png',
    torso: 'VdrdBTCc/05-torso.png',
    fR: 'CzBzHtqp/06-hand-arm-right.png',
    legL: 'XpGpchC3/07-leg-left.png',
    legR: 'LnYnB712/08-leg-right.png',
    bootL: 'ZCBCFgdJ/09-shoe-left.png',
    bootR: 'tYZYtfxX/10-shoe-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 14 (postimg gallery b8VNfXm)
  base: 'https://i.postimg.cc/',
  files: {
    hL: 'qt0qrvZy/01-arm-left.png',
    cap: '2qmyYSX6/02-head.png',
    hR: 'VS1vwkHj/03-arm-right.png',
    fL: 'McxHwprQ/04-hand-arm-left.png',
    torso: 'Y4k07Cyg/05-torso.png',
    fR: 'f3ZysRgd/06-hand-arm-right.png',
    legL: 'f3ZysRgc/07-leg-left.png',
    legR: 'zLjBGY93/08-leg-right.png',
    bootL: 'PL4x5nBC/09-shoe-left.png',
    bootR: '1gHt31Lg/10-shoe-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 15 (postimg gallery 92wwjh5)
  base: 'https://i.postimg.cc/',
  files: {
    hL: 'w13Ynyzd/01-arm-left.png',
    cap: '0bVqtGLX/02-head.png',
    hR: 'mPhWKz4f/03-arm-right.png',
    fL: 'TKhvBLxv/04-hand-arm-left.png',
    torso: 'TKSvxd2R/05-torso.png',
    fR: 'RW8xmSC6/06-hand-arm-right.png',
    legL: '0z31vk5K/07-leg-left.png',
    legR: 'nX5fxFV4/08-leg-right.png',
    bootL: 'qNYHrJBX/09-shoe-left.png',
    bootR: 'v1VFHJDL/10-shoe-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 16 (postimg gallery 1NPS8Ty)
  base: 'https://i.postimg.cc/',
  files: {
    hL: 'k6sjnsFC/wooden-man-part-01.png',
    cap: 'cKQ9z0vx/wooden-man-part-02.png',
    hR: 'p5dsyjqb/wooden-man-part-03.png',
    fL: 'XGL2VLcS/wooden-man-part-04.png',
    torso: 'FdpP9pbB/wooden-man-part-05.png',
    fR: 'cghDshMN/wooden-man-part-06.png',
    legL: '5Qtsjznv/wooden-man-part-07.png',
    legR: 'Yj2nXckD/wooden-man-part-08.png',
    bootL: 'FkKT1SDJ/wooden-man-part-09.png',
    bootR: 'MXZPskxs/wooden-man-part-10.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 18 (postimg gallery 4K2yMzf)
  base: 'https://i.postimg.cc/',
  files: {
    cap: '8j6h4wFx/01-head-black-fedora.png',
    hL: 'VdCjg4rQ/02-left-top-arm.png',
    hR: 'rKrSjg02/03-right-top-arm.png',
    fR: 'MvQy5tMz/04-right-lower-arm-hand.png',
    fL: 'MvQy5tMH/05-left-lower-arm-hand.png',
    torso: 'xczK5gJd/06-suit-torso-red-tie.png',
    legR: 'SJMWdV2j/07-right-leg.png',
    legL: 'fVQYrXms/08-left-leg.png',
    bootL: 'sMC5NS7s/09-left-shoe.png',
    bootR: '75rSW70x/10-right-shoe.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 19 (postimg gallery vVRkD2v)
  base: 'https://i.postimg.cc/',
  files: {
    hL: 'GBqYt5N8/01-left-arm.png',
    cap: 't12PJMfY/02-head-hat.png',
    hR: 'DWBs0MD4/03-right-arm.png',
    fL: 'B8MDbVyF/04-left-hand-arm.png',
    torso: 'TyCm14Sm/05-suit-torso.png',
    fR: '7Cm7hWc0/06-right-hand-arm.png',
    legL: 'NypTFzV1/07-left-leg.png',
    legR: 'R3XfhD87/08-right-leg.png',
    bootL: 'GBqYt5NP/09-left-shoe.png',
    bootR: 'xktH847y/10-right-shoe.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 21 (postimg gallery Pw759jy)
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'TpVKhs5P/01-head.png',
    hL: 'TpVKhs55/02-arm-left.png',
    hR: 'fJcVkPSx/03-arm-right.png',
    fL: 'v4Gcnv54/04-hand-left.png',
    fR: 'SnmJ9Gc8/05-hand-right.png',
    torso: 'G4bHDjvy/06-torso.png',
    legL: 'LJmnPVjz/07-leg-left.png',
    legR: 'QFjH7qck/08-leg-right.png',
    bootL: 'SnmJ9Gcf/09-shoe-left.png',
    bootR: 'hXKfm0VM/10-shoe-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 22 (postimg gallery c3sGFkh)
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'p96Tgb3b/01-head.png',
    hL: 'sQGXzHCt/02-arm-left.png',
    hR: 'Vr06wZcw/03-arm-right.png',
    fL: '9RwM2gjH/04-hand-left.png',
    fR: 'jwn5T3rK/05-hand-right.png',
    torso: 'XGBJW16h/06-torso.png',
    legL: 'PpvxHVkL/07-leg-left.png',
    legR: 'r0RmTZLz/08-leg-right.png',
    bootL: 'Q9KtDYrH/09-shoe-left.png',
    bootR: 'WFq3VYPq/10-shoe-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5
}, {   // Outfit 23 (postimg gallery v4tD2n2)
  base: 'https://i.postimg.cc/',
  files: {
    cap: '8FHpqfFx/head.png',
    hL: 'LqT9rgYR/left-upper-arm.png',
    hR: 'QBb8RK9d/right-upper-arm.png',
    fL: 'Y43rJLGp/left-forearm-hand.png',
    fR: 'hJrDHQz4/right-forearm-hand.png',
    torso: 'jWXxGnwd/torso.png',
    legL: 'Ty9dZ5LP/left-leg.png',
    legR: '3yB8P04W/right-leg.png',
    bootL: 'HJ2Yf8cn/left-boot.png',
    bootR: 'CZNhWnBR/right-boot.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true, classicShoe: true
}, {   // Outfit 24 (postimg gallery x9sy8f8) - same setup as Outfit 23
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'XXxYQYpD/01-head.png',
    hL: 'w7vTPYmV/03-arm-left-upper.png',
    hR: 'nMTh0hCg/04-arm-right-upper.png',
    fL: 'xcCT7VzP/05-arm-left-lower.png',
    fR: '4mdNMRc4/06-arm-right-lower.png',
    torso: 'LnX67FPK/02-torso.png',
    legL: 'ZCRKgzNb/07-leg-left.png',
    legR: '2V68JNW8/08-leg-right.png',
    bootL: 'zVcXY2w1/09-boot-left.png',
    bootR: 'YhsqBDNM/10-boot-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true, classicShoe: true
}, {   // Outfit 25 (postimg gallery J1LDRSQ) - same setup as Outfit 23
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'GTprZvHM/01-head-mask.png',
    hL: 'Z0YTBzV0/02-upper-arm-left.png',
    hR: 'Th2RLvCy/03-upper-arm-right.png',
    fL: 'qgBkhHjd/05-lower-arm-left.png',
    fR: 'Yj2pGBbH/06-lower-arm-right.png',
    torso: '3WrK4QnJ/04-torso.png',
    legL: '3WrK4Qn8/07-leg-left.png',
    legR: 'Jt71DCPn/08-leg-right.png',
    bootL: '23jzbN2n/09-boot-left.png',
    bootR: 'mhZbzW8Q/10-boot-right.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true, classicShoe: true
}, {   // Outfit 26 (postimg gallery qBqNhtc) - 8 parts: legs include the boot
  base: 'https://i.postimg.cc/',
  files: {
    cap: '47HFc4LD/01-head.png',
    hL: 'gXLBhctb/03-left-upper-arm.png',
    hR: 'R6JbtCpB/04-right-upper-arm.png',
    fL: 'Kk3sTcpy/05-left-forearm-hand.png',
    fR: '2bLXWj9C/06-right-forearm-hand.png',
    torso: 'TL5Hb2Nx/02-torso.png',
    legL: 'MMfrBZ3W/07-left-leg-boot.png',
    legR: 'mz169Zpk/08-right-leg-boot.png'
  }, parts: {}, mm: true, capBox: [40, 27, 38], capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true
}, {   // Outfit 27 (postimg gallery Xvdy7Xy) - 8 parts: legs include the boot
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'pmVGZJcQ/01-head.png',
    hL: 'XrNH8k1s/02-left-upper-arm.png',
    hR: '5X973SKP/03-right-upper-arm.png',
    fL: 'hX4yr1ZZ/05-left-hand-arm.png',
    fR: 'WdpWnwfR/06-right-hand-arm.png',
    torso: 'dhQHBjNb/04-torso.png',
    legL: 'Xr22DBtD/07-left-leg-boot.png',
    legR: 'Xr22DBtP/08-right-leg-boot.png'
  }, parts: {}, mm: true, capBox: [40, 27, 38], capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true, bodyFit: true
}, {   // Outfit 28 (postimg gallery BLzmPhV) - 8 parts: legs include the boot
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'z3FHxc7G/01-head.png',
    hL: 'QVJKfymV/02-left-upper-arm.png',
    hR: 's14GTNmv/03-right-upper-arm.png',
    fL: 'rzNRfPjR/05-left-hand-arm.png',
    fR: 'mhy1m5jF/06-right-hand-arm.png',
    torso: 'c6BtFbhg/04-torso.png',
    legL: 'G9xTX5KD/07-left-leg-boot.png',
    legR: '0r0KVBnm/08-right-leg-boot.png'
  }, parts: {}, mm: true, capBox: [40, 27, 38], capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true, bodyFit: true
}, {   // Outfit 29 (postimg gallery sWrvLRP) - 8 parts: legs include the boot
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'WFPtnGJQ/01-head-hat.png',
    hL: '0MqrfYw1/03-arm-left.png',
    hR: 'zb13jCg1/02-arm-right.png',
    fL: 'njYrwXvR/05-hand-arm-left.png',
    fR: 'Kkrjs1ns/06-hand-arm-right.png',
    torso: 'N97FPK1C/04-torso-apron.png',
    legL: '1ncXY8pj/07-leg-left.png',
    legR: 'BLcbwjxz/08-leg-right.png'
  }, parts: {}, mm: true, capBox: [40, 27, 38], capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true, bodyFit: true
}, {   // Outfit 30 (postimg gallery XjP0DYS) - 8 parts: legs include the boot
  base: 'https://i.postimg.cc/',
  files: {
    cap: '7b9b3TPM/01-head.png',
    hL: '6TcTrG6P/03-left-upper-arm.png',
    hR: 't7k73VRf/04-right-upper-arm.png',
    fL: 'c6h6R81P/05-left-lower-arm-hand.png',
    fR: '2V5y283X/06-right-lower-arm-hand.png',
    torso: 'ykNxvYWL/02-torso.png',
    legL: 'bsvr3Nd4/07-left-leg-foot.png',
    legR: 'CzK5mLzT/08-right-leg-foot.png'
  }, parts: {}, mm: true, capBox: [40, 27, 38], capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true, bodyFit: true
}, {   // Outfit 31 (postimg gallery mLnG6gD) - 8 parts: legs include the boot
  base: 'https://i.postimg.cc/',
  files: {
    cap: '68kQWrcg/01-head.png',
    hL: '21s5kQGs/03-left-upper-arm.png',
    hR: 'k205JQwm/04-right-upper-arm.png',
    fL: 'VJxNfq4P/05-left-lower-arm-hand.png',
    fR: 'G4WpLFzR/06-right-lower-arm-hand.png',
    torso: 'w1CBqXF8/02-torso.png',
    legL: 'WdB4NGSj/07-left-leg-foot.png',
    legR: 'hXkGDLMc/08-right-leg-foot.png'
  }, parts: {}, mm: true, capBox: [40, 27, 38], capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true, bodyFit: true
}, {   // Outfit 32 (postimg gallery JZBKCF6) - 8 parts: legs include the boot
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'XBK5dVN8/head.png',
    hL: 'SYL9CyQg/upper-arm-left.png',
    hR: 'FkbS39FP/upper-arm-right.png',
    fL: '0KGSD85L/lower-arm-left.png',
    fR: 'q6cKykBF/lower-arm-right.png',
    torso: '64VZn96S/torso.png',
    legL: 'FkbS39Fw/left-leg.png',
    legR: 'PvbDYtrj/right-leg.png'
  }, parts: {}, mm: true, capBox: [40, 27, 38], capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true, bodyFit: true
}, {   // Outfit 33 (postimg gallery 5j5brjp) - 8 parts: legs include the boot
  base: 'https://i.postimg.cc/',
  files: {
    cap: 'bGYmvBT6/head.png',
    hL: 'SXQgKvrt/upper-arm-left.png',
    hR: 'hJ42G5r5/upper-arm-right.png',
    fL: '7CPKLW98/lower-arm-left.png',
    fR: 'WDp54H8R/lower-arm-right.png',
    torso: 'sBfT2Nc8/torso.png',
    legL: 'v180mNzC/left-leg.png',
    legR: 'bGYmvBT7/right-leg.png'
  }, parts: {}, mm: true, capBox: [40, 27, 38], capFit: 'head', headBottom: HEAD_TOUCH + 4.5, classicLeg: true, bodyFit: true
}, {   // Enemy outfit (postimg gallery kKJ8jCS) - worn by all enemies (ENEMY_OUTFIT)
  base: 'https://i.postimg.cc/',
  files: {
    hL: 'xkTJwPCV/01-left-arm.png',
    cap: 'nX19SWHV/02-head.png',
    hR: 'R3V6kTFz/03-right-arm.png',
    fL: 'TyYLzcwT/04-left-hand-arm.png',
    torso: '3yJ4sZRT/05-torso.png',
    fR: 'XZ7GRgJ3/06-right-hand-arm.png',
    legL: 'p9XhwBTV/07-left-leg.png',
    legR: 'qtMhPGRM/08-right-leg.png',
    bootL: 'Nyf93xM0/09-left-boot.png',
    bootR: 'mc2zvSDD/10-right-boot.png'
  }, parts: {}, bootFit: true, capBox: [40, 27, 38], mm: true, capFit: 'head', headBottom: HEAD_TOUCH + 6, legWide: 1.12   // enemy only: legs a bit wider; head a bit lower than the standard +4.5
}];
var OUTFIT_OLD = OUTFIT_N.slice();
(function () {   // removed outfits: Kung Fu, Pirate, Mask, Outfit 3, 4, 5, 6, 7, 9, 10, 11, 13, 15, 22, 25, 30, 33
  if (OUTFITS.length !== OUTFIT_N.length) return;
  var DEL = ['Kung Fu', 'Pirate', 'Mask', 'Outfit 3', 'Outfit 9', 'Outfit 10', 'Outfit 15', 'Outfit 4', 'Outfit 5', 'Outfit 6', 'Outfit 7', 'Outfit 11', 'Outfit 13', 'Outfit 22', 'Outfit 25', 'Outfit 30', 'Outfit 33'], kO = [], kN = [];
  OUTFITS.forEach(function (o, i) { if (DEL.indexOf(OUTFIT_N[i]) < 0) { kO.push(o); kN.push(OUTFIT_N[i]); } });
  OUTFITS = kO; OUTFIT_N = kN;
})();
OUTFITS.forEach(function (of) {
  Object.keys(of.files).forEach(function (k) {
    var o = { src: null, w: 1, h: 1, ok: false }, u = of.base + of.files[k], im = new Image();
    function done(trim) {
      try {
        o.src = im; o.w = im.naturalWidth || 1; o.h = im.naturalHeight || 1;
        if (trim) {   // crop the transparent margins so the part can be placed exactly
          var t = document.createElement('canvas'); t.width = o.w; t.height = o.h; var x = t.getContext('2d'); x.drawImage(im, 0, 0);
          var d = x.getImageData(0, 0, o.w, o.h).data, x0 = o.w, y0 = o.h, x1 = -1, y1 = -1, i, j;
          for (j = 0; j < o.h; j++) for (i = 0; i < o.w; i++) if (d[(j * o.w + i) * 4 + 3] > 20) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
          if (x1 > x0 && y1 > y0) { var r = document.createElement('canvas'); r.width = x1 - x0 + 1; r.height = y1 - y0 + 1; r.getContext('2d').drawImage(t, x0, y0, r.width, r.height, 0, 0, r.width, r.height); o.src = r; o.w = r.width; o.h = r.height; }
        }
        if (/^boot/.test(k)) {   // which way does the toe point? the shaft (heavy upper part) is at the back, the toe at the other side
          var q = document.createElement('canvas'); q.width = o.w; q.height = o.h; var qg = q.getContext('2d'); qg.drawImage(o.src, 0, 0, o.w, o.h);
          var qd = qg.getImageData(0, 0, o.w, Math.max(1, Math.round(o.h * 0.5))).data, sx = 0, sm = 0, ii, jj, hh = Math.max(1, Math.round(o.h * 0.5));
          for (jj = 0; jj < hh; jj++) for (ii = 0; ii < o.w; ii++) { var al = qd[(jj * o.w + ii) * 4 + 3]; if (al > 20) { sx += ii; sm++; } }
          if (sm > 0) o.flip = (sx / sm) > o.w / 2;   // upper mass on the right -> toe points left -> flip so it points right
          var sh_ = Math.max(1, Math.round(o.h * 0.4)), sd_ = qg.getImageData(0, 0, o.w, sh_).data, sx2 = 0, sm2 = 0;   // shaft = top 40% of the boot: its centre (0..1 of the width, picture as drawn)
          for (jj = 0; jj < sh_; jj++) for (ii = 0; ii < o.w; ii++) if (sd_[(jj * o.w + ii) * 4 + 3] > 20) { sx2 += ii; sm2++; }
          if (sm2 > 0) o.scx = (sx2 / sm2 + 0.5) / o.w;
          var bmn = o.w, bmx = -1; for (jj = 0; jj < sh_; jj++) for (ii = 0; ii < o.w; ii++) if (sd_[(jj * o.w + ii) * 4 + 3] > 20) { if (ii < bmn) bmn = ii; if (ii > bmx) bmx = ii; } if (bmx >= bmn) { o.sw = (bmx - bmn + 1) / o.w; o.sx0 = bmn / o.w; o.sx1 = (bmx + 1) / o.w; }   // width of the boot shaft (0..1)
        }
        if (/^leg/.test(k)) {   // full leg picture (leg + boot in one image): width / centre of the upper part (the leg itself) and which way the toe points
          var fq = document.createElement('canvas'); fq.width = o.w; fq.height = o.h; var fg = fq.getContext('2d'); fg.drawImage(o.src, 0, 0, o.w, o.h);
          var ft_ = Math.max(1, Math.round(o.h * 0.4)), fb_ = Math.max(1, Math.round(o.h * 0.2)), fd_ = fg.getImageData(0, 0, o.w, ft_).data, fe_ = fg.getImageData(0, o.h - fb_, o.w, fb_).data, fi, fj, fmn = o.w, fmx = -1, fs1 = 0, fn1 = 0, fs2 = 0, fn2 = 0;
          for (fj = 0; fj < ft_; fj++) for (fi = 0; fi < o.w; fi++) if (fd_[(fj * o.w + fi) * 4 + 3] > 20) { if (fi < fmn) fmn = fi; if (fi > fmx) fmx = fi; fs1 += fi; fn1++; }
          for (fj = 0; fj < fb_; fj++) for (fi = 0; fi < o.w; fi++) if (fe_[(fj * o.w + fi) * 4 + 3] > 20) { fs2 += fi; fn2++; }
          if (fmx >= fmn) { o.tw = (fmx - fmn + 1) / o.w; o.tcx = (fmn + fmx + 1) / 2 / o.w; }
          if (fn1 > 0 && fn2 > 0) o.lflip = (fs2 / fn2) < (fs1 / fn1);   // bottom (boot) mass left of the leg -> toe points left -> flip it to point right
        }
        if (/^leg/.test(k)) {   // where does the leg end? centre of its bottom 20% (0..1 of the width)
          var lq = document.createElement('canvas'); lq.width = o.w; lq.height = o.h; var lg = lq.getContext('2d'); lg.drawImage(o.src, 0, 0, o.w, o.h);
          var lh_ = Math.max(1, Math.round(o.h * 0.2)), ld_ = lg.getImageData(0, o.h - lh_, o.w, lh_).data, lx = 0, lm = 0, li, lj;
          for (lj = 0; lj < lh_; lj++) for (li = 0; li < o.w; li++) if (ld_[(lj * o.w + li) * 4 + 3] > 20) { lx += li; lm++; }
          if (lm > 0) o.bcx = (lx / lm + 0.5) / o.w;
          var lmn = o.w, lmx = -1; for (lj = 0; lj < lh_; lj++) for (li = 0; li < o.w; li++) if (ld_[(lj * o.w + li) * 4 + 3] > 20) { if (li < lmn) lmn = li; if (li > lmx) lmx = li; } if (lmx >= lmn) { o.bw = (lmx - lmn + 1) / o.w; o.bx1 = (lmx + 1) / o.w; }   // width of the leg end (0..1)
        }
        if (k === 'torso') {   // hip width: the lowest part of the torso picture (0..1 of its width)
          var tq = document.createElement('canvas'); tq.width = o.w; tq.height = o.h; var tg = tq.getContext('2d'); tg.drawImage(o.src, 0, 0, o.w, o.h);
          var th_ = Math.max(1, Math.round(o.h * 0.22)), td_ = tg.getImageData(0, o.h - th_, o.w, th_).data, tmn = o.w, tmx = -1, ti, tj;
          for (tj = 0; tj < th_; tj++) for (ti = 0; ti < o.w; ti++) if (td_[(tj * o.w + ti) * 4 + 3] > 20) { if (ti < tmn) tmn = ti; if (ti > tmx) tmx = ti; }
          if (tmx >= tmn) { o.hl = tmn / o.w; o.hr = (tmx + 1) / o.w; }
        }
      } catch (e_) { }
      o.ok = true; if (typeof fitRefresh === 'function') fitRefresh();
    }
    im.crossOrigin = 'anonymous';
    im.onload = function () { done(true); };
    im.onerror = function () { im = new Image(); im.onload = function () { done(false); }; im.src = u; };   // retry without CORS (no trimming)
    im.src = u; of.parts[k] = o;
  });
});
// ---- BODY FIT: every outfit picture is fitted to the SAME fixed body boxes (the picture size / margins do not matter) ----
var FIT_TORSO_DIST = 1.15;   // torso: fills the torso box; the picture may be stretched at most 15% out of its own shape
var FIT_ARM_L = 20.5, FIT_ARM_T0 = 7.2, FIT_ARM_T1 = 8.4;   // arms: fixed length, thickness between 7.2 and 8.4 (almost the same for every outfit)
var FIT_LEG_HIDE = 0.10;     // the part of the leg (or foot) picture that may be hidden behind the torso / the leg end: 10% only
var FIT_LEG_GROUND = 21.1;   // leg space: y of the sole (same ground line for every outfit)
function fitLegTop(yb) { var tb = (TY1 - (LEG_PIVOT - 1.0125 * BK)) / BK; return (tb - FIT_LEG_HIDE * yb) / (1 - FIT_LEG_HIDE); }   // leg space: tb = y where the torso ends   // top of a leg picture that ends at yb so that exactly FIT_LEG_HIDE of it is behind the torso
function ofLegFit(OF) {   // both legs stay inside the torso (hips): shift towards the middle first, then narrow; cached per outfit
  if (OF._lf) return OF._lf;
  if (OF.classicLeg) return (OF._lf = { sx: LEG_SX, ins: 0 });   // classic (wide) legs, same width and place as the original body
  var tp = ofPart(OF, 'torso'), pr = ofPart(OF, 'legR'), pl = ofPart(OF, 'legL'), base = OF.legIn || 0;
  if (!tp || !pr || !pl) return { sx: LEG_SX, ins: base };
  var x0 = OF.mm ? TX0 : TX0 - 0.8, x1 = OF.mm ? TX1 : TX1 + 0.8, hl = x0, hr = x1, res = { sx: 0.7, ins: base };
  if (tp.hl != null) { hl = x0 + tp.hl * (x1 - x0); hr = x0 + tp.hr * (x1 - x0); }
  for (var s = LEG_SX; s >= 0.7; s -= 0.02) {
    var hw = 4.375 * s * BK, need = Math.max(base, hl + hw - LEG_L, LEG_R + hw - hr), cap = (LEG_R - LEG_L + 1.5 - 2 * hw) / 2;
    if (need <= Math.max(cap, base)) { res = { sx: s, ins: need }; break; }
  }
  if (OF.legWide) { var hw0_ = 4.375 * res.sx * BK, hw1_ = hw0_ * OF.legWide; res = { sx: res.sx * OF.legWide, ins: Math.min(6.4, res.ins + (hw1_ - hw0_)) }; }   // wider legs grow INWARD: the outer edge stays where it was (inside the torso)
  OF._lf = res; return res;
}
var SHOE_BH = 6.6;   // classic shoe height (leg space)
OUTFITS.forEach(function (of) { of.mm = true; });   // every outfit uses the classic (original Mini Militia) part sizes
function ofPart(of, k) { var p = of && of.parts[k]; return p && p.ok ? p : null; }
function ofReady(of) { return !!of && Object.keys(of.parts).every(function (k) { return of.parts[k].ok; }); }
// draw a part so that its width is w (height follows the picture, limited to hmax); (ax, ay) = which point of the picture sits on (x, y)
function ofDraw(p, x, y, w, hmax, ax, ay) {
  var h = w * p.h / p.w; if (h > hmax) { h = hmax; }
  c.drawImage(p.src, x - ax * w, y - ay * h, w, h);
}
// Arm in the weapon-holding pose: picture points along the arm (shoulder at its left end, hand at its right end).
function ofArmHold(p, mm, flip) {
  if (!p) return false; var fit_ = mm === 2, L = fit_ ? FIT_ARM_L : (mm ? 20.5 : 22), th = fit_ ? Math.max(FIT_ARM_T0, Math.min(L * p.h / p.w, FIT_ARM_T1)) : Math.max(6.5, Math.min(L * p.h / p.w, mm ? 8.75 : 11.5));
  c.save(); c.translate(4.375, 0.9); c.rotate(Math.PI / 2);
  if (flip) { c.translate(-1 + L / 2, 0); c.scale(-1, 1); c.translate(1 - L / 2, 0); }   // the fist must always be at the hand end, never at the shoulder
  c.drawImage(p.src, -1, -th * 0.5, L, th); c.restore(); return true;
}
// The right arm picture (holds the gun) is the reference. If the left arm picture is the mirrored version of it (fist at the other end), flip it.
function ofSig(p) { var W = 24, H = 12, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var g = cv.getContext('2d'); g.drawImage(p.src, 0, 0, W, H); return g.getImageData(0, 0, W, H).data; }
function ofHoldFlip(of) {
  if (of._hf !== undefined) return of._hf;
  var a = ofPart(of, 'hR'), b = ofPart(of, 'hL'); if (!a || !b) return false;
  var f = true;
  try {
    var A = ofSig(a), B = ofSig(b), W = 24, H = 12, d0 = 0, d1 = 0, x, y, k;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) for (k = 0; k < 4; k++) { var i = (y * W + x) * 4 + k, j = (y * W + (W - 1 - x)) * 4 + k; d0 += Math.abs(A[i] - B[i]); d1 += Math.abs(A[i] - B[j]); }
    f = d1 < d0;   // mirrored copy matches the right arm better -> flip
  } catch (e_) { f = true; }   // pictures not readable (no CORS): they are mirrored copies, so flip
  of._hf = f; return f;
}
// Arm hanging free (forearm + glove): picture is vertical (shoulder at the top, glove at the bottom).
function ofArmFree(p, mm) {
  if (!p) return false; var fit_ = mm === 2, L = fit_ ? FIT_ARM_L : (mm ? 20.5 : 22), wide = p.w > p.h * 1.15, ar = wide ? p.h / p.w : p.w / p.h, th = fit_ ? Math.max(FIT_ARM_T0, Math.min(L * ar, FIT_ARM_T1)) : Math.max(6.5, Math.min(L * ar, mm ? 8.75 : 11.5));
  c.save(); c.translate(4.375, 0.9); if (wide) c.rotate(Math.PI / 2);
  if (wide) c.drawImage(p.src, -1, -th * 0.5, L, th); else c.drawImage(p.src, -th * 0.5, -1, th, L);
  c.restore(); return true;
}
var curOutfit = -1, curSkin = -1, curHair = -1, curCap = 0, curFace = 0, curHC = 0, curShoe = 0, fitOver = null;   // Classic look = skin -1, no hair, classic cap, classic face
try { localStorage.removeItem('mm_mask'); } catch (e_) { }
try { var cn_ = localStorage.getItem('mm_outfit_n'), co_ = cn_ != null ? OUTFIT_N.indexOf(cn_) : OUTFIT_N.indexOf(OUTFIT_OLD[parseInt(localStorage.getItem('mm_outfit'), 10)]); if (co_ >= 0) curOutfit = co_; } catch (e_) { }   // saved by name, so removing outfits never changes the chosen one
try { var cs_ = parseInt(localStorage.getItem('mm_fit'), 10); if (cs_ >= 0 && cs_ < SKIN_URLS.length) curSkin = cs_; } catch (e_) { }
try {
  var fj_ = JSON.parse(localStorage.getItem('mm_fit2') || '{}');
  if (fj_.s >= 0 && fj_.s < 10) curShoe = fj_.s; if (fj_.h >= -1 && fj_.h < 10) curHair = fj_.h; if (fj_.c >= -1 && fj_.c < 10) curCap = fj_.c; if (fj_.f >= 0 && fj_.f < 10) curFace = fj_.f; if (fj_.hc >= 0 && fj_.hc < HAIR_COLS.length) curHC = fj_.hc;
} catch (e_) { }
function saveFit() { try { localStorage.setItem('mm_outfit', String(curOutfit)); localStorage.setItem('mm_outfit_n', curOutfit >= 0 ? OUTFIT_N[curOutfit] : ''); } catch (e_) { } try { localStorage.setItem('mm_fit', String(curSkin)); localStorage.setItem('mm_fit2', JSON.stringify({ h: curHair, c: curCap, f: curFace, hc: curHC, s: curShoe })); } catch (e_) { } }
var DEF_LOOK = { outfit: -1, skin: -1, hair: -1, cap: 0, face: 0, hc: 0, shoe: 0 };
var ENEMY_OUTFIT = OUTFIT_N.indexOf('Enemy');   // index in OUTFITS worn by every enemy (bots and other players); -1 = the original enemy look
var ENEMY_LOOK = null;
function look(e) { if (fitOver) return fitOver; if (e === ME) return { outfit: curOutfit, skin: curSkin, hair: curHair, cap: curCap, face: curFace, hc: curHC, shoe: curShoe }; if (ENEMY_OUTFIT >= 0 && ENEMY_OUTFIT < OUTFITS.length) { if (!ENEMY_LOOK) { ENEMY_LOOK = {}; for (var k_ in DEF_LOOK) ENEMY_LOOK[k_] = DEF_LOOK[k_]; ENEMY_LOOK.outfit = ENEMY_OUTFIT; } return ENEMY_LOOK; } return DEF_LOOK; }
function shd(h, k) { var n = parseInt(h.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; function z(v) { v = Math.max(0, Math.min(255, Math.round(v * k))); return (v < 16 ? '0' : '') + v.toString(16); } return '#' + z(r) + z(g) + z(b); }
function star5(x, y, r) { c.beginPath(); for (var i = 0; i < 10; i++) { var an = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } c.closePath(); c.fill(); }
// Local coordinates: the head block is x 0..35, y 0..23.5 (the character faces right); the original cap spans y -8.55..6.75.
function hbase(top) {
  c.beginPath(); c.moveTo(-1.5, 9); c.lineTo(-1.5, 2); c.quadraticCurveTo(-1.5, top, 17.5, top); c.quadraticCurveTo(36.5, top, 36.5, 2); c.lineTo(36.5, 9);
  c.lineTo(30, 5.5); c.lineTo(23, 8); c.lineTo(15, 5.5); c.lineTo(7, 8); c.closePath(); c.fill();
}
var HAIRS = [
  function () { hbase(-6); },
  function () { hbase(-4); for (var i = 0; i < 6; i++) { var x = i * 6.2 - 1; c.beginPath(); c.moveTo(x, -3); c.lineTo(x + 3.4, -15 - (i % 2) * 3); c.lineTo(x + 6.6, -3); c.fill(); } },
  function () { c.beginPath(); c.moveTo(10, 6); c.lineTo(10, -6); c.lineTo(12, -12); c.lineTo(14.5, -8); c.lineTo(17.5, -19); c.lineTo(20.5, -8); c.lineTo(23, -12); c.lineTo(25, -6); c.lineTo(25, 6); c.closePath(); c.fill(); },
  function () { c.beginPath(); c.ellipse(17.5, -6, 26, 15, 0, 0, TAU); c.fill(); },
  function () { hbase(-6); rp(-8, -2, 11, 38, 5); c.fill(); rp(33, 0, 5, 20, 2.5); c.fill(); },
  function () { hbase(-6); c.beginPath(); c.moveTo(-1, 0); c.bezierCurveTo(-18, -4, -20, 18, -10, 28); c.bezierCurveTo(-8, 18, -6, 12, -1, 10); c.closePath(); c.fill(); c.fillStyle = '#e8344f'; rp(-4, 2, 5, 9, 2); c.fill(); },
  function () { hbase(-6); c.beginPath(); c.arc(17.5, -12, 8, 0, TAU); c.fill(); c.fillStyle = 'rgba(0,0,0,.35)'; rp(10, -7, 15, 3, 1.5); c.fill(); },
  function () { hbase(-6); c.beginPath(); c.moveTo(-1.5, -5); c.lineTo(37, -5); c.lineTo(37, 11); c.quadraticCurveTo(26, 3, 12, 5); c.quadraticCurveTo(4, 5, -1.5, 9); c.closePath(); c.fill(); },
  function () { hbase(-5); c.beginPath(); c.moveTo(4, 0); c.bezierCurveTo(2, -20, 26, -26, 36, -10); c.quadraticCurveTo(39, -2, 37, 6); c.lineTo(4, 6); c.closePath(); c.fill(); },
  function () { hbase(-4); [[3, -4], [10, -8], [17.5, -9], [25, -8], [32, -4], [-2, 3], [37, 3]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 5.5, 0, TAU); c.fill(); }); }
];
var HAIR_HL = [[14, -3, 8], [14, -6, 7], [17.5, -5, 2.5], [14, -9, 9], [14, -3, 8], [14, -3, 8], [17.5, -12, 3], [14, -3, 8], [16, -14, 8], [17.5, -8, 9]];
function domePath(l, r, top, bot) { c.beginPath(); c.moveTo(l, bot); c.quadraticCurveTo(l, top, 17.5, top); c.quadraticCurveTo(r, top, r, bot); c.closePath(); }
var CAPS = [
  function (h) { c.fillStyle = h; c.beginPath(); c.moveTo(0, 6.75); c.lineTo(0, 1.45); c.arcTo(0, -8.55, 10, -8.55, 10); c.lineTo(25, -8.55); c.arcTo(35, -8.55, 35, 1.45, 10); c.lineTo(35, 6.75); c.closePath(); c.fill(); c.fillRect(35, 4.75, 12.25, 2); },
  function (h) {   // beanie
    c.fillStyle = h; domePath(-1.5, 36.5, -13, 7); c.fill();
    c.strokeStyle = shd(h, 0.75); c.lineWidth = 1; for (var x = 4; x < 34; x += 5) { c.beginPath(); c.moveTo(x, -9); c.lineTo(x, 0); c.stroke(); }
    c.fillStyle = shd(h, 0.72); rp(-3, 0, 41, 8, 3); c.fill(); c.strokeStyle = shd(h, 0.5); for (var y = 2.5; y < 8; y += 2.5) { c.beginPath(); c.moveTo(-2, y); c.lineTo(37, y); c.stroke(); }
    c.fillStyle = shd(h, 1.3); c.beginPath(); c.arc(17.5, -15, 5.5, 0, TAU); c.fill();
  },
  function (h) {   // army helmet
    c.fillStyle = h; domePath(-3, 38, -13, 7); c.fill();
    c.save(); domePath(-3, 38, -13, 7); c.clip(); c.strokeStyle = shd(h, 0.75); c.lineWidth = 1; for (var i = 0; i < 7; i++) { c.beginPath(); c.moveTo(-6 + i * 8, 7); c.lineTo(2 + i * 6, -13); c.stroke(); c.beginPath(); c.moveTo(42 - i * 8, 7); c.lineTo(34 - i * 6, -13); c.stroke(); } c.restore();
    c.fillStyle = shd(h, 0.65); rp(-4, 3.5, 43, 4.5, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(12, -7, 8, 1.8, -0.3, 0, TAU); c.fill();
  },
  function (h) {   // cowboy
    c.fillStyle = h; c.beginPath(); c.moveTo(3, 6); c.lineTo(5, -8); c.quadraticCurveTo(11, -12, 17.5, -8); c.quadraticCurveTo(24, -12, 30, -8); c.lineTo(32, 6); c.closePath(); c.fill();
    c.fillStyle = shd(h, 0.5); c.fillRect(3.5, -1, 28.5, 4);
    c.fillStyle = shd(h, 0.85); c.beginPath(); c.moveTo(-13, 0); c.quadraticCurveTo(-2, 9, 17.5, 9); c.quadraticCurveTo(37, 9, 48, 0); c.quadraticCurveTo(40, 3, 35, 3); c.lineTo(0, 3); c.quadraticCurveTo(-8, 3, -13, 0); c.closePath(); c.fill();
  },
  function (h) {   // top hat
    c.fillStyle = shd(h, 0.45); rp(5, -25, 25, 31, 3); c.fill(); c.fillStyle = shd(h, 1.15); c.fillRect(5, -2, 25, 5);
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(8, -23, 3, 24);
    c.fillStyle = shd(h, 0.6); c.beginPath(); c.ellipse(17.5, 6, 22, 3.6, 0, 0, TAU); c.fill();
  },
  function (h) {   // bandana
    c.fillStyle = shd(h, 0.85); c.beginPath(); c.moveTo(-1, 3); c.lineTo(-10, -1); c.lineTo(-7, 5); c.lineTo(-12, 9); c.lineTo(-1, 7); c.closePath(); c.fill();
    c.fillStyle = h; c.beginPath(); c.moveTo(-1.5, 1); c.quadraticCurveTo(17.5, -4, 36.5, 1); c.lineTo(36.5, 7.5); c.quadraticCurveTo(17.5, 3, -1.5, 7.5); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; [5, 11, 17, 23, 29].forEach(function (x) { c.beginPath(); c.arc(x, 3.4, 0.9, 0, TAU); c.fill(); });
  },
  function () {    // crown
    c.fillStyle = '#f2c230'; c.strokeStyle = '#b07a10'; c.lineWidth = 1; c.beginPath(); c.moveTo(-1, 7); c.lineTo(-1, -7); c.lineTo(6, 0); c.lineTo(12, -11); c.lineTo(17.5, -1); c.lineTo(23, -11); c.lineTo(29, 0); c.lineTo(36, -7); c.lineTo(36, 7); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#d89b14'; c.fillRect(-1, 3.5, 37, 3.5);
    c.fillStyle = '#e3342f'; c.beginPath(); c.arc(17.5, 2.5, 1.9, 0, TAU); c.fill(); c.fillStyle = '#2f7be0'; c.beginPath(); c.arc(6, 5, 1.5, 0, TAU); c.fill(); c.fillStyle = '#2fbf5a'; c.beginPath(); c.arc(29, 5, 1.5, 0, TAU); c.fill();
  },
  function (h) {   // viking
    c.fillStyle = '#efe3c2'; c.strokeStyle = '#b8a77a'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(-1, -1); c.bezierCurveTo(-12, -2, -14, -12, -10, -20); c.bezierCurveTo(-8, -13, -4, -8, 2, -6); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(36, -1); c.bezierCurveTo(47, -2, 49, -12, 45, -20); c.bezierCurveTo(43, -13, 39, -8, 33, -6); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = h; domePath(-2, 37, -12, 7); c.fill(); c.fillStyle = shd(h, 0.65); rp(-3, 2.5, 41, 5, 2); c.fill();
    c.fillStyle = '#d9d9d9'; [3, 11, 24, 32].forEach(function (x) { c.beginPath(); c.arc(x, 5, 0.9, 0, TAU); c.fill(); }); c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(12, -6, 7, 1.6, -0.3, 0, TAU); c.fill();
  },
  function (h) {   // wizard
    c.fillStyle = h; c.beginPath(); c.moveTo(1, 4); c.quadraticCurveTo(8, -8, 14, -22); c.quadraticCurveTo(20, -34, 33, -29); c.quadraticCurveTo(24, -26, 25, -12); c.quadraticCurveTo(28, -2, 34, 4); c.closePath(); c.fill();
    c.fillStyle = shd(h, 0.8); c.beginPath(); c.ellipse(17.5, 4, 26, 4.5, 0, 0, TAU); c.fill();
    c.fillStyle = '#f2c230'; c.fillRect(3, -1, 29, 3.2); star5(14, -8, 3.4); star5(24, -14, 2.3);
  },
  function (h) {   // beret
    c.fillStyle = h; c.beginPath(); c.ellipse(19, -2, 21, 9, -0.12, 0, TAU); c.fill(); rp(17, -13, 4, 5, 1.5); c.fill();
    c.fillStyle = shd(h, 0.7); rp(-1, 3, 36, 4.5, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(14, -5, 8, 1.8, -0.2, 0, TAU); c.fill();
  }
];
function eyeW(x, y, rx, ry, pr, bgc) {
  c.fillStyle = bgc || '#fff'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); c.strokeStyle = '#1b1b1b'; c.lineWidth = 1; c.stroke();
  c.fillStyle = '#111'; c.beginPath(); c.arc(x + 0.6, y + 0.3, pr, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 0.6 - pr * 0.35, y - pr * 0.4, pr * 0.35, 0, TAU); c.fill();
}
function ln(w, col) { c.strokeStyle = col || '#111'; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; }
function blush(k) { c.fillStyle = 'rgba(255,105,120,' + (k || 0.55) + ')'; c.beginPath(); c.ellipse(9.5, 19, 3.2, 2, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(34, 19, 3, 2, 0, 0, TAU); c.fill(); }
function seg(x1, y1, x2, y2) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
function mouthFill(path, tooth) { c.save(); path(); c.fillStyle = '#5b1717'; c.fill(); c.clip(); if (tooth) { c.fillStyle = '#fff'; c.fillRect(17, 16, 17, tooth); } c.restore(); }
var FACES = [
  function () { c.fillStyle = '#000'; c.fillRect(26.5, 11.25, 5, 5); c.fillRect(12.5, 11.25, 5, 5); c.fillRect(22.75, 18, 7, 2); },
  function () {   // happy
    eyeW(15, 13.5, 3.2, 3.8, 2.2); eyeW(29, 13.5, 3.2, 3.8, 2.2); blush(); ln(1.6); c.beginPath(); c.moveTo(20.5, 18.5); c.quadraticCurveTo(25.5, 24.5, 30.5, 18.5); c.stroke();
  },
  function () {   // angry
    eyeW(15, 15, 2.9, 2.7, 1.8, '#ffe0e0'); eyeW(29, 15, 2.9, 2.7, 1.8, '#ffe0e0'); ln(2.4); seg(9.5, 8.2, 19, 12); seg(34, 8.2, 24.5, 12);
    ln(1.8); c.beginPath(); c.moveTo(20, 22); c.quadraticCurveTo(25.5, 17.2, 31, 22); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(21.6, 20.2); c.lineTo(23.4, 19.6); c.lineTo(22.6, 21.8); c.fill(); c.beginPath(); c.moveTo(27.6, 19.6); c.lineTo(29.4, 20.2); c.lineTo(28.4, 21.8); c.fill();
  },
  function () {   // laugh
    ln(2); c.beginPath(); c.moveTo(10.8, 15); c.quadraticCurveTo(15, 9.2, 19.2, 15); c.stroke(); c.beginPath(); c.moveTo(24.8, 15); c.quadraticCurveTo(29, 9.2, 33.2, 15); c.stroke();
    mouthFill(function () { c.beginPath(); c.moveTo(18.5, 17.5); c.lineTo(32.5, 17.5); c.quadraticCurveTo(32, 23.2, 25.5, 23.2); c.quadraticCurveTo(19, 23.2, 18.5, 17.5); c.closePath(); }, 2.4);
    c.save(); c.beginPath(); c.moveTo(18.5, 17.5); c.lineTo(32.5, 17.5); c.quadraticCurveTo(32, 23.2, 25.5, 23.2); c.quadraticCurveTo(19, 23.2, 18.5, 17.5); c.clip(); c.fillStyle = '#ff7a8a'; c.beginPath(); c.ellipse(25.5, 23, 3.8, 2.4, 0, 0, TAU); c.fill(); c.restore(); blush(0.45);
  },
  function () {   // cool
    c.fillStyle = '#0c0c10'; rp(8.5, 10.5, 12.5, 7.5, 2.5); c.fill(); rp(22.5, 10.5, 12.5, 7.5, 2.5); c.fill(); c.fillRect(20.5, 12, 2.2, 1.6); c.fillRect(-0.5, 11.8, 9.5, 1.6);
    ln(1.2, 'rgba(255,255,255,.6)'); seg(11, 12.5, 14, 15.8); seg(25, 12.5, 28, 15.8); ln(1.6); c.beginPath(); c.moveTo(21, 21); c.quadraticCurveTo(25, 22.8, 30.5, 19); c.stroke();
  },
  function () {   // sad
    eyeW(15, 14.5, 3.2, 3.8, 2.2); eyeW(29, 14.5, 3.2, 3.8, 2.2); ln(1.8); seg(9.5, 11, 19, 8.2); seg(34, 11, 24.5, 8.2);
    c.fillStyle = '#6ec6ff'; c.beginPath(); c.moveTo(11, 17.5); c.quadraticCurveTo(8.8, 20.5, 11, 21.6); c.quadraticCurveTo(13.2, 20.5, 11, 17.5); c.fill();
    ln(1.6); c.beginPath(); c.moveTo(21.5, 21.8); c.quadraticCurveTo(25.5, 18.2, 29.5, 21.8); c.stroke();
  },
  function () {   // shocked
    eyeW(15, 13, 4.2, 4.8, 1.6); eyeW(29, 13, 4.2, 4.8, 1.6); ln(1.6); c.beginPath(); c.moveTo(10, 6.8); c.quadraticCurveTo(15, 3.6, 20, 6.8); c.stroke(); c.beginPath(); c.moveTo(24, 6.8); c.quadraticCurveTo(29, 3.6, 34, 6.8); c.stroke();
    c.fillStyle = '#3a0f0f'; c.beginPath(); c.ellipse(25.5, 20.2, 2.7, 3, 0, 0, TAU); c.fill(); ln(1); c.stroke();
  },
  function () {   // wink + tongue
    eyeW(15, 13.5, 3.2, 3.8, 2.2); ln(2); c.beginPath(); c.moveTo(25.5, 14.5); c.quadraticCurveTo(29, 10.8, 32.5, 14.5); c.stroke(); blush();
    c.fillStyle = '#6a1b1b'; c.beginPath(); c.moveTo(20, 18); c.quadraticCurveTo(25.5, 24, 31, 18); c.closePath(); c.fill(); c.fillStyle = '#ff6f86'; c.beginPath(); c.ellipse(27.5, 21.2, 2.4, 2, 0, 0, TAU); c.fill();
  },
  function () {   // cute
    c.fillStyle = '#111'; c.beginPath(); c.ellipse(15, 14, 3.6, 4.8, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(29, 14, 3.6, 4.8, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(90,170,255,.7)'; c.beginPath(); c.ellipse(15, 16.4, 2.2, 1.2, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(29, 16.4, 2.2, 1.2, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff'; [[14, 12.2, 1.5], [16.2, 15.6, 0.8], [28, 12.2, 1.5], [30.2, 15.6, 0.8]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], q[2], 0, TAU); c.fill(); });
    blush(0.7); ln(1.3); c.beginPath(); c.moveTo(22.8, 19); c.quadraticCurveTo(24.2, 21, 25.5, 19); c.quadraticCurveTo(26.8, 21, 28.2, 19); c.stroke();
  },
  function () {   // pirate
    ln(1.5); seg(-0.5, 6, 35.5, 10); c.fillStyle = '#111'; c.beginPath(); c.ellipse(15, 14, 4.8, 4.2, -0.15, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(13.6, 12.6, 1.6, 0.9, -0.5, 0, TAU); c.fill();
    eyeW(29, 13.5, 3, 3.5, 1.9); ln(1.4, '#c0392b'); seg(32, 14.5, 34.5, 21); ln(0.9, '#c0392b'); seg(31.2, 16.6, 33.6, 16); seg(32.1, 18.6, 34.6, 18);
    mouthFill(function () { c.beginPath(); c.moveTo(19, 18.5); c.quadraticCurveTo(25.5, 24.5, 32, 18.5); c.closePath(); }, 2); c.fillStyle = '#f2c230'; c.fillRect(21.5, 18.2, 1.8, 1.8);
  }
];
// Head shape like the heads in Mini Militia: a rounded block (not a ball), wide forehead, softer chin. Box x 1..35, y -1..26.
// TEX PROPORTIONS (measured on the reference picture): big head (wider than the body), short wide body, short thick arms, short legs, flat boots.
var HEAD_SX = 0.69, HEAD_SY = 0.74, HEAD_CHIN = 19.3;   // head width ~23.5, chin sits on the shoulders
var BK = 1.3;                                           // body (torso + limbs) is 30% bigger, head size unchanged
var TX0 = 4.63, TX1 = 30.37, TY0 = 17.7, TY1 = 42.4;    // torso box (25.7 x 24.7)
var ARM_AX = 1.1 * BK, ARM_AY = 0.84 * BK;                        // thick + short arms
var GUN_Y = 0.9 + 14.7 * ARM_AY, GUN_X = 4.375;   // = centre of the fist   // where the weapon is held (follows the new arm size)
var LEG_PIVOT = 34.5, LEG_SX = 1.14, LEG_R = 24, LEG_L = 11;       // legs: origin, width factor, centres
function headPath(i) {   // Tex head: wide rounded block, flat chin, jaw a bit narrower. Box x 1..35, y -1..26
  var cx = 18, T = -1 + i, B = 26 - i, w = 17 - i;
  c.beginPath(); c.moveTo(cx - w + 4, T); c.lineTo(cx + w - 4, T); c.quadraticCurveTo(cx + w, T, cx + w, T + 4); c.lineTo(cx + w, 9);
  c.bezierCurveTo(cx + w, 15, cx + 14.8 - i, 19.5, cx + 12.6 - i, 22.6); c.bezierCurveTo(cx + 11 - i, 25, cx + 9.5 - i, B, cx + 7 - i, B);
  c.lineTo(cx - 7 + i, B); c.bezierCurveTo(cx - 9.5 + i, B, cx - 11 + i, 25, cx - 12.6 + i, 22.6); c.bezierCurveTo(cx - 14.8 + i, 19.5, cx - w, 15, cx - w, 9);
  c.lineTo(cx - w, T + 4); c.quadraticCurveTo(cx - w, T, cx - w + 4, T); c.closePath();
}
// Where the arms hang from: original shoulders, or the outfit's wider shoulders.
function shoulder(e) {
  return { x: 29.2, lx: 5.8, y: 20.8 };
}
// Outfits with capFit 'head': the head picture IS the head (mask / bare head). It is fitted exactly to the head box, covers the head completely and moves with it.
function headPic(lk) { var of = lk.outfit >= 0 ? OUTFITS[lk.outfit] : null; return of && (of.capFit === 'head' || of.hideHead) ? ofPart(of, 'cap') : null; }   // outfit head pictures replace the head: no bare head or face sticks out
function drawHeadPic(p, bottom) {
  var bw = 34, bh = 27, k = Math.min(bw / p.w, bh / p.h), w = p.w * k, h = p.h * k;   // head box: x 1..35, y -1..26 (contain, centred)
  if (bottom != null) c.drawImage(p.src, 18 - w / 2, bottom - h, w, h);   // outfit with headBottom: the bottom of the head picture sits on the top of the torso (no gap)
  else c.drawImage(p.src, 18 - w / 2, 12.5 - h / 2, w, h);
}
function drawHead(q, lk) {
  var hp_ = headPic(lk); if (hp_) { var of_ = OUTFITS[lk.outfit]; if (of_.capFit === 'head') drawHeadPic(hp_, of_.headBottom); else { var cb2_ = of_.capBox || [39, 11, 30]; ofDraw(hp_, 17.5, cb2_[1], cb2_[0], cb2_[2], 0.5, 1); } return; }
  if (lk.hair >= 0) { c.fillStyle = HAIR_COLS[lk.hc || 0]; HAIRS[lk.hair](); c.fillStyle = 'rgba(255,255,255,.22)'; var hl = HAIR_HL[lk.hair]; c.beginPath(); c.ellipse(hl[0], hl[1], hl[2], 1.5, -0.15, 0, TAU); c.fill(); }
  var ofc_ = lk.outfit >= 0 ? ofPart(OUTFITS[lk.outfit], 'cap') : null;
  if (ofc_) { var cb_ = OUTFITS[lk.outfit].capBox || [39, 11, 30]; ofDraw(ofc_, 17.5, cb_[1], cb_[0], cb_[2], 0.5, 1); } else if (lk.cap >= 0) CAPS[lk.cap](q.hat);
  c.save(); FACES[lk.face](); c.restore();
}

// ---- Language (EN / AR / ES / FR) ----
var LANGS = [['en', 'English'], ['ar', '\u0627\u0644\u0639\u0631\u0628\u064a\u0629'], ['es', 'Espa\u00f1ol'], ['fr', 'Fran\u00e7ais']], LANG = 'en', LI = { ar: 0, es: 1, fr: 2 };
try { var lg_ = localStorage.getItem('mm_lang'); if (LI[lg_] !== undefined) LANG = lg_; } catch (e_) { }
var I18N = {
  "Settings": ["\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a", "Ajustes", "Param\u00e8tres"],
  "Inventory": ["\u0627\u0644\u062e\u0632\u0646\u0629", "Inventario", "Inventaire"],
  "Maps": ["\u0627\u0644\u062e\u0631\u0627\u0626\u0637", "Mapas", "Cartes"],
  "Join": ["\u0627\u0646\u0636\u0645\u0627\u0645", "Unirse", "Rejoindre"],
  "Host": ["\u0627\u0633\u062a\u0636\u0627\u0641\u0629", "Crear", "H\u00e9berger"],
  "Play": ["\u0627\u0644\u0639\u0628", "Jugar", "Jouer"],
  "PLAY": ["\u0627\u0644\u0639\u0628", "JUGAR", "JOUER"],
  "JOIN": ["\u0627\u0646\u0636\u0645\u0627\u0645", "UNIRSE", "REJOINDRE"],
  "HOST": ["\u0627\u0633\u062a\u0636\u0627\u0641\u0629", "CREAR", "H\u00c9BERGER"],
  "VAULT": ["\u0627\u0644\u062e\u0632\u0646\u0629", "B\u00d3VEDA", "COFFRE"],
  "MAPS": ["\u0627\u0644\u062e\u0631\u0627\u0626\u0637", "MAPAS", "CARTES"],
  "SETTINGS": ["\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a", "AJUSTES", "PARAM\u00c8TRES"],
  "CLOSE": ["\u0625\u063a\u0644\u0627\u0642", "CERRAR", "FERMER"],
  "COINS": ["\u0627\u0644\u0643\u0648\u064a\u0646\u0627\u062a", "MONEDAS", "PI\u00c8CES"],
  "KILLS": ["\u0627\u0644\u0642\u062a\u0644\u0627\u062a", "BAJAS", "KILLS"],
  "SAVED ON SERVER": ["\u0645\u062d\u0641\u0648\u0638 \u0639\u0644\u0649 \u0627\u0644\u0633\u064a\u0631\u0641\u0631", "GUARDADO EN EL SERVIDOR", "SAUVEGARD\u00c9 SUR LE SERVEUR"],
  "SAVING...": ["\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...", "GUARDANDO...", "ENREGISTREMENT..."],
  "OFFLINE - WILL SYNC LATER": ["\u0644\u0627 \u064a\u0648\u062c\u062f \u0627\u062a\u0635\u0627\u0644 - \u0647\u064a\u062a\u0645 \u0627\u0644\u062d\u0641\u0638 \u0644\u0627\u062d\u0642\u064b\u0627", "SIN CONEXI\u00d3N - SE SINCRONIZAR\u00c1 DESPU\u00c9S", "HORS LIGNE - SYNCHRO PLUS TARD"],
  "SAVED ON THIS DEVICE ONLY": ["\u0645\u062d\u0641\u0648\u0638 \u0639\u0644\u0649 \u0627\u0644\u062c\u0647\u0627\u0632 \u0641\u0642\u0637", "GUARDADO SOLO EN ESTE DISPOSITIVO", "SAUVEGARD\u00c9 SUR CET APPAREIL SEULEMENT"],
  '// OPERATION ROOM //': ['// \u063a\u0631\u0641\u0629 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a //', '// SALA DE OPERACIONES //', "// SALLE D'OP\u00c9RATIONS //"],
  'DEPLOY': ['\u0627\u0646\u0637\u0644\u0627\u0642', 'DESPLEGAR', 'D\u00c9PLOYER'],
  'START THE BATTLE': ['\u0627\u0628\u062f\u0623 \u0627\u0644\u0645\u0639\u0631\u0643\u0629', 'COMIENZA LA BATALLA', 'LANCE LA BATAILLE'],
  'BACK TO BATTLE': ['\u0627\u0644\u0639\u0648\u062f\u0629 \u0644\u0644\u0645\u0639\u0631\u0643\u0629', 'VOLVER A LA BATALLA', 'RETOUR AU COMBAT'],
  'RESUME MATCH': ['\u0627\u0633\u062a\u0643\u0645\u0627\u0644 \u0627\u0644\u0645\u0628\u0627\u0631\u0627\u0629', 'REANUDAR PARTIDA', 'REPRENDRE LA PARTIE'],
  'BATTLEFIELD': ['\u0633\u0627\u062d\u0629 \u0627\u0644\u0645\u0639\u0631\u0643\u0629', 'CAMPO DE BATALLA', 'CHAMP DE BATAILLE'],
  'CHOOSE MAP': ['\u0627\u062e\u062a\u0631 \u0627\u0644\u062e\u0631\u064a\u0637\u0629', 'ELEGIR MAPA', 'CHOISIR UNE CARTE'],
  'HOST WAR': ['\u0627\u0633\u062a\u0636\u0627\u0641\u0629 \u062d\u0631\u0628', 'CREAR GUERRA', 'CR\u00c9ER UNE GUERRE'],
  'CREATE ROOM': ['\u0625\u0646\u0634\u0627\u0621 \u063a\u0631\u0641\u0629', 'CREAR SALA', 'CR\u00c9ER UN SALON'],
  'JOIN WAR': ['\u0627\u0646\u0636\u0645\u0627\u0645 \u0644\u062d\u0631\u0628', 'UNIRSE A GUERRA', 'REJOINDRE UNE GUERRE'],
  'ENTER ROOM': ['\u062f\u062e\u0648\u0644 \u063a\u0631\u0641\u0629', 'ENTRAR A SALA', 'ENTRER DANS UN SALON'],
  'OUTFIT': ['\u0627\u0644\u0637\u0642\u0645', 'CONJUNTO', 'TENUE'],
  'FIT': ['\u0627\u0644\u0641\u064a\u062a', 'ESTILO', 'STYLE'],
  'EDIT BUTTONS': ['\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0623\u0632\u0631\u0627\u0631', 'EDITAR BOTONES', 'MODIFIER LES BOUTONS'],
  'SOUND': ['\u0627\u0644\u0635\u0648\u062a', 'SONIDO', 'SON'], 'MUSIC': ['\u0627\u0644\u0645\u0648\u0633\u064a\u0642\u0649', 'M\u00daSICA', 'MUSIQUE'], 'LANGUAGE': ['\u0627\u0644\u0644\u063a\u0629', 'IDIOMA', 'LANGUE'],
  'ON': ['\u0645\u0641\u0639\u0651\u0644', 'ACTIVADO', 'ACTIV\u00c9'], 'OFF': ['\u0645\u062a\u0648\u0642\u0641', 'DESACTIVADO', 'D\u00c9SACTIV\u00c9'],
  'A/D move \u00b7 W/Space/S fly \u00b7 Mouse aim + shoot \u00b7 R reload \u00b7 Q swap \u00b7 G grenade \u00b7 F melee \u00b7 E pick up': ['A/D \u062d\u0631\u0643\u0629 \u00b7 W/Space/S \u0637\u064a\u0631\u0627\u0646 \u00b7 \u0627\u0644\u0645\u0627\u0648\u0633 \u062a\u0635\u0648\u064a\u0628 + \u0625\u0637\u0644\u0627\u0642 \u00b7 R \u062a\u0639\u0628\u0626\u0629 \u00b7 Q \u062a\u0628\u062f\u064a\u0644 \u00b7 G \u0642\u0646\u0628\u0644\u0629 \u00b7 F \u0636\u0631\u0628 \u00b7 E \u0627\u0644\u062a\u0642\u0627\u0637', 'A/D mover \u00b7 W/Espacio/S volar \u00b7 Rat\u00f3n apuntar + disparar \u00b7 R recargar \u00b7 Q cambiar \u00b7 G granada \u00b7 F cuerpo a cuerpo \u00b7 E recoger', 'A/D bouger \u00b7 W/Espace/S voler \u00b7 Souris viser + tirer \u00b7 R recharger \u00b7 Q changer \u00b7 G grenade \u00b7 F m\u00easl\u00e9e \u00b7 E ramasser'],
  'TARGET ZONE': ['\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0647\u062f\u0641', 'ZONA OBJETIVO', 'ZONE CIBLE'],
  '7 HOSTILES DETECTED': ['\u062a\u0645 \u0631\u0635\u062f 7 \u0623\u0639\u062f\u0627\u0621', '7 HOSTILES DETECTADOS', '7 HOSTILES D\u00c9TECT\u00c9S'],
  'SHOES': ['\u0627\u0644\u0623\u062d\u0630\u064a\u0629', 'ZAPATOS', 'CHAUSSURES'], 'SIZE': ['\u0627\u0644\u062d\u062c\u0645', 'TAMA\u00d1O', 'TAILLE'],
  'TAP A BUTTON TO RESIZE IT': ['\u0627\u0636\u063a\u0637 \u0639\u0644\u0649 \u0632\u0631 \u0644\u062a\u063a\u064a\u064a\u0631 \u062d\u062c\u0645\u0647', 'TOCA UN BOT\u00d3N PARA CAMBIAR SU TAMA\u00d1O', 'TOUCHEZ UN BOUTON POUR LE REDIMENSIONNER'],
  'Army Boot': ['\u0628\u0648\u062a \u0639\u0633\u0643\u0631\u064a', 'Bota militar', 'Botte militaire'], 'Combat Black': ['\u0628\u0648\u062a \u0623\u0633\u0648\u062f', 'Bota negra', 'Rangers noires'],
  'White Sneaker': ['\u0643\u0648\u062a\u0634\u064a \u0623\u0628\u064a\u0636', 'Zapatilla blanca', 'Basket blanche'], 'Red Sneaker': ['\u0643\u0648\u062a\u0634\u064a \u0623\u062d\u0645\u0631', 'Zapatilla roja', 'Basket rouge'],
  'Brown Boot': ['\u0628\u0648\u062a \u0628\u0646\u064a', 'Bota marr\u00f3n', 'Botte marron'], 'Desert Boot': ['\u0628\u0648\u062a \u0635\u062d\u0631\u0627\u0648\u064a', 'Bota desierto', 'Botte d\u00e9sert'],
  'Blue Runner': ['\u0643\u0648\u062a\u0634\u064a \u0623\u0632\u0631\u0642', 'Zapatilla azul', 'Basket bleue'], 'Gold Boot': ['\u0628\u0648\u062a \u0630\u0647\u0628\u064a', 'Bota dorada', 'Botte dor\u00e9e'],
  'Camo Boot': ['\u0628\u0648\u062a \u062a\u0645\u0648\u064a\u0647', 'Bota camuflaje', 'Botte camouflage'], 'Neon Runner': ['\u0643\u0648\u062a\u0634\u064a \u0646\u064a\u0648\u0646', 'Zapatilla ne\u00f3n', 'Basket n\u00e9on'],
  'SELECT MAP': ['\u0627\u062e\u062a\u0631 \u0627\u0644\u062e\u0631\u064a\u0637\u0629', 'SELECCIONA MAPA', 'CHOISIR LA CARTE'],
  'BACK': ['\u0631\u062c\u0648\u0639', 'VOLVER', 'RETOUR'], 'COPY': ['\u0646\u0633\u062e', 'COPIAR', 'COPIER'], 'SHARE': ['\u0645\u0634\u0627\u0631\u0643\u0629', 'COMPARTIR', 'PARTAGER'],
  'SCAN QR': ['\u0645\u0633\u062d QR', 'ESCANEAR QR', 'SCANNER QR'], 'CONNECT': ['\u0627\u062a\u0635\u0627\u0644', 'CONECTAR', 'CONNECTER'],
  'Paste code here': ['\u0627\u0644\u0635\u0642 \u0627\u0644\u0643\u0648\u062f \u0647\u0646\u0627', 'Pega el c\u00f3digo aqu\u00ed', 'Collez le code ici'],
  'LOBBY': ['\u0627\u0644\u0631\u062f\u0647\u0629', 'SALA DE ESPERA', 'SALON'],
  'HOST + GUEST connected': ['\u062a\u0645 \u0627\u062a\u0635\u0627\u0644 \u0627\u0644\u0645\u0636\u064a\u0641 + \u0627\u0644\u0636\u064a\u0641', 'ANFITRI\u00d3N + INVITADO conectados', 'H\u00d4TE + INVIT\u00c9 connect\u00e9s'],
  'CHANGE MAP': ['\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u062e\u0631\u064a\u0637\u0629', 'CAMBIAR MAPA', 'CHANGER DE CARTE'],
  'TIME -': ['\u0627\u0644\u0648\u0642\u062a -', 'TIEMPO -', 'TEMPS -'], 'TIME +': ['\u0627\u0644\u0648\u0642\u062a +', 'TIEMPO +', 'TEMPS +'], 'TIME': ['\u0627\u0644\u0648\u0642\u062a', 'TIEMPO', 'TEMPS'],
  'START': ['\u0627\u0628\u062f\u0623', 'INICIAR', 'D\u00c9MARRER'],
  'Waiting for the host to start...': ['\u0641\u064a \u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0636\u064a\u0641 \u0644\u064a\u0628\u062f\u0623...', 'Esperando a que el anfitri\u00f3n inicie...', "En attente du d\u00e9marrage par l'h\u00f4te..."],
  'LEAVE': ['\u0645\u063a\u0627\u062f\u0631\u0629', 'SALIR', 'QUITTER'],
  "TIME'S UP": ['\u0627\u0646\u062a\u0647\u0649 \u0627\u0644\u0648\u0642\u062a', 'SE ACAB\u00d3 EL TIEMPO', 'TEMPS \u00c9COUL\u00c9'],
  'PLAY AGAIN': ['\u0627\u0644\u0639\u0628 \u0645\u062c\u062f\u062f\u064b\u0627', 'JUGAR OTRA VEZ', 'REJOUER'], 'MENU': ['\u0627\u0644\u0642\u0627\u0626\u0645\u0629', 'MEN\u00da', 'MENU'],
  'DRAG THE BUTTONS TO MOVE THEM': ['\u0627\u0633\u062d\u0628 \u0627\u0644\u0623\u0632\u0631\u0627\u0631 \u0644\u062a\u062d\u0631\u064a\u0643\u0647\u0627', 'ARRASTRA LOS BOTONES PARA MOVERLOS', 'FAITES GLISSER LES BOUTONS POUR LES D\u00c9PLACER'],
  'RESET': ['\u0625\u0639\u0627\u062f\u0629 \u0636\u0628\u0637', 'RESTABLECER', 'R\u00c9INITIALISER'], 'DONE': ['\u062a\u0645', 'LISTO', 'TERMIN\u00c9'],
  'HOST GAME': ['\u0627\u0633\u062a\u0636\u0627\u0641\u0629 \u0644\u0639\u0628\u0629', 'CREAR PARTIDA', 'H\u00c9BERGER UNE PARTIE'], 'JOIN GAME': ['\u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645 \u0644\u0644\u0639\u0628\u0629', 'UNIRSE A PARTIDA', 'REJOINDRE UNE PARTIE'],
  'RELOAD': ['\u062a\u0639\u0628\u0626\u0629', 'RECARGA', 'RECHARGE'], 'RESPAWN': ['\u0627\u0644\u0639\u0648\u062f\u0629 \u0628\u0639\u062f', 'REAPARECE EN', 'R\u00c9APPARITION'],
  'JOINED THE GAME': ['\u0627\u0646\u0636\u0645 \u0625\u0644\u0649 \u0627\u0644\u0644\u0639\u0628\u0629', 'SE UNI\u00d3 A LA PARTIDA', 'A REJOINT LA PARTIE'], 'killed': ['\u0642\u062a\u0644', 'mat\u00f3 a', 'a tu\u00e9'], 'died': ['\u0645\u0627\u062a', 'muri\u00f3', 'est mort'],
  'BODY': ['\u0627\u0644\u062c\u0633\u0645', 'CUERPO', 'CORPS'], 'HAIR': ['\u0627\u0644\u0634\u0639\u0631', 'PELO', 'CHEVEUX'], 'CAP': ['\u0627\u0644\u0643\u0627\u0628', 'GORRA', 'CASQUETTE'], 'FACE': ['\u0627\u0644\u0648\u062c\u0647', 'CARA', 'VISAGE'],
  'Classic': ['\u0643\u0644\u0627\u0633\u064a\u0643', 'Cl\u00e1sico', 'Classique'], 'None': ['\u0628\u062f\u0648\u0646', 'Ninguno', 'Aucun'],
  'Short': ['\u0642\u0635\u064a\u0631', 'Corto', 'Court'], 'Spiky': ['\u0634\u0627\u0626\u0643', 'Puntas', 'H\u00e9riss\u00e9'], 'Mohawk': ['\u0645\u0648\u0647\u0648\u0643', 'Mohicano', 'Mohawk'], 'Afro': ['\u0623\u0641\u0631\u0648', 'Afro', 'Afro'], 'Long': ['\u0637\u0648\u064a\u0644', 'Largo', 'Long'],
  'Ponytail': ['\u0630\u064a\u0644 \u062d\u0635\u0627\u0646', 'Coleta', 'Queue de cheval'], 'Bun': ['\u0643\u0639\u0643\u0629', 'Mo\u00f1o', 'Chignon'], 'Swoop': ['\u063a\u0631\u0651\u0629', 'Flequillo', 'Frange'], 'Pompadour': ['\u0628\u0648\u0645\u0628\u0627\u062f\u0648\u0631', 'Tup\u00e9', 'Banane'], 'Curly': ['\u0645\u062c\u0639\u0651\u062f', 'Rizado', 'Boucl\u00e9'],
  'Beanie': ['\u0637\u0627\u0642\u064a\u0629', 'Gorro', 'Bonnet'], 'Helmet': ['\u062e\u0648\u0630\u0629', 'Casco', 'Casque'], 'Cowboy': ['\u0643\u0627\u0648\u0628\u0648\u064a', 'Vaquero', 'Cowboy'], 'Top Hat': ['\u0642\u0628\u0639\u0629 \u0639\u0627\u0644\u064a\u0629', 'Chistera', 'Haut-de-forme'], 'Bandana': ['\u0628\u0646\u062f\u0627\u0646\u0627', 'Bandana', 'Bandana'],
  'Crown': ['\u062a\u0627\u062c', 'Corona', 'Couronne'], 'Viking': ['\u0641\u0627\u064a\u0643\u0646\u063a', 'Vikingo', 'Viking'], 'Wizard': ['\u0633\u0627\u062d\u0631', 'Mago', 'Sorcier'], 'Beret': ['\u0628\u064a\u0631\u064a\u0647', 'Boina', 'B\u00e9ret'],
  'Happy': ['\u0633\u0639\u064a\u062f', 'Feliz', 'Content'], 'Angry': ['\u063a\u0627\u0636\u0628', 'Enfadado', 'En col\u00e8re'], 'Laugh': ['\u0636\u0627\u062d\u0643', 'Risa', 'Rire'], 'Cool': ['\u0643\u0648\u0644', 'Genial', 'Cool'], 'Sad': ['\u062d\u0632\u064a\u0646', 'Triste', 'Triste'],
  'Shocked': ['\u0645\u0635\u062f\u0648\u0645', 'Sorprendido', 'Choqu\u00e9'], 'Wink': ['\u063a\u0645\u0632\u0629', 'Gui\u00f1o', "Clin d'\u0153il"], 'Cute': ['\u0644\u0637\u064a\u0641', 'Tierno', 'Mignon'], 'Pirate': ['\u0642\u0631\u0635\u0627\u0646', 'Pirata', 'Pirate'],
  'Connection lost': ['\u0627\u0646\u0642\u0637\u0639 \u0627\u0644\u0627\u062a\u0635\u0627\u0644', 'Conexi\u00f3n perdida', 'Connexion perdue'], 'Leave the match?': ['\u0645\u063a\u0627\u062f\u0631\u0629 \u0627\u0644\u0645\u0628\u0627\u0631\u0627\u0629\u061f', '\u00bfSalir de la partida?', 'Quitter la partie ?'],
  'This browser cannot scan QR codes. Use COPY / paste instead (Chrome on Android supports scanning).': ['\u0647\u0630\u0627 \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0644\u0627 \u064a\u062f\u0639\u0645 \u0645\u0633\u062d QR. \u0627\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u0646\u0633\u062e / \u0627\u0644\u0644\u0635\u0642 (\u0645\u062a\u0635\u0641\u062d Chrome \u0639\u0644\u0649 \u0623\u0646\u062f\u0631\u0648\u064a\u062f \u064a\u062f\u0639\u0645 \u0627\u0644\u0645\u0633\u062d).', 'Este navegador no puede escanear c\u00f3digos QR. Usa COPIAR / pegar (Chrome en Android s\u00ed lo permite).', "Ce navigateur ne peut pas scanner les QR codes. Utilisez COPIER / coller (Chrome sur Android le permet)."],
  'Connection failed. Make sure both phones are on the same hotspot / Wi-Fi, then try again.': ['\u0641\u0634\u0644 \u0627\u0644\u0627\u062a\u0635\u0627\u0644. \u062a\u0623\u0643\u062f \u0623\u0646 \u0627\u0644\u0647\u0627\u062a\u0641\u064a\u0646 \u0639\u0644\u0649 \u0646\u0641\u0633 \u0627\u0644\u0647\u0648\u062a\u0633\u0628\u0648\u062a / \u0627\u0644\u0648\u0627\u064a \u0641\u0627\u064a \u062b\u0645 \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.', 'Conexi\u00f3n fallida. Aseg\u00farate de que ambos tel\u00e9fonos est\u00e9n en el mismo punto de acceso / Wi-Fi e int\u00e9ntalo de nuevo.', 'Connexion \u00e9chou\u00e9e. V\u00e9rifiez que les deux t\u00e9l\u00e9phones sont sur le m\u00eame point d\u2019acc\u00e8s / Wi-Fi, puis r\u00e9essayez.'],
  'Creating code...': ['\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0643\u0648\u062f...', 'Creando c\u00f3digo...', 'Cr\u00e9ation du code...'],
  'Connect both phones to the same hotspot / Wi-Fi, then press SCAN QR and point the camera at the host screen.': ['\u0635\u0644 \u0627\u0644\u0647\u0627\u062a\u0641\u064a\u0646 \u0628\u0646\u0641\u0633 \u0627\u0644\u0647\u0648\u062a\u0633\u0628\u0648\u062a / \u0627\u0644\u0648\u0627\u064a \u0641\u0627\u064a \u062b\u0645 \u0627\u0636\u063a\u0637 \u0645\u0633\u062d QR \u0648\u0648\u062c\u0651\u0647 \u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627 \u0646\u062d\u0648 \u0634\u0627\u0634\u0629 \u0627\u0644\u0645\u0636\u064a\u0641.', 'Conecta ambos tel\u00e9fonos al mismo punto de acceso / Wi-Fi, pulsa ESCANEAR QR y apunta la c\u00e1mara a la pantalla del anfitri\u00f3n.', 'Connectez les deux t\u00e9l\u00e9phones au m\u00eame point d\u2019acc\u00e8s / Wi-Fi, puis appuyez sur SCANNER QR et visez l\u2019\u00e9cran de l\u2019h\u00f4te.'],
  '1) Your friend presses JOIN GAME > SCAN QR and scans this code. 2) Then press SCAN QR here and scan the QR that appears on their screen.': ['1) \u0635\u062f\u064a\u0642\u0643 \u064a\u0636\u063a\u0637 \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645 \u0644\u0644\u0639\u0628\u0629 > \u0645\u0633\u062d QR \u0648\u064a\u0645\u0633\u062d \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u062f. 2) \u062b\u0645 \u0627\u0636\u063a\u0637 \u0645\u0633\u062d QR \u0647\u0646\u0627 \u0648\u0627\u0645\u0633\u062d \u0627\u0644\u0643\u0648\u062f \u0627\u0644\u0630\u064a \u064a\u0638\u0647\u0631 \u0639\u0644\u0649 \u0634\u0627\u0634\u062a\u0647.', '1) Tu amigo pulsa UNIRSE A PARTIDA > ESCANEAR QR y escanea este c\u00f3digo. 2) Luego pulsa ESCANEAR QR aqu\u00ed y escanea el QR que aparece en su pantalla.', '1) Votre ami appuie sur REJOINDRE UNE PARTIE > SCANNER QR et scanne ce code. 2) Puis appuyez ici sur SCANNER QR et scannez le QR affich\u00e9 sur son \u00e9cran.'],
  'Connecting...': ['\u062c\u0627\u0631\u064a \u0627\u0644\u0627\u062a\u0635\u0627\u0644...', 'Conectando...', 'Connexion...'], 'Creating reply code...': ['\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 \u0643\u0648\u062f \u0627\u0644\u0631\u062f...', 'Creando c\u00f3digo de respuesta...', 'Cr\u00e9ation du code de r\u00e9ponse...'],
  'Show this QR to the host: the host presses SCAN QR and scans it. The game opens by itself.': ['\u0623\u0638\u0647\u0631 \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u062f \u0644\u0644\u0645\u0636\u064a\u0641: \u064a\u0636\u063a\u0637 \u0645\u0633\u062d QR \u0648\u064a\u0645\u0633\u062d\u0647. \u062a\u0641\u062a\u062d \u0627\u0644\u0644\u0639\u0628\u0629 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627.', 'Muestra este QR al anfitri\u00f3n: pulsa ESCANEAR QR y lo escanea. El juego se abre solo.', 'Montrez ce QR \u00e0 l\u2019h\u00f4te : il appuie sur SCANNER QR et le scanne. La partie s\u2019ouvre toute seule.']
};
function tr(s) {
  if (LANG === 'en' || typeof s !== 'string') return s;
  var i = LI[LANG], t = s.trim().replace(/\s+/g, ' '), d = I18N[t], m;
  if (d) return s.replace(s.trim(), d[i]);
  if ((m = /^(SOUND|MUSIC|LANGUAGE): (.+)$/.exec(t))) return tr(m[1]) + ': ' + (I18N[m[2]] ? I18N[m[2]][i] : m[2]);
  if ((m = /^RESPAWN (\d+)$/.exec(t))) return tr('RESPAWN') + ' ' + m[1];
  if ((m = /^TIME (.+)$/.exec(t))) return tr('TIME') + ' ' + m[1];
  if ((m = /^FIT (\d+)$/.exec(t))) return tr('FIT') + ' ' + m[1];
  if ((m = /^(.+) JOINED THE GAME$/.exec(t))) return m[1] + ' ' + tr('JOINED THE GAME');
  if ((m = /^(.+) killed (.+)$/.exec(t))) return m[1] + ' ' + tr('killed') + ' ' + m[2];
  if ((m = /^(.+) died$/.exec(t))) return m[1] + ' ' + tr('died');
  return s;
}
var P = fighter('YOU', CHAR, false), P2 = fighter('GUEST', CHAR, false), ME = P;
var BOT_NAMES = ['kiLL BiLL', 'Naruto', 'KING', 'Viper', 'Ghost', 'Rex', 'Blaze'];
var bots = BOT_NAMES.map(function (n, i) { return fighter(n, CHAR, true); });
var fighters = [P].concat(bots);
bots.forEach(function (b, i) { b.rt = Math.round(90 + i * R(60, 200)); });
var bullets = [], bulletSeq = 0, grenades = [], smokes = [], parts = [], feedL = [], frame = 0, left = 300, over = false, shake = 0;
var role = 'solo', MP = false, netOK = false, evq = [], matchLen = 300;

function rd(v) { return Math.round(v * 100) / 100; }
function evp() { }   // events come from the server now
function feed(t) { feedL.push({ t: t, l: 300 }); if (feedL.length > 5) feedL.shift(); evp('fd', t); }
function volXY(x, y) { return cl(1 - Math.hypot(x - (ME.x + ME.w / 2), y - (ME.y + 31)) / 1000, 0.15, 1); }
function sfx(t, x, y, k) { snd(t, volXY(x, y) * (k == null ? 1 : k)); evp('sn', t, rd(x), rd(y), k == null ? 1 : k); }
var nextBot = 0;   // frame at which the next bot is allowed to appear (bots trickle in one by one)
function boxFree(x, y, w, h) {
  if (x < 20 || x + w > W - 20 || y < 20 || y + h > H - 20) return false;
  for (var i = 0; i < S.length; i++) { var s = S[i]; if (x < s[0] + s[2] && x + w > s[0] && y < s[1] + s[3] && y + h > s[1]) return false; }
  return true;
}
// Bots appear beside the player (a short distance away), not all over the map.
function nearPlayerSpot(e) {
  var t = ME && ME.alive ? ME : P; if (!t.alive) return null;
  for (var i = 0; i < 30; i++) {
    var side = Math.random() < 0.5 ? -1 : 1, dx = side * R(260, 520), dy = R(-120, 60);
    var x = t.x + dx, y = t.y + dy;
    if (boxFree(x, y, e.w, e.h) && boxFree(x, y + e.h, e.w, 6) === false) return [x + e.w / 2, y + e.h];   // standing on something
    if (boxFree(x, y, e.w, e.h) && i > 18) return [x + e.w / 2, y + e.h];                                   // or in the air (they fly)
  }
  var best = null, bd = 1e9;
  SPAWNS.forEach(function (s) { var d = Math.hypot(s[0] - t.x, s[1] - t.y); if (d > 200 && d < bd) { bd = d; best = s; } });
  return best;
}
function spawn(e) {
  var best = SPAWNS[0], bd = -1;
  var np = e.bot && !MP ? nearPlayerSpot(e) : null;
  if (np) { best = np; bd = 1e9; if (e.bot) nextBot = frame + Math.round(R(180, 600)); }
  else SPAWNS.forEach(function (s) {
    var m = 1e9; fighters.forEach(function (f) { if (f !== e && f.alive) m = Math.min(m, Math.hypot(f.x - s[0], f.y - s[1])); });
    m += R(0, 400); if (m > bd) { bd = m; best = s; }
  });
  e.x = best[0] - e.w / 2; e.y = best[1] - e.h; e.vx = e.vy = 0; e.hp = 100; e.fuel = 100; e.alive = true; e.inv = 120; e.tilt = 0;
  e.ammo = WEAPONS.map(function (w) { return w.mag; }); e.res = WEAPONS.map(function (w, i) { return e.bot ? w.res : START_RES[i]; });
  e.gren = e.bot ? 4 : 30; e.reload = 0; e.cool = 0; e.smoke = 2; e.inv3 = e.bot ? [0, 6, 1] : [1, 3, 5]; e.sl = e.bot ? Math.floor(R(0, 3)) : 0; e.wi = e.inv3[e.sl];
  if (!e.joined) { e.joined = true; if (e.bot) feed(e.name + ' JOINED THE GAME'); }
}
var PLAYER_DMG = 1;   // the player's damage against bots (50%)
var BOT_DMG = 0.30;   // bots deal this fraction of normal damage to the player (previous value raised by 30%)
function hit(f, d, by, x, y) {
  if (MP) return;   // multiplayer: the server decides every hit
  if (!f.alive || f.inv > 0) return;
  if (by && !by.bot && f.bot) d *= PLAYER_DMG;
  if (by && by.bot && !f.bot) d *= BOT_DMG;
  var hx = x == null ? f.x + f.w / 2 : x, hy = y == null ? f.y + 31 : y;
  f.hp -= d; sfx('hit', f.x, f.y, 0.8); bloodFX(hx, hy); evp('ht', rd(hx), rd(hy));
  if (f.hp <= 0) {
    f.alive = false; f.rt = f.bot ? Math.round(R(150, 480)) : 180; sfx(f === ME ? 'dieme' : 'diebot', f.x, f.y, 1); if (by && by !== f) by.kills++;
    feed(by && by !== f ? by.name + ' killed ' + f.name : f.name + ' died');
    gibFX(f); evp('dd', fighters.indexOf(f));
  }
}
function addP(p) { if (parts.length < 900) parts.push(p); }
function bloodFX(x, y) { for (var i = 0; i < 4; i++) addP({ x: x, y: y, vx: R(-2, 2), vy: R(-3, 1), l: 22, m: 22, t: 'blood', r: 2 }); }
function gibFX(f) { for (var j = 0; j < 12; j++) addP({ x: f.x + f.w / 2, y: f.y + 31, vx: R(-4, 4), vy: R(-6, 0), l: 70, m: 70, t: 'gib', r: R(3, 6), col: j % 2 ? f.col.shirt : f.col.hat }); }
function sparkFX(x, y) { for (var j = 0; j < 3; j++) addP({ x: x, y: y, vx: R(-2, 2), vy: R(-2, 2), l: 10, m: 10, t: 'spark', r: 1 }); }
function boomFX(x, y) { shake = 14; for (var i = 0; i < 26; i++) addP({ x: x, y: y, vx: R(-5, 5), vy: R(-5, 5), l: 30, m: 30, t: i % 3 ? 'fire' : 'smoke', r: R(6, 14) }); }
function shotFX(e, ox, oy, aim) {
  e.an.kb = SHOOT_KNOCKBACK;
  var w_ = WEAPONS[e.wi] || WEAPONS[0], big = w_.ex || w_.snd === 'sniper' || w_.snd === 'shotgun' ? 1.35 : 1;
  addP({ x: ox, y: oy, vx: 0, vy: 0, l: 5, m: 5, t: 'flash', r: 15 * big, a: aim });
  for (var n = Math.ceil(R(1, 3)), k = 0; k < n; k++) {   // soft smoke puffs drifting out of the barrel
    var sd = aim + R(-0.35, 0.35), sp = R(2.5, 6);
    addP({ x: ox, y: oy, vx: Math.cos(sd) * sp, vy: Math.sin(sd) * sp - 0.2, l: 30, m: 30, t: 'cloud', r: R(3, 5.5) });
  }
  for (k = 0; k < 3; k++) { var sa = aim + R(-0.5, 0.5), ss = R(5, 10); addP({ x: ox, y: oy, vx: Math.cos(sa) * ss, vy: Math.sin(sa) * ss, l: 8, m: 8, t: 'spark', r: 1 }); }
  if (w_.mag > 1) {   // ejected brass
    var f_ = e.face || 1;
    addP({ x: ox - Math.cos(aim) * 20, y: oy - Math.sin(aim) * 20 - 3, vx: -f_ * R(1, 2.6), vy: R(-4.5, -2.5), l: 55, m: 55, t: 'shell', r: 1, rot: R(0, TAU), vr: R(-0.5, 0.5), sh: w_.snd === 'shotgun' });
  }
  if (e === ME) shake = Math.max(shake, w_.rec);
}
function flame(e, n, sm) {
  for (var i = 0; i < n; i++) addP({ x: e.x + e.w / 2 + (Math.random() < 0.5 ? -6 : 6), y: e.y + e.h - 2, vx: R(-0.6, 0.6) - e.vx * 0.3, vy: R(3, 6) * (sm ? 0.6 : 1), l: 16, m: 16, t: 'fire', r: R(3, 6) * (sm ? 0.7 : 1) });
}
   // barrel length of each weapon (UZI / SHOTGUN / SNIPER) on the character
var SHOOT_KNOCKBACK = 5, SHOOT_KNOCKBACKRESET = 0.25;
// Original player run cycle: arm swing, leg swing, body lift, and gun knockback reset.
function animF(e) {
  var a = e.an;
  if (e.jet) {
    a.la = Math.sin(a.c) / 2; a.rl = Math.sin(a.c * 0.9) * 0.5; a.ll = Math.sin(-a.c * 0.9) * 0.5; a.lift = Math.sin(a.c) * 5; a.c += Math.PI / 10;
  } else { a.la -= a.la * 0.1; a.rl -= a.rl * 0.1; a.ll -= a.ll * 0.1; a.lift -= a.lift * 0.1; }
  a.kb -= a.kb * SHOOT_KNOCKBACKRESET;
  // small head motion: follows the aim (up / down / forward) and lags behind the movement (left / right / up / down)
  var fx = Math.abs(Math.cos(e.aim || 0)), fy = Math.sin(e.aim || 0), mv = (e.vx || 0) * (e.face || 1), my = e.vy || 0, ph = frame / 38 + (e.name ? e.name.length : 0);
  var thx = cl(fx * 1.1 - mv * 0.3 + Math.sin(ph) * 0.45, -2.4, 2.4), thy = cl(fy * 1.7 - my * 0.22 + Math.cos(ph * 1.3) * 0.3, -2.4, 2.4), thr = cl(fy * 0.17 - mv * 0.012 + Math.sin(ph) * 0.03, -0.26, 0.26);
  a.hx = (a.hx || 0) + (thx - (a.hx || 0)) * 0.18; a.hy = (a.hy || 0) + (thy - (a.hy || 0)) * 0.18; a.hr = (a.hr || 0) + (thr - (a.hr || 0)) * 0.18;
}
// Right-arm angle used by the original character (mirrored when facing left).
function armRot(e) { return (e.aim - Math.PI / 2 - (e.tilt || 0)) * e.face + (e.mel > 14 ? -0.8 + (25 - e.mel) * 0.15 : 0); }
// World position of the gun barrel tip of the original character.
function muzzle(e) {
  var a = e.an, f = e.face, rot = armRot(e), ox = Math.cos(rot - Math.PI / 2) * a.kb, oy = Math.sin(rot - Math.PI / 2) * a.kb;
  var gr = -a.kb * 0.1, gx = GUN_X, gy = gunTip(e.wi) * 1.2 * GUN_K - gunGrip(e.wi);
  var px = gx * Math.cos(gr) - gy * Math.sin(gr), py = gx * Math.sin(gr) + gy * Math.cos(gr) + GUN_Y;
  var qx = px - 4.375, qy = py - 0.9, shd_ = shoulder(e);
  var rx = qx * Math.cos(rot) - qy * Math.sin(rot) + shd_.x + ox, ry = qx * Math.sin(rot) + qy * Math.cos(rot) + shd_.y + oy;
  var dx = (rx - 17.5) * f, dy = ry - 22.5, ct = Math.cos(e.tilt || 0), st = Math.sin(e.tilt || 0);
  return [e.x + e.w / 2 + dx * ct - dy * st, e.y + 31 - a.lift * 0.45 + dx * st + dy * ct];
}
function shoot(e, cont) {
  var w = WEAPONS[e.wi];
  if (e.cool > 0 || e.reload > 0) return;
  if (e.ammo[e.wi] <= 0) { reload(e); return; }
  e.ammo[e.wi]--; if (w.burst && !cont) e.bq = w.burst - 1; e.cool = (w.burst && e.bq > 0) ? 3 : w.rate; e.fl = 3;
  var m = muzzle(e), mx = m[0], my = m[1], ax = e.x + e.w / 2, ay = e.y + 36, d0 = MP ? 34 : Math.max(10, (mx - ax) * Math.cos(e.aim) + (my - ay) * Math.sin(e.aim));
  var ox = ax + Math.cos(e.aim) * d0, oy = ay + Math.sin(e.aim) * d0;   // start point on the aim line itself
  for (var pi = 0, pn = w.pelN || 1; pi < pn; pi++) { var pa = e.aim + (pn > 1 ? (pi - (pn - 1) / 2) * (w.spr || 0.1) : 0);
    bullets.push({ id: ++bulletSeq, x: ox, y: oy, vx: Math.cos(pa) * w.speed, vy: Math.sin(pa) * w.speed, d: w.dmg, o: e, life: w.life || 70, ex: w.ex, emp: w.emp, loc: MP }); }
  e.vx -= Math.cos(e.aim) * w.rec * 0.3; e.vy -= Math.sin(e.aim) * w.rec * 0.2;
  sfx(w.snd, mx, my); shotFX(e, mx, my, e.aim); evp('sh', fighters.indexOf(e), rd(mx), rd(my), rd(e.aim));
}
function reload(e) {
  var w = WEAPONS[e.wi];
  if (e.reload > 0 || e.ammo[e.wi] >= w.mag || e.res[e.wi] <= 0) return;
  e.reload = w.rel; sfx('rel1', e.x, e.y, 1);
}
function swap(e) { if (e.alive) { e.sl = (e.sl + 1) % 3; e.wi = e.inv3[e.sl]; e.reload = 0; e.cool = 10; sfx('click', e.x, e.y); } }
var items = [], ITEMW0 = [3, 'g', 4, 'a', 5, 'h', 'g', 6, 7, 'a', 'g', 8, 'h', 9, 10, 'a', 'g', 's', 11, 12, 'h', 13, 'a', 'g', 14, 15, 'g', 'a', 16, 's', 17, 'h', 18, 19], ITEMW = ITEMW0.map(function (v) { return typeof v === 'number' ? v % 10 : v; });
function placeItems() {
  var pts = SPAWNS.map(function (q) { return [q[0], q[1]]; }), out = [];
  S.forEach(function (r, i) { if (i >= 1 && i <= 3) return; var n = Math.max(1, Math.floor(r[2] / 380)); for (var j = 1; j <= n; j++) { var x = r[0] + r[2] * j / (n + 1); if (!solidAt(x, r[1] - 30)) pts.push([x, r[1]]); } });
  pts.forEach(function (p) { if (out.every(function (o) { return Math.hypot(o[0] - p[0], o[1] - p[1]) > 90; })) out.push(p); });
  var n = out.length, wl = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(function () { return Math.random() - 0.5; }), wc = Math.min(n, Math.max(10, Math.round(n * 0.6))), lst = [], ex = ['a', 'g', 'h', 'a', 's', 'g', 'h', 'a'];
  for (var q = 0; q < wc; q++) lst.push(q < 10 ? wl[q] : Math.floor(Math.random() * 10));   // all 10 weapons first, then random repeats
  for (q = 0; lst.length < n; q++) lst.push(ex[q % ex.length]);
  lst.sort(function () { return Math.random() - 0.5; });   // random order on every map / every match
  items = out.map(function (sp, i) { return { x: sp[0], y: sp[1], k: lst[i], t: 0 }; });
}
function nearItem(e) {
  for (var i = 0; i < items.length; i++) { var it = items[i]; if (it.t <= 0 && !(it.cd > 0) && it.k !== 'a' && it.k !== 'h' && it.k !== 's' && Math.abs(e.x + e.w / 2 - it.x) < 40 && Math.abs(e.y + e.h - it.y) < 50) return it; }
  return null;
}
function pickup(e) {
  var it = nearItem(e); if (!it || !e.alive) return;
  if (it.k === 'g') { e.gren = Math.min(99, e.gren + 3); it.t = 900; }
  else { var old = e.inv3[e.sl]; e.inv3[e.sl] = it.k; e.wi = it.k; e.ammo[it.k] = WEAPONS[it.k].mag; e.res[it.k] = e.bot ? WEAPONS[it.k].res : Math.max(e.res[it.k], START_RES[it.k]); e.reload = 0; it.k = old; it.cd = 45; }
  sfx('click', e.x, e.y);
}
var SMB = []; (function () { for (var i = 0; i < 14; i++) { var a = i * 2.4; SMB.push([Math.cos(a) * (20 + (i % 5) * 18), Math.sin(a) * (14 + (i % 4) * 14) - 10, 46 + (i % 3) * 14]); } })();
function inSmoke(f) { return smokes.some(function (q) { return q.dep && Math.hypot(f.x + f.w / 2 - q.x, f.y + 31 - q.y) < 125 * Math.min(1, q.age / 40) + 10; }); }
function throwSmoke(e) {
  if (!e.alive || !(e.smoke > 0) || e.scool > 0) return; e.smoke--; e.scool = 30; sfx('pin', e.x, e.y);
  smokes.push({ x: e.x + e.w / 2, y: e.y + 31, vx: Math.cos(e.aim) * 9 + e.vx * 0.5, vy: Math.sin(e.aim) * 9 - 2, fuse: 45, age: 0, dep: false });
}
function smokeStep() {   // smoke grenade: lands, opens, lasts 20 s (1200 frames), then disappears
  smokes.forEach(function (q) {
    if (!q.dep) {
      q.vy += G * 0.8; if (solidAt(q.x + q.vx, q.y)) q.vx *= -0.5; else q.x += q.vx;
      if (solidAt(q.x, q.y + q.vy + (q.vy > 0 ? 4 : -4))) { q.vy *= -0.45; q.vx *= 0.8; if (Math.abs(q.vy) < 1) q.vy = 0; } else q.y += q.vy;
      if (--q.fuse <= 0) { q.dep = true; q.vx = q.vy = 0; }
    } else q.age++;
  });
  smokes = smokes.filter(function (q) { return q.age < 1200; });
  fighters.forEach(function (f) { if (f.scool > 0) f.scool--; });
}
// medkit (full health), ammo box (+100 to the held weapon) and smoke grenades are collected automatically when you stand on them
function autoItems() {
  [P].concat(MP ? [P2] : []).forEach(function (f) {
    if (!f.alive) return;
    items.forEach(function (it) {
      if (it.t > 0 || (it.k !== 'a' && it.k !== 'h' && it.k !== 's')) return;
      if (Math.abs(f.x + f.w / 2 - it.x) < 40 && Math.abs(f.y + f.h - it.y) < 50) {
        if (it.k === 'a') { var aw = WEAPONS[f.wi], cap = START_RES[f.wi] * 2; f.res[f.wi] = Math.max(f.res[f.wi], Math.min(cap, f.res[f.wi] + Math.max(10, aw.mag * 2))); }
        else if (it.k === 'h') { if (f.hp >= 100) return; f.hp = 100; }
        else f.smoke = Math.min(6, (f.smoke || 0) + 2);
        it.t = 900; sfx('click', f.x, f.y);
      }
    });
  });
}
function throwG(e) {
  if (!e.alive || e.gren <= 0 || e.gcool > 0) return; e.gren--; e.gcool = 30; sfx('pin', e.x, e.y);
  grenades.push({ x: e.x + e.w / 2, y: e.y + 31, vx: Math.cos(e.aim) * 9 + e.vx * 0.5, vy: Math.sin(e.aim) * 9 - 2, t: 90, o: e });
}
function melee(e) {
  if (!e.alive || e.mel > 0) return; e.mel = 25; sfx('melee', e.x, e.y);
  fighters.forEach(function (f) {
    if (f !== e && f.alive && Math.abs(f.y - e.y) < 30 && (f.x - e.x) * e.face > -8 && Math.abs(f.x - e.x) < 46) { hit(f, 30, e); f.vx += e.face * 5; f.vy -= 2; }
  });
}
function boom(g) {
  sfx('boom', g.x, g.y); boomFX(g.x, g.y); evp('bm', rd(g.x), rd(g.y));
  fighters.forEach(function (f) {
    if (!f.alive) return; var dx = f.x + f.w / 2 - g.x, dy = f.y + f.h / 2 - g.y, d = Math.hypot(dx, dy);
    if (d < 120) { var inv = f.inv, dm = (g.o && g.o.bot) ? Math.round(90 * (1 - d / 120)) : (d < 45 ? 120 : Math.round(100 * (1 - (d - 45) / 75))); if (g.o === f && !f.bot) dm = Math.round(dm * 0.35); hit(f, dm, g.o); f.vx += dx / (d || 1) * 6; f.vy += dy / (d || 1) * 6 - 3; }
  });
}

// ---------------- Update ----------------
function upd(e, k) {
  if (!e.alive) { if (--e.rt <= 0 && !over) { if (nextBot - frame > 700) nextBot = frame; if (e.bot && !MP && frame < nextBot) { e.rt = 1; return; } spawn(e); } return; }
  e.aim = k.aim; e.face = Math.cos(e.aim) >= 0 ? 1 : -1;
  var gr = e.ground;
  // Mini-Militia style stick flight: any held direction keeps the jetpack running, the body leans with the stick angle
  var sx = k.sx != null ? k.sx : k.mx, sy = k.sy != null ? k.sy : (k.up ? -1 : k.dn ? 1 : 0);
  if (e.bot) sx *= 0.8;
  var mag = Math.hypot(sx, sy), on = mag > 0.2, pw = e.fuel > 0 ? 1 : (e.bot ? 0 : 0.55);
  var upf = Math.max(0, -sy), dnf = Math.max(0, sy);
  var fly = on && (e.bot ? pw > 0 : (!gr || sy < -0.3));
  e.vx += on ? sx * (gr ? 0.9 : 0.8) : 0; e.vx *= gr ? 0.88 : 0.9; e.vx = cl(e.vx, -7, 7);
  if (fly) { e.vy -= (e.bot || gr ? 0 : G * 0.93) + upf * 0.9 * pw; if (e.vy < -7) e.vy = -7; }
  if (on && !gr) e.vy += dnf * 0.7;
  if (fly) e.fuel = Math.max(0, e.fuel - 0.06 - upf * 0.2);
  e.jet = fly || (gr && on); e.jp = upf > 0.3 ? 2 : 1; animF(e);
  if (fly) flame(e, upf > 0.3 ? 2 : 1, upf <= 0.3); else e.fuel = Math.min(100, e.fuel + (gr ? 1 : 0.15));
  var tt = on ? cl(Math.atan2(sx, Math.max(-sy, 0.6)), -0.95, 0.95) * Math.min(1, mag * 1.4) * (gr ? 0.25 : 1) : 0;
  e.tilt += (tt - e.tilt) * 0.2;
  // health slowly comes back the further you are from every enemy
  if (!e.bot && e.hp < 100) {
    var nd = 1e9; fighters.forEach(function (f) { if (f !== e && f.alive) nd = Math.min(nd, Math.hypot(f.x - e.x, f.y - e.y)); });
    if (nd > 380) e.hp = Math.min(100, e.hp + 0.04 + Math.min(0.2, (nd - 380) / 3000));
  }
  e.vy += G; if (e.vy > 13) e.vy = 13;
  e.x += e.vx;
  for (var i = 0; i < S.length; i++) { var s = S[i]; if (e.x < s[0] + s[2] && e.x + e.w > s[0] && e.y < s[1] + s[3] && e.y + e.h > s[1]) { e.x = e.vx > 0 ? s[0] - e.w : s[0] + s[2]; e.vx = 0; } }
  e.y += e.vy; e.ground = false;
  for (i = 0; i < S.length; i++) {
    s = S[i];
    if (e.x < s[0] + s[2] && e.x + e.w > s[0] && e.y < s[1] + s[3] && e.y + e.h > s[1]) {
      if (e.vy > 0) { e.y = s[1] - e.h; e.ground = true; } else e.y = s[1] + s[3];
      e.vy = 0;
    }
  }
  if (e.y > H + 60) { e.inv = 0; hit(e, 999, null); return; }
  if (e.ground && Math.abs(e.vx) > 0.5) e.step += Math.abs(e.vx) * 0.12;
  if (e.cool > 0) e.cool--; if (e.fl > 0) e.fl--; if (e.inv > 0) e.inv--; if (e.mel > 0) e.mel--; if (e.gcool > 0) e.gcool--;
  if (e.reload > 0 && e.reload === (WEAPONS[e.wi].rel >> 1)) sfx('rel2', e.x, e.y, 1);
  if (e.reload > 0 && --e.reload === 0) {
    var w = WEAPONS[e.wi], take = Math.min(w.mag - e.ammo[e.wi], e.res[e.wi]); e.ammo[e.wi] += take; e.res[e.wi] -= take; sfx('rel3', e.x, e.y, 1);
  }
  if (e.ammo[e.wi] <= 0 && e.reload === 0 && e.cool <= 0 && e.res[e.wi] > 0) reload(e);   // empty -> reload by itself
  if (e.empT > 0) { e.empT--; e.fuel = 0; }
  if (e.bq > 0 && e.cool <= 0) { e.bq--; shoot(e, 1); }
  var sw = WEAPONS[e.wi].spin;
  if (k.fire) { if (sw) { e.sp = (e.sp || 0) + 1; if (e.sp >= sw) shoot(e); } else shoot(e); } else e.sp = 0;
}
function los(a, b) {
  var x = a.x + a.w / 2, y = a.y + 31, tx = b.x + b.w / 2, ty = b.y + 31, n = Math.ceil(Math.hypot(tx - x, ty - y) / 16);
  for (var i = 1; i < n; i++) if (solidAt(x + (tx - x) * i / n, y + (ty - y) * i / n)) return false;
  return true;
}
function clearLen(e, ang, max) {
  var x = e.x + e.w / 2, y = e.y + e.h / 2, ca = Math.cos(ang), sa = Math.sin(ang), px = -sa * 18, py = ca * 18;
  for (var d = 20; d <= max; d += 20) { var X = x + ca * d, Y = y + sa * d; if (solidAt(X, Y) || solidAt(X + px, Y + py) || solidAt(X - px, Y - py)) return d - 20; }
  return max;
}
// Bots always hunt the player, read the terrain with probe rays, steer round walls/platforms and break out when stuck.
function aiCtl(e) {
  var a = e.ai, k = { sx: 0, sy: 0, mx: 0, up: false, dn: false, fire: false, aim: e.aim };
  e.fuel = Math.min(100, e.fuel + 0.12);
  if (!a.side) a.side = Math.random() < 0.5 ? -1 : 1;
  if (--a.t <= 0) {
    a.t = 15 + R(0, 15); var b = P.alive ? P : null, bd = 1e9;
    if (!b) fighters.forEach(function (f) { if (f !== e && f.alive) { var dd = Math.hypot(f.x - e.x, f.y - e.y); if (dd < bd) { bd = dd; b = f; } } });
    a.tg = b; a.err = R(-0.1, 0.1) * (1 + 3 * (1 - cl(frame / 3600, 0.2, 1))); a.of = R(0, 90); if (Math.random() < 0.25) a.side = -a.side;
  }
  var t = a.tg; if (!t || !t.alive) { k.sx = k.mx = a.side * 0.5; k.sy = -0.5; k.up = true; return k; }
  var hid = inSmoke(t); if (!hid || a.lx == null) { a.lx = t.x + t.w / 2; a.ly = t.y + 31; }
  var ag = cl(frame / 3600, 0.2, 1), dx = a.lx - (e.x + e.w / 2), dy = a.ly - (e.y + e.h / 2), d = Math.hypot(dx, dy), seen = !hid && los(e, t), base = Math.atan2(dy, dx), ang = base, i;
  if (frame % 40 === 0) { if (a.px != null && Math.hypot(e.x - a.px, e.y - a.py) < 25 && d > 240) { a.esc = 45 + R(0, 30); a.ea = null; } a.px = e.x; a.py = e.y; }
  if (d < 230 && seen) ang = base + (Math.PI / 2 + (d < 150 ? 0.9 : 0)) * a.side;
  if (a.esc > 0) {
    a.esc--;
    if (a.ea == null) { var bl = -1; for (i = 0; i < 12; i++) { var an = Math.random() * TAU, L = clearLen(e, an, 240) - Math.max(0, Math.sin(an)) * 60; if (L > bl) { bl = L; a.ea = an; } } }
    ang = a.ea;
  } else {
    var offs = [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.7, -1.7, 2.3, -2.3, Math.PI], pick_ = ang, bestL = -1;
    for (i = 0; i < offs.length; i++) { var an2 = ang + offs[i] * a.side, L2 = clearLen(e, an2, 170); if (L2 >= 170) { pick_ = an2; break; } if (L2 > bestL) { bestL = L2; pick_ = an2; } }
    ang = pick_;
  }
  var sp = (d < 230 && seen ? 0.6 : 1) * (0.6 + 0.4 * ag);
  k.sx = Math.cos(ang) * sp; k.sy = cl(Math.sin(ang) * sp - 0.5, -1, 1); k.mx = k.sx; k.up = k.sy < -0.3; k.dn = k.sy > 0.3;
  k.aim = Math.atan2(t.y + 31 - (e.y + 36), t.x + t.w / 2 - (e.x + e.w / 2)) + a.err;
  var wi = e.inv3[d > 520 ? 2 : d < 210 ? 1 : 0];
  if (wi !== e.wi && e.reload === 0 && e.cool === 0) e.wi = wi;
  if (e.ammo[e.wi] === 0) reload(e);
  k.fire = seen && d < 800 && ((frame + a.of) % 90 < 55 * ag);
  if (seen && d < 350 && e.gren > 0 && Math.random() < 0.004) throwG(e);
  if (nearItem(e) && Math.random() < 0.03) pickup(e);
  return k;
}

// ---------------- Input ----------------
var K = {}, M = { x: 0, y: 0, d: false, moved: false }, T = { lx: 0, ly: 0, rx: 0, ry: 0, rm: 0, ron: false }, zoom = 1, ZS = [1, 1.5, 0.75];
var cam = { x: 0, y: 0 }, s = 1;
function doZoom() { zoom = ZS[(ZS.indexOf(zoom) + 1) % ZS.length]; var z = document.getElementById('zl'); if (z) z.textContent = zoom + 'x'; }
addEventListener('keydown', function (e) {
  if (e.code === 'Escape') { escKey(); return; }
  if (MENU) { if (e.code === 'Enter' && el('menu').classList.contains('show') && !el('settings').classList.contains('show')) el('bPlay').click(); return; }
  K[e.code] = true; audio();
  if (e.code === 'KeyR') act('r'); if (e.code === 'KeyQ' || e.code === 'Tab') act('q'); if (e.code === 'KeyG') act('g');
  if (e.code === 'KeyF') act('f'); if (e.code === 'KeyH') act('s'); if (e.code === 'KeyE') act('p'); if (e.code === 'KeyZ') doZoom();
  if (/^Digit[1-3]$/.test(e.code)) act('w', +e.code.slice(5) - 1);
  if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].indexOf(e.code) >= 0) e.preventDefault();
});
addEventListener('keyup', function (e) { K[e.code] = false; });
addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { M.x = e.clientX * dpr; M.y = e.clientY * dpr; M.moved = true; } });
addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') { M.d = true; audio(); } });
addEventListener('pointerup', function (e) { if (e.pointerType === 'mouse') M.d = false; });
addEventListener('contextmenu', function (e) { e.preventDefault(); });
function doAct(e, a, v) {
  if (a === 'r') reload(e); else if (a === 'q') swap(e); else if (a === 'g') throwG(e); else if (a === 'f') melee(e); else if (a === 'p') pickup(e); else if (a === 's') throwSmoke(e);
  else if (a === 'w' && e.alive) { e.sl = v; e.wi = e.inv3[v]; e.reload = 0; }
}
var outActs = [];
function act(a, v) {
  if (MP) { outActs.push([a, v]); if (a === 'r' || a === 'q' || a === 'w') { doAct(ME, a, v); actSeq = inputSeq + 1; } }   // reload / swap feel instant; the server confirms
  else doAct(P, a, v);
}
function pctl() {
  var k = { fire: false, aim: ME.aim }, sx = 0, sy = 0;
  if (K.KeyA || K.ArrowLeft) sx -= 1; if (K.KeyD || K.ArrowRight) sx += 1; if (K.KeyW || K.ArrowUp || K.Space) sy -= 1; if (K.KeyS || K.ArrowDown) sy += 1;
  var m = Math.hypot(sx, sy); if (m > 1) { sx /= m; sy /= m; }
  if (Math.hypot(T.lx, T.ly) > 0.2) { sx = T.lx; sy = T.ly; }
  k.sx = sx; k.sy = sy; k.mx = sx; k.up = sy < -0.3; k.dn = sy > 0.3;
  if (T.ron) { if (T.rm > 0.2) k.aim = Math.atan2(T.ry, T.rx); k.fire = T.rm > 0.55; }
  else if (M.moved) { k.aim = Math.atan2(M.y / s + cam.y - (ME.y + 36), M.x / s + cam.x - (ME.x + ME.w / 2)); k.fire = M.d; }
  return k;
}
function stick(id, cb) {
  var el = document.getElementById(id), kn = el.querySelector('.knob'), pid = null;
  function mv(e) {
    var r = el.getBoundingClientRect(), rad = r.width / 2, dx = e.clientX - (r.left + rad), dy = e.clientY - (r.top + rad), m = Math.hypot(dx, dy), lim = rad * 0.7;
    if (m > lim) { dx *= lim / m; dy *= lim / m; m = lim; } var kz = r.width / (el.offsetWidth || r.width) || 1; kn.style.transform = 'translate(' + dx / kz + 'px,' + dy / kz + 'px)'; cb(dx / lim, dy / lim, m / lim, true);
  }
  el.addEventListener('pointerdown', function (e) { e.preventDefault(); audio(); pid = e.pointerId; try { el.setPointerCapture(pid); } catch (_) {} mv(e); });
  el.addEventListener('pointermove', function (e) { if (e.pointerId === pid) { e.preventDefault(); mv(e); } });
  function end(e) { if (e.pointerId !== pid) return; pid = null; kn.style.transform = ''; cb(0, 0, 0, false); }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { el.addEventListener(n, end); });
}
function btn(id, fn) { var el = document.getElementById(id); el.addEventListener('pointerdown', function (e) { e.preventDefault(); audio(); fn(); }); }
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch');
stick('sL', function (x, y) { T.lx = x; T.ly = y; });
stick('sR', function (x, y, m, on) { T.rx = x; T.ry = y; T.rm = m; T.ron = on; });
btn('bGren', function () { act('g'); }); btn('bSmoke', function () { act('s'); }); btn('bMelee', function () { act('f'); }); btn('bRel', function () { act('r'); });
btn('bSwap', function () { act('q'); }); btn('bPick', function () { act('p'); }); btn('bZoom', doZoom);

// ---------------- Step ----------------
function showOver(h) { over = true; el('rank').innerHTML = h; el('bAgain').style.display = role === 'guest' ? 'none' : ''; el('over').classList.add('show'); }
function finish() {
  var h = fighters.slice().sort(function (a, b) { return b.kills - a.kills; }).map(function (f, i) { return (i + 1) + '. ' + f.name + ' - ' + f.kills; }).join('<br>');
  showOver(h); if (role === 'host') net({ t: 'ov', h: h });
}
var in2 = { sx: 0, sy: 0, aim: 0, fire: false };
function step() {
  if (MP && !netOK) return;
  if (MP) { nstep(); return; }
  frame++; if (!over) { left -= 1 / 60; if (left <= 0) { left = 0; finish(); } }
  items.forEach(function (it) { if (it.t > 0) it.t--; if (it.cd > 0) it.cd--; });
  autoItems(); smokeStep();
  upd(P, pctl());
  if (!MP) bots.forEach(function (b) { upd(b, b.alive ? aiCtl(b) : { mx: 0, up: false, dn: false, fire: false, aim: 0 }); });
  if (jetG) jetG.gain.setTargetAtTime(SETT.snd && ME.alive && ME.jet ? 0.12 : 0, AC.currentTime, 0.05);
  bullets.forEach(function (b) {
    b.life--; var n = Math.ceil(Math.hypot(b.vx, b.vy) / 10);
    for (var i = 0; i < n && !b.dead; i++) {
      b.x += b.vx / n; b.y += b.vy / n;
      if (solidAt(b.x, b.y) || b.x < 0 || b.x > W || b.y < 0 || b.y > H) { b.dead = true; sparkFX(b.x, b.y); evp('sp', rd(b.x), rd(b.y)); break; }
      for (var q = 0; q < fighters.length; q++) {
        var f = fighters[q];
        if (f !== b.o && f.alive && b.x > f.x - 4 && b.x < f.x + f.w + 4 && b.y > f.y - 2 && b.y < f.y + f.h + 2) { var rz = (b.y - f.y) / f.h, zm = rz < 0.25 ? 1.7 : rz < 0.5 ? 1.5 : 1; hit(f, b.d * zm, b.o, b.x, b.y); f.vx += b.vx * 0.03; if (b.emp) f.empT = 180; b.dead = true; break; }
      }
    }
    if (b.dead && b.ex) boom({ x: b.x, y: b.y, o: b.o });
    if (b.life <= 0) b.dead = true;
  });
  bullets = bullets.filter(function (b) { return !b.dead; });
  grenades.forEach(function (g) {
    g.vy += G * 0.8;
    if (solidAt(g.x + g.vx, g.y)) g.vx *= -0.5; else g.x += g.vx;
    if (solidAt(g.x, g.y + g.vy + (g.vy > 0 ? 4 : -4))) { g.vy *= -0.45; g.vx *= 0.8; if (Math.abs(g.vy) < 1) g.vy = 0; } else g.y += g.vy;
    if (frame % 3 === 0) addP({ x: g.x, y: g.y, vx: 0, vy: -0.3, l: 18, m: 18, t: 'smoke', r: 3 });
    if (--g.t <= 0) { boom(g); g.d = 1; }
  });
  grenades = grenades.filter(function (g) { return !g.d; });
  tail();
}
function tail() {
  parts.forEach(function (p) {
    p.x += p.vx; p.y += p.vy; p.vx *= p.t === 'cloud' ? 0.85 : 0.98; if (p.t === 'cloud') p.vy *= 0.85; if (p.t === 'blood' || p.t === 'gib' || p.t === 'shell') p.vy += 0.3;
    if ((p.t === 'gib' || p.t === 'shell') && solidAt(p.x, p.y + p.vy + 2)) { p.vy *= -0.4; p.vx *= 0.7; }
    if (p.t === 'fire') p.r *= 0.95; if (p.t === 'smoke') p.r += 0.4; p.l--;
  });
  parts = parts.filter(function (p) { return p.l > 0; });
  feedL.forEach(function (f) { f.l--; }); feedL = feedL.filter(function (f) { return f.l > 0; });
  if (shake > 0) shake *= 0.85;
  var vw = cv.width / s, vh = cv.height / s, tx = ME.x + ME.w / 2 - vw / 2, ty = ME.y - vh / 2 + 20;
  cam.x += (cl(tx, 0, Math.max(0, W - vw)) - cam.x) * 0.15; cam.y += (cl(ty, 0, Math.max(0, H - vh)) - cam.y) * 0.15;
}

// ---------------- Drawing ----------------
var dpr = 1, MENU = true, started = false;
function resize() { dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
addEventListener('resize', resize); resize();
function tile(img, par, y, sc) {
  var iw = img.width * sc, off = -((cam.x * par * s) % iw);
  for (var x = off; x < cv.width; x += iw) c.drawImage(img, x, y, iw, img.height * sc);
}
// Gun pictures (loaded from the links; weapon i uses picture i % 10). Pictures are assumed to point to the right; set GUN_FLIP[n]=1 to mirror one.
var GUN_URLS = [
  'https://i.postimg.cc/YSC1pnmd/Duck-ai-image-2026-10-28-09-36.png', 'https://i.postimg.cc/3Jjp25jH/Duck-ai-image-2026-10-28-09-36-(1).png',
  'https://i.postimg.cc/jj27VDps/Duck-ai-image-2026-10-28-09-36-(2).png', 'https://i.postimg.cc/02vKkWT0/Duck-ai-image-2026-10-28-09-36-(3).png',
  'https://i.postimg.cc/nLNM60K7/Duck-ai-image-2026-10-28-09-36-(4).png', 'https://i.postimg.cc/KcP4H71v/Duck-ai-image-2026-10-28-09-36-(5).png',
  'https://i.postimg.cc/zBmXd35H/Duck-ai-image-2026-10-28-09-36-(6).png', 'https://i.postimg.cc/tJkqC56s/Duck-ai-image-2026-10-28-09-36-(7).png',
  'https://i.postimg.cc/yY66pMqw/Duck-ai-image-2026-10-28-09-36-(8).png', 'https://i.postimg.cc/P59txNC6/Duck-ai-image-2026-10-28-09-37.png'];
var GUN_FLIP = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var GUNS = GUN_URLS.map(function (u, n) {
  var o = { cv: null, w: 1, h: 1 }, im = new Image();
  function done() {
    o.cv = im; o.w = im.naturalWidth; o.h = im.naturalHeight;
    try {   // trim the transparent border so the gun fills its box
      var t = document.createElement('canvas'); t.width = o.w; t.height = o.h; var x = t.getContext('2d'); x.drawImage(im, 0, 0);
      var d = x.getImageData(0, 0, o.w, o.h).data, x0 = o.w, y0 = o.h, x1 = 0, y1 = 0;
      for (var y = 0; y < o.h; y++) for (var xx = 0; xx < o.w; xx++) if (d[(y * o.w + xx) * 4 + 3] > 20) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 > x0 && y1 > y0) { var r = document.createElement('canvas'); r.width = x1 - x0 + 1; r.height = y1 - y0 + 1; r.getContext('2d').drawImage(t, x0, y0, r.width, r.height, 0, 0, r.width, r.height); o.cv = r; o.w = r.width; o.h = r.height; }
    } catch (err) { }
  }
  im.crossOrigin = 'anonymous';
  im.onload = done;
  im.onerror = function () { im = new Image(); im.onload = done; im.src = u; };   // retry without CORS (no trimming)
  im.src = u; return o;
});
// Gun box on the character: every gun gets the same box, the sniper a slightly bigger one. The grip (28% from the back) sits in the hand.
function gunBox(wi) {
  var gi = GUNS[wi % GUNS.length]; if (!gi || !gi.cv) return null;
  var BL = wi === 5 ? 54 : 41, BH = wi === 5 ? 21 : wi === 9 ? 41 : 18, k = Math.min(BL / gi.w, BH / gi.h), dw = gi.w * k, dh = gi.h * k, x0 = -dw * (wi === 9 ? 0.5 : 0.28);
  return { dw: dw, dh: dh, x0: x0, tip: x0 + dw, c: x0 + dw / 2 };
}
var GUN_K = 0.85;   // weapon size in the hand and on the ground (1 = old size); lower = smaller
function gunGrip(wi) { return 0.3 * gunTip(wi) * 1.2 * GUN_K; }   // the hand holds the gun about 30% from its back end
function gunTip(wi) { var b = gunBox(wi); return b ? b.tip : WEAPONS[wi].len; }
function gunCenter(wi) { var b = gunBox(wi); return b ? b.c : WEAPONS[wi].len / 2; }
function gunW(wi) { var b = gunBox(wi); return b ? b.dw : WEAPONS[wi].len; }
function gunShape(g, wi) {
  var w = WEAPONS[wi], bx = gunBox(wi);
  if (bx) {
    g.save(); if (GUN_FLIP[wi % GUNS.length]) { g.translate(bx.c, 0); g.scale(-1, 1); g.translate(-bx.c, 0); }
    g.drawImage(GUNS[wi % GUNS.length].cv, bx.x0, -bx.dh * 0.55, bx.dw, bx.dh); g.restore(); return;
  }
  g.fillStyle = '#222'; g.fillRect(0, -3, w.len, 6); g.fillRect(2, 3, 5, 9);
  g.fillStyle = '#6b4a2b'; g.fillRect(-4, -3, 10, 6); if (w.ex) { g.fillStyle = '#4a5a2a'; g.fillRect(w.len - 6, -6, 10, 12); }
}
function rp(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
// The original player character (35x45 white body, red cap, shirt, blue pants, black gun), recoloured per fighter.
// Every size / offset below is taken from the original CSS; arms, legs and gun use the original animation values.
function camo(col, x, y, w, h, sd) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = col;
  for (var i = 0; i < 6; i++) { c.beginPath(); c.ellipse(x + ((sd * 7 + i * 37) % 97) / 97 * w, y + ((sd * 13 + i * 53) % 89) / 89 * h, w * 0.2, h * 0.15, i, 0, TAU); c.fill(); }
  c.restore();
}
var OUTL = '#17120f';
function drawArm(q) {   // sleeve + forearm + white fist (arm local frame: shoulder pivot at 4.375, 0.9)
  c.lineJoin = 'round'; c.lineWidth = 1.1; c.strokeStyle = OUTL;
  c.fillStyle = q.limbL || '#fff'; rp(0.9, 7, 6.95, 9.6, 3.3); c.fill(); c.stroke();
  c.fillStyle = q.sleeve; c.beginPath(); c.moveTo(0, 11); c.lineTo(0, 4.375); c.arcTo(0, 0, 4.375, 0, 4.375); c.arcTo(8.75, 0, 8.75, 4.375, 4.375); c.lineTo(8.75, 11); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(4.375, 15.6, 5.5, 5.3, 0, 0, TAU); c.fill(); c.stroke();   // the fist: always white
  c.strokeStyle = 'rgba(23,18,15,.5)'; c.lineWidth = 0.8; c.lineCap = 'round'; c.beginPath(); c.moveTo(1.8, 14.7); c.lineTo(6.9, 14.7); c.moveTo(2, 17); c.lineTo(6.7, 17); c.stroke();
}
function shirtPath() {   // same shape as before, squeezed into the Tex torso box
  var sx_ = (TX1 - TX0) / 36.8, sy_ = (TY1 - TY0) / 22.8;
  function X(x) { return TX0 + (x + 0.9) * sx_; } function Y(y) { return TY0 + (y - 23.2) * sy_; }
  c.beginPath(); c.moveTo(X(10.5), Y(23.2)); c.quadraticCurveTo(X(2.6), Y(23.4), X(-0.9), Y(28.6)); c.lineTo(X(-0.9), Y(44.4)); c.quadraticCurveTo(X(-0.9), Y(46), X(0.7), Y(46)); c.lineTo(X(34.3), Y(46));
  c.quadraticCurveTo(X(35.9), Y(46), X(35.9), Y(44.4)); c.lineTo(X(35.9), Y(28.6)); c.quadraticCurveTo(X(32.4), Y(23.4), X(24.5), Y(23.2)); c.closePath();
}
// Outfit arms: right arm always holds the gun (weapon pose); left arm joins in while shooting, otherwise swings free. Melee = both free.
function ofArmPose(OF, e, side) {
  var hold = side === 'R' ? !e.noGun && !(e.mel > 14) : (e._hold > 0 && !(e.mel > 14));
  if (side === 'L') return ofArmFree(ofPart(OF, 'fL'), OF.bodyFit ? 2 : OF.mm);   // the second hand always uses the free-arm picture (also when it is raised to help aim)
  return hold ? ofArmHold(ofPart(OF, 'hR'), OF.bodyFit ? 2 : OF.mm) : ofArmFree(ofPart(OF, 'fR'), OF.bodyFit ? 2 : OF.mm);
}
function ofTorsoBottom(OF) { var t = ofPart(OF, 'torso'); return t ? 17.5 + t.h * Math.min(54 / t.w, 31 / t.h) : 48; }
function drawF(e) {
  if (e.fl > 0) e._hold = 50; else if (e._hold > 0) e._hold--;
  if (!e.alive || (e.inv > 0 && frame % 6 < 3)) return;
  var SH = shoulder(e), lk_ = look(e), OF = lk_.outfit >= 0 && ofReady(OUTFITS[lk_.outfit]) ? OUTFITS[lk_.outfit] : null, sk0_ = lk_.skin, q = sk0_ >= 0 && SKIN[sk0_].ok && SKIN[sk0_].col ? SKIN[sk0_].col : e.col, a = e.an, rot = e.noGun ? (e.an.ra || 0) : armRot(e), kx = Math.cos(rot - Math.PI / 2) * a.kb, ky = Math.sin(rot - Math.PI / 2) * a.kb;
  c.save(); c.translate(e.x + e.w / 2, e.y + 5.5 + 22.5 - a.lift * 0.45); c.rotate(e.tilt || 0); c.scale(e.face, 1); c.translate(-17.5, -22.5);
  c.lineJoin = 'round'; c.lineWidth = 1.1; c.strokeStyle = OUTL;
  // legs: pants, ankle, shoe
  [[LEG_R, a.rl], [LEG_L, a.ll]].forEach(function (l) {
    var lf_ = OF ? ofLegFit(OF) : null, lgIn_ = lf_ ? lf_.ins : 0, SXo_ = lf_ ? lf_.sx : LEG_SX;   // legIn: how far (px) each leg of this outfit moves towards the middle, so the legs sit closer together
    c.save(); c.translate(l[0] + (l[0] === LEG_R ? -lgIn_ : lgIn_), LEG_PIVOT); c.rotate(l[1]); c.scale(BK, BK); c.translate(-4.375, -1.0125);
    if (OF) {   // outfit on the CLASSIC body: the boot's NECK (shaft) sits exactly in the middle of the leg and is as wide as the leg end; the leg picture covers the top bit of the boot (a bit of the boot is behind the leg)
      var rt_ = l[0] === LEG_R, pl_ = ofPart(OF, rt_ ? 'legR' : 'legL'), bt_ = ofPart(OF, rt_ ? 'bootR' : 'bootL');
      if (!bt_) {   // FULL LEG picture (leg and boot in one image): leg width = classic leg width, sole on the classic ground line, toe forward; the left and right leg are always drawn the same size
        var fw_ = 8.75 * SXo_, pa_ = ofPart(OF, 'legL') || pl_, pb_ = ofPart(OF, 'legR') || pl_, fTop_, fH_, fW_;
        if (OF.bodyFit) {   // fixed leg box: only FIT_LEG_HIDE of the picture behind the torso, width follows the leg width (limited stretch)
          fTop_ = fitLegTop(FIT_LEG_GROUND); fH_ = FIT_LEG_GROUND - fTop_;
          var legW_ = function (p) { var kh = fH_ / p.h, sh = fw_ / ((p.tw || 1) * p.w * kh); return p.w * kh * Math.max(0.8, Math.min(1.35, sh)); };
          fW_ = (legW_(pa_) + legW_(pb_)) / 2;
        } else {
          var fWa_ = fw_ / (pa_.tw || 1), fWb_ = fw_ / (pb_.tw || 1), fHa_ = Math.max(21.1, pa_.h * fWa_ / pa_.w), fHb_ = Math.max(21.1, pb_.h * fWb_ / pb_.w);
          fW_ = (fWa_ + fWb_) / 2; fH_ = (fHa_ + fHb_) / 2; fTop_ = 21.1 - fH_;
        }
        var fcx_ = pl_.lflip ? 1 - (pl_.tcx != null ? pl_.tcx : 0.5) : (pl_.tcx != null ? pl_.tcx : 0.5), fx_ = 4.375 - fcx_ * fW_;
        c.save(); if (pl_.lflip) { c.translate(fx_ + fW_ / 2, 0); c.scale(-1, 1); c.translate(-(fx_ + fW_ / 2), 0); }
        c.drawImage(pl_.src, fx_, fTop_, fW_, fH_); c.restore();
        c.restore(); return;
      }
      var LW_ = 8.75 * SXo_, hs_ = bt_.sw != null ? bt_.sw : 1, cs_ = bt_.sw != null ? (bt_.sx0 + bt_.sx1) / 2 : 0.5, cf_ = bt_.flip ? 1 - cs_ : cs_;
      var bk_ = LW_ / (hs_ * bt_.w);   // neck width = leg width
      bk_ = Math.min(bk_, 1.45 * LW_ / bt_.w); bk_ = Math.max(4.5 / bt_.h, Math.min(8.5 / bt_.h, bk_));   // keep the toe small and the boot height sane
      var bw_ = bt_.w * bk_, bh_ = bt_.h * bk_, bx_ = 4.375 - cf_ * bw_, btop_ = 20 - bh_;   // sole stays on the classic ground line (y 20)
      if (OF.classicShoe) { bh_ = 6.3; bw_ = bt_.w * bh_ / bt_.h; bx_ = 4.375 - cf_ * bw_; btop_ = 14.8; }   // classic shoe height and ground line, but the boot keeps its natural width/length (no stretching); neck centred on the leg
      c.save(); if (bt_.flip) { c.translate(bx_ + bw_ / 2, 0); c.scale(-1, 1); c.translate(-(bx_ + bw_ / 2), 0); }
      c.drawImage(bt_.src, bx_, btop_, bw_, bh_); c.restore();
      c.save(); c.translate(4.375, 0); c.scale(SXo_, 1); c.translate(-4.375, 0); c.drawImage(pl_.src, 0, 0, 8.75, btop_ + (OF.classicShoe ? 0.5 * bh_ : 1.2)); c.restore();   // leg end covers the top of the boot
      c.restore(); return;
    }
    c.fillStyle = q.limbD || '#fff'; rp(1.7, 12, 5.35, 6.2, 2); c.fill(); c.stroke();   // ankle
    c.save(); c.translate(4.375, 0); c.scale(LEG_SX, 1); c.translate(-4.375, 0);
    c.fillStyle = q.pants; c.beginPath(); c.moveTo(0, 0); c.lineTo(8.75, 0); c.lineTo(8.3, 14.4); c.quadraticCurveTo(4.375, 15.4, 0.45, 14.4); c.closePath(); c.fill(); c.stroke();
    if (q.camo) camo(q.camo, 0, 0, 8.75, 14.4, l[0]);
    c.restore();
    c.save(); c.translate(4.375, 16.9); c.scale(0.9, 0.62); drawShoe(lk_.shoe); c.restore();
    c.restore();
  });
  // shirt
  var tp_ = OF ? ofPart(OF, 'torso') : null;
  if (tp_) { if (OF.bodyFit) { var tbw_ = TX1 - TX0, tbh_ = TY1 - TY0, tsx_ = tbw_ / tp_.w, tsy_ = tbh_ / tp_.h; if (tsx_ > tsy_ * FIT_TORSO_DIST) tsx_ = tsy_ * FIT_TORSO_DIST; else if (tsy_ > tsx_ * FIT_TORSO_DIST) tsy_ = tsx_ * FIT_TORSO_DIST;
    c.drawImage(tp_.src, (TX0 + TX1) / 2 - tp_.w * tsx_ / 2, TY0, tp_.w * tsx_, tp_.h * tsy_); } else if (OF.mm) c.drawImage(tp_.src, TX0, TY0, TX1 - TX0, TY1 - TY0); else c.drawImage(tp_.src, TX0 - 0.8, TY0 - 0.8, TX1 - TX0 + 1.6, TY1 - TY0 + 1.6); }   // torso: outfits with bodyFit are fitted to the fixed torso box (centred, limited stretch); the others fill the original shirt box   // torso: original shirt box for 'mm' outfits
  else {
  c.save(); shirtPath(); c.clip();
  c.fillStyle = q.shirt; c.fillRect(TX0 - 1, TY0 - 0.5, TX1 - TX0 + 2, TY1 - TY0 + 1); if (q.camo) camo(q.camo, TX0, TY0, TX1 - TX0, TY1 - TY0, 3); c.fillStyle = q.under; c.fillRect(TX0 + 14.7 * (TX1 - TX0) / 36.8, TY0, 14.7 * (TX1 - TX0) / 36.8, TY1 - TY0);
  var sk_ = sk0_; if (sk_ >= 0 && SKIN[sk_].ok) { var sc_ = SKIN[sk_].cv; c.drawImage(sc_, 0, 0, sc_.width, sc_.height, TX0, TY0, TX1 - TX0, TY1 - TY0); }
  c.restore();
  c.lineWidth = 1.1; c.strokeStyle = OUTL; shirtPath(); c.stroke();
  }
  // head (oval) with its own small motion, drawn over the shoulders
  c.save(); c.translate(17.5 + (a.hx || 0), HEAD_CHIN + (a.hy || 0)); c.rotate(a.hr || 0); c.scale(HEAD_SX, HEAD_SY); c.translate(-18, -26);   // smaller, narrower head (bottom stays on the neck)
  if (!headPic(lk_)) { c.fillStyle = '#fff'; c.lineWidth = 1.1; c.strokeStyle = OUTL; headPath(0); c.fill(); c.stroke(); }   // with a mask the head is hidden: only the mask shows
  drawHead(q, lk_);
  c.restore();
  // right (gun) arm
  c.save(); c.translate(SH.x + kx, SH.y + ky); c.rotate(rot); c.translate(-4.375, -0.9);
  c.save(); c.translate(4.375, 0.9); c.scale(ARM_AX, ARM_AY); c.translate(-4.375, -0.9); var rArm_ = OF && ofArmPose(OF, e, 'R'); if (!rArm_) drawArm(q); c.restore();
  if (!e.noGun) { c.save(); c.translate(0, GUN_Y); c.rotate(-a.kb * 0.1); c.translate(GUN_X, -gunGrip(e.wi)); c.rotate(Math.PI / 2); c.scale(1.2 * GUN_K, 1.2 * GUN_K); gunShape(c, e.wi); c.restore(); }
  if (!rArm_ && !e.noGun) { c.save(); c.translate(4.375, 0.9); c.scale(ARM_AX, ARM_AY); c.translate(-4.375, -0.9); c.lineJoin = 'round'; c.lineWidth = 1.1; c.strokeStyle = OUTL; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(4.375, 15.6, 5.5, 5.3, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); }   // the fist closes over the grip
  c.restore();
  // left arm
  c.save(); c.translate(SH.lx, SH.y); c.rotate(OF && e._hold > 0 && !(e.mel > 14) ? armRot(e) * 0.9 : a.la); c.translate(-4.375, -0.9); c.save(); c.translate(4.375, 0.9); c.scale(ARM_AX, ARM_AY); c.translate(-4.375, -0.9); if (!(OF && ofArmPose(OF, e, 'L'))) drawArm(q); c.restore(); c.restore();
  c.restore();
}
function drawWorld() {
  c.setTransform(s, 0, 0, s, (-cam.x + R(-shake, shake)) * s, (-cam.y + R(-shake, shake)) * s);
  c.drawImage(terrain, 0, 0);
  items.forEach(function (it) {
    if (it.t > 0) return; c.save(); c.translate(it.x, it.y - 14);
    if (it.k === 'g') { c.fillStyle = '#3d5a2a'; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill(); c.fillStyle = '#ddd'; c.fillRect(-2, -13, 4, 5); }
    else if (it.k === 'a') { c.fillStyle = '#5a6b2a'; c.strokeStyle = '#222'; c.lineWidth = 2; c.fillRect(-14, -8, 28, 18); c.strokeRect(-14, -8, 28, 18); c.fillStyle = '#ffd34d'; for (var bi = -8; bi <= 8; bi += 8) c.fillRect(bi - 2, -4, 4, 10); }
    else if (it.k === 'h') { c.fillStyle = '#fff'; c.strokeStyle = '#222'; c.lineWidth = 2; c.fillRect(-14, -10, 28, 22); c.strokeRect(-14, -10, 28, 22); c.fillStyle = '#d32c1b'; c.fillRect(-3, -8, 6, 18); c.fillRect(-9, -2, 18, 6); }
    else if (it.k === 's') { c.fillStyle = '#8a9096'; c.strokeStyle = '#222'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#ddd'; c.fillRect(-3, -15, 6, 6); }
    else { c.scale(1.2 * GUN_K, 1.2 * GUN_K); c.translate(-gunCenter(it.k), 0); gunShape(c, it.k); }
    c.restore(); var nm = it.k === 'g' ? 'GRENADES' : it.k === 'a' ? 'AMMO' : it.k === 'h' ? 'MEDKIT' : it.k === 's' ? 'SMOKE' : WEAPONS[it.k].n;
    c.font = 'bold 11px Arial'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 3; c.strokeText(nm, it.x, it.y - 34); c.fillText(nm, it.x, it.y - 34);
  });
  fighters.forEach(drawF);
  if (ME.alive && !MENU) {
    var m_ = muzzle(ME), ca = Math.cos(ME.aim), sa = Math.sin(ME.aim), gx0 = ME.x + ME.w / 2, gy0 = ME.y + 36, gd = Math.max(10, (m_[0] - gx0) * ca + (m_[1] - gy0) * sa); m_ = [gx0 + ca * gd, gy0 + sa * gd];
    [[120, 28, 6], [200, 22, 5], [275, 16, 4]].forEach(function (q) {
      var ax = m_[0] + ca * q[0], ay = m_[1] + sa * q[0]; if (solidAt(ax, ay)) return;
      c.save(); c.translate(ax, ay); c.rotate(ME.aim); c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1.5; c.fillRect(-q[1] / 2, -q[2] / 2, q[1], q[2]); c.strokeRect(-q[1] / 2, -q[2] / 2, q[1], q[2]); c.restore();
    });
  }
  c.lineCap = 'round';
  bullets.forEach(function (b) {   // glowing tracer: bright head, fading tail
    var L_ = b.ex ? 30 : 22, th = b.ex ? 3.2 : 2.3, tg = c.createLinearGradient(-L_, 0, 4, 0);
    c.save(); c.translate(b.x, b.y); c.rotate(Math.atan2(b.vy, b.vx));
    tg.addColorStop(0, b.ex ? 'rgba(255,90,20,0)' : 'rgba(255,170,40,0)'); tg.addColorStop(0.65, b.ex ? 'rgba(255,130,30,.85)' : 'rgba(255,200,60,.8)'); tg.addColorStop(1, '#fff6c8');
    c.fillStyle = tg; c.beginPath(); c.moveTo(-L_, 0); c.lineTo(-L_ * 0.2, -th); c.quadraticCurveTo(3, -th * 1.1, 6, 0); c.quadraticCurveTo(3, th * 1.1, -L_ * 0.2, th); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,220,120,.35)'; c.beginPath(); c.arc(3, 0, th * 2.2, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(3, 0, th * 0.8, 0, TAU); c.fill(); c.restore();
  });
  grenades.forEach(function (g) { c.fillStyle = '#3d5a2a'; c.beginPath(); c.arc(g.x, g.y, 6, 0, TAU); c.fill(); c.fillStyle = '#aaa'; c.fillRect(g.x - 2, g.y - 9, 4, 4); });
  smokes.forEach(function (q) {
    if (!q.dep) { c.fillStyle = '#8a9096'; c.beginPath(); c.arc(q.x, q.y, 6, 0, TAU); c.fill(); return; }
    var gr = Math.min(1, q.age / 40); c.fillStyle = 'rgb(176,181,186)'; c.globalAlpha = (q.age > 1000 ? (1200 - q.age) / 200 : 1) * 0.5;
    SMB.forEach(function (b, i) { var w = Math.sin((frame + i * 17) / 40) * 4; c.beginPath(); c.arc(q.x + b[0] * gr + w, q.y + b[1] * gr, b[2] * gr, 0, TAU); c.fill(); });
    c.globalAlpha = 1;
  });
  parts.forEach(function (p) {
    var a = p.l / p.m; c.globalAlpha = a;
    if (p.t === 'flash') {   // star-shaped muzzle flash pointing along the aim
      var fk = p.l / p.m, fr = p.r * (0.55 + 0.6 * fk); c.globalAlpha = 1; c.save(); c.translate(p.x, p.y); c.rotate(p.a || 0);
      var fg_ = c.createRadialGradient(0, 0, 0, 0, 0, fr * 1.25); fg_.addColorStop(0, 'rgba(255,244,190,' + (0.95 * fk) + ')'); fg_.addColorStop(1, 'rgba(255,140,30,0)'); c.fillStyle = fg_; c.beginPath(); c.arc(0, 0, fr * 1.25, 0, TAU); c.fill();
      c.fillStyle = '#ff9d1e'; c.beginPath(); c.moveTo(-fr * 0.1, -fr * 0.3); c.quadraticCurveTo(fr * 0.8, -fr * 0.4, fr * 1.9, 0); c.quadraticCurveTo(fr * 0.8, fr * 0.4, -fr * 0.1, fr * 0.3); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(0, 0); c.lineTo(fr * 0.75, -fr * 0.85); c.lineTo(fr * 0.35, 0); c.lineTo(fr * 0.75, fr * 0.85); c.closePath(); c.fill();
      c.fillStyle = '#ffe27a'; c.beginPath(); c.moveTo(0, -fr * 0.2); c.quadraticCurveTo(fr * 0.7, -fr * 0.25, fr * 1.4, 0); c.quadraticCurveTo(fr * 0.7, fr * 0.25, 0, fr * 0.2); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(fr * 0.1, 0, fr * 0.3, 0, TAU); c.fill(); c.restore();
    }
    else if (p.t === 'cloud') { c.globalAlpha = a * 0.55; c.fillStyle = '#dfe3e7'; c.beginPath(); c.arc(p.x, p.y, p.r * (1 + (1 - a) * 1.7), 0, TAU); c.fill(); }
    else if (p.t === 'fire') { c.fillStyle = 'hsl(' + (15 + (1 - a) * 35) + ',100%,' + (55 + (1 - a) * 20) + '%)'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    else if (p.t === 'smoke') { c.fillStyle = '#888'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    else if (p.t === 'spark') { c.strokeStyle = '#ffd34d'; c.lineWidth = 1.7; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 1.4, p.y - p.vy * 1.4); c.stroke(); }
    else if (p.t === 'blood') { c.fillStyle = '#b01010'; c.fillRect(p.x, p.y, 3, 3); }
    else if (p.t === 'gib') { c.fillStyle = p.col; c.fillRect(p.x, p.y, p.r, p.r); }
    else { c.save(); c.translate(p.x, p.y); c.rotate((p.rot || 0) + (p.m - p.l) * (p.vr || 0)); c.fillStyle = p.sh ? '#d6352b' : '#e3b341'; c.fillRect(-2.4, -1.2, 4.8, 2.4); c.fillStyle = p.sh ? '#f2a39d' : '#fff0b0'; c.fillRect(-2.4, -1.2, 4.8, 0.8); c.restore(); }
    c.globalAlpha = 1;
  });
  c.font = 'bold 13px Arial'; c.textAlign = 'center'; c.lineWidth = 3;
  fighters.forEach(function (f) {
    if (!f.alive) return; var cx = f.x + f.w / 2;
    c.strokeStyle = '#000'; c.fillStyle = f === ME ? '#8fd3ff' : '#fff'; c.strokeText(f.name, cx, f.y - 30); c.fillText(f.name, cx, f.y - 30);
    c.fillStyle = '#000'; c.fillRect(cx - 21, f.y - 25, 42, 7); c.fillStyle = '#e53935'; c.fillRect(cx - 20, f.y - 24, 40 * Math.max(0, f.hp) / 100, 5);
  });
}
function drawPick(it) {
  var g = el('bPickC').getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 160, 160); if (!it) return;
  g.save(); g.translate(80, 84);
  if (it.k === 'g') { g.fillStyle = '#4a6b2a'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(0, 6, 26, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#ddd'; g.fillRect(-6, -34, 12, 12); }
  else { var w = WEAPONS[it.k], k = Math.min(2.6, 92 / gunW(it.k)) * 1.2; g.scale(k, k); g.translate(-gunCenter(it.k), 0); gunShape(g, it.k); }
  g.restore(); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.shadowColor = '#000'; g.shadowBlur = 4;
  [0, Math.PI].forEach(function (a) {
    var e = a + Math.PI - 0.5; g.beginPath(); g.arc(80, 80, 40, a + 0.3, e); g.stroke();
    var ex = 80 + 40 * Math.cos(e), ey = 80 + 40 * Math.sin(e), tx = -Math.sin(e), ty = Math.cos(e), nx = Math.cos(e), ny = Math.sin(e);
    g.beginPath(); g.moveTo(ex + tx * 16, ey + ty * 16); g.lineTo(ex + nx * 11, ey + ny * 11); g.lineTo(ex - nx * 11, ey - ny * 11); g.closePath(); g.fill();
  });
}
function panel(x, y, w, h) {
  c.fillStyle = 'rgba(215,222,228,.88)'; c.strokeStyle = '#7d868e'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(x + 10, y); c.lineTo(x + w - 10, y); c.lineTo(x + w, y + 10); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.lineTo(x, y + 10); c.closePath(); c.fill(); c.stroke();
}
function hud() {
  var u = cv.height / 540; c.setTransform(1, 0, 0, 1, 0, 0);
  panel(110 * u, 6 * u, 190 * u, 58 * u);
  c.textAlign = 'left'; c.fillStyle = '#555'; c.font = 'bold ' + 20 * u + 'px Arial'; c.fillText('\u2665', 120 * u, 30 * u); c.fillText('\u25B2', 121 * u, 55 * u);
  [[ME.hp / 100, '#d5239b', 20], [ME.fuel / 100, '#2a3fe0', 45]].forEach(function (b) {
    c.fillStyle = '#fff'; c.fillRect(150 * u, b[2] * u, 140 * u, 12 * u); c.fillStyle = b[1]; c.fillRect(150 * u, b[2] * u, 140 * u * Math.max(0, b[0]), 12 * u);
    c.strokeStyle = '#555'; c.lineWidth = 2; c.strokeRect(150 * u, b[2] * u, 140 * u, 12 * u);
  });
  var m = Math.floor(left / 60), sec = Math.floor(left % 60), tm = (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  if (MP && started) {
    c.textAlign = 'left'; c.font = 'bold ' + 11 * u + 'px Arial'; c.fillStyle = rtt < 90 ? '#1c8c1c' : rtt < 170 ? '#b88a00' : '#cc2222'; c.fillText('PING ' + Math.round(rtt) + ' ms', 8 * u, 14 * u);
    if (netMsg) { c.textAlign = 'center'; c.font = 'bold ' + 20 * u + 'px Arial'; c.lineWidth = 5; c.strokeStyle = '#000'; c.fillStyle = '#fff'; c.strokeText(netMsg, cv.width / 2, cv.height * 0.3); c.fillText(netMsg, cv.width / 2, cv.height * 0.3); }
  }
  c.textAlign = 'center'; c.font = 'bold ' + 24 * u + 'px monospace'; c.lineWidth = 4; c.strokeStyle = '#222'; c.fillStyle = '#fff';
  c.strokeText(tm, cv.width / 2, 30 * u); c.fillText(tm, cv.width / 2, 30 * u);
  var rx = cv.width - 410 * u, w = WEAPONS[ME.wi];
  panel(rx, 6 * u, 250 * u, 58 * u);
  c.save(); c.translate(rx + 22 * u, 30 * u); c.scale(1.05 * u, 1.05 * u); c.translate(-(gunBox(ME.wi) ? gunBox(ME.wi).x0 : 0), 0); gunShape(c, ME.wi); c.restore();
  c.fillStyle = '#333'; c.textAlign = 'left'; c.font = 'bold ' + 11 * u + 'px Arial'; c.fillText(w.n, rx + 18 * u, 54 * u);
  var p3 = function (n) { return ('00' + (n || 0)).slice(-3); };
  c.font = 'bold ' + 17 * u + 'px monospace'; c.fillText(ME.reload > 0 ? tr('RELOAD') : p3(ME.ammo[ME.wi]), rx + 110 * u, 30 * u); c.fillText(p3(ME.res[ME.wi]), rx + 175 * u, 30 * u);
  c.fillText('\u25CF x' + ME.gren, rx + 110 * u, 54 * u);
  var ni = !MENU && ME.alive && nearItem(ME), bp = el('bPick'), bt = ni ? String(ni.k) : '';
  bp.style.display = ni ? 'flex' : 'none'; if (bp._k !== bt) { bp._k = bt; drawPick(ni); }
  var gc = document.getElementById('gc'); if (gc) gc.textContent = ME.gren; var sc = document.getElementById('sc'); if (sc) sc.textContent = ME.smoke || 0;
  c.textAlign = 'center'; c.font = 'bold ' + 15 * u + 'px Arial'; c.lineWidth = 3;
  feedL.forEach(function (f, i) { c.globalAlpha = Math.min(1, f.l / 60); c.strokeStyle = '#fff'; c.fillStyle = '#1f3bff'; c.strokeText(tr(f.t), cv.width / 2, ((ni ? 150 : 62) + i * 18) * u); c.fillText(tr(f.t), cv.width / 2, ((ni ? 150 : 62) + i * 18) * u); c.globalAlpha = 1; });
  if (!ME.alive && !over && started && !MENU) { c.font = 'bold ' + 30 * u + 'px Arial'; c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 5; var t = tr('RESPAWN ' + Math.ceil(ME.rt / 60)); c.strokeText(t, cv.width / 2, cv.height / 2); c.fillText(t, cv.width / 2, cv.height / 2); }
}
var flk = []; for (var fi = 0; fi < 70; fi++) flk.push({ x: Math.random(), y: Math.random(), r: R(1, 3), v: R(0.0006, 0.0016) });
function snowfall() {
  if (TH.deco !== 'snow') return; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(255,255,255,.85)';
  flk.forEach(function (f) { f.y += f.v; f.x += 0.0002; if (f.y > 1) f.y = 0; if (f.x > 1) f.x = 0; c.beginPath(); c.arc(f.x * cv.width, f.y * cv.height, f.r * dpr, 0, TAU); c.fill(); });
}
function draw() {
  s = cv.height / (560 / zoom);
  c.setTransform(1, 0, 0, 1, 0, 0);
  var sky = c.createLinearGradient(0, 0, 0, cv.height); sky.addColorStop(0, TH.sky[0]); sky.addColorStop(1, TH.sky[1]);
  c.fillStyle = sky; c.fillRect(0, 0, cv.width, cv.height);
  var my = cv.height * 0.18 - cam.y * s * 0.2; tile(bgM, 0.12, my, s * 0.9);
  var hy = cv.height * 0.45 - cam.y * s * 0.35; tile(bgH, 0.3, hy, s * 0.9);
  c.fillStyle = TH.hill; c.fillRect(0, hy + 300 * s * 0.9 - 2, cv.width, cv.height);
  drawWorld(); snowfall(); hud();
}
var last = 0, acc = 0;
function loop(t) {
  var dt = Math.min(MP ? 50 : 100, t - last); last = t; if (MENU) acc = 0; else acc += dt;   // multiplayer: at most 3 catch-up steps, never a 'speed-up' after a stall
  while (acc >= 16.667) { step(); acc -= 16.667; }
  if (AC) music(!!SETT.mus); statsTick(); draw(); if (MENU) drawHero(); requestAnimationFrame(loop);
}
// ---------------- Menu & maps ----------------
function el(id) { return document.getElementById(id); }
// ---- movable + resizable touch buttons (positions in vw / vh and sizes saved on the device)
var CTL_IDS = ['bZoom', 'bMenu', 'bSwap', 'bRel', 'sL', 'sR', 'bMelee', 'bSmoke', 'bGren'], edDrag = null, edSel = null, CSC = {}, ctlShowSel = function () { }, ctlResetAll = function () { };
(function () {
  var L = {}; try { L = JSON.parse(localStorage.getItem('mm_layout') || '{}'); } catch (e_) { }
  try { CSC = JSON.parse(localStorage.getItem('mm_scale') || '{}') || {}; } catch (e_) { CSC = {}; }
  function setPos(o, x, y) { var st = o.style; st.left = (x / innerWidth * 100) + 'vw'; st.top = (y / innerHeight * 100) + 'vh'; st.right = 'auto'; st.bottom = 'auto'; st.transformOrigin = '0 0'; }
  function applyK(id) { var o = el(id); if (o) o.style.setProperty('--k', String(CSC[id] || 1)); }
  CTL_IDS.forEach(function (id) { var o = el(id), p = L[id]; if (o && p) { o.style.left = p[0] + 'vw'; o.style.top = p[1] + 'vh'; o.style.right = 'auto'; o.style.bottom = 'auto'; o.style.transformOrigin = '0 0'; } applyK(id); });
  function saveL() {
    var o = {}; CTL_IDS.forEach(function (id) { var st = el(id).style; if (st.left && st.top) o[id] = [parseFloat(st.left), parseFloat(st.top)]; });
    try { localStorage.setItem('mm_layout', JSON.stringify(o)); } catch (e_) { }
  }
  function saveS() { try { localStorage.setItem('mm_scale', JSON.stringify(CSC)); } catch (e_) { } }
  function fitOn(o) {   // keep a (re)sized button fully on the screen
    var r = o.getBoundingClientRect(); if (r.left >= -0.5 && r.top >= -0.5 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5) return;
    setPos(o, cl(r.left, 0, Math.max(0, innerWidth - r.width)), cl(r.top, 0, Math.max(0, innerHeight - r.height)));
  }
  var sl = el('eSize'), vl = el('eVal');
  ctlShowSel = function () {
    CTL_IDS.forEach(function (id) { el(id).classList.toggle('sel', id === edSel); });
    var k = edSel ? (CSC[edSel] || 1) : 1; sl.disabled = !edSel; el('eMinus').disabled = el('ePlus').disabled = !edSel; sl.value = Math.round(k * 100); vl.textContent = edSel ? Math.round(k * 100) + '%' : '--';
  };
  function setK(k) { if (!edSel) return; k = cl(Math.round(k * 20) / 20, 0.5, 2.2); CSC[edSel] = k; applyK(edSel); fitOn(el(edSel)); saveS(); saveL(); ctlShowSel(); }
  sl.addEventListener('input', function () { setK(sl.value / 100); });
  el('eMinus').addEventListener('click', function () { setK((CSC[edSel] || 1) - 0.1); });
  el('ePlus').addEventListener('click', function () { setK((CSC[edSel] || 1) + 0.1); });
  ctlResetAll = function () {
    try { localStorage.removeItem('mm_layout'); localStorage.removeItem('mm_scale'); } catch (e_) { } CSC = {};
    CTL_IDS.forEach(function (id) { var o = el(id); o.style.left = o.style.top = o.style.right = o.style.bottom = o.style.transformOrigin = ''; o.style.removeProperty('--k'); }); ctlShowSel();
  };
  el('ctl').addEventListener('pointerdown', function (e) {
    if (!document.body.classList.contains('edit')) return;
    var t = e.target.closest ? e.target.closest('.b,.stick') : null; if (!t) return;
    e.stopPropagation(); e.preventDefault(); edSel = t.id; ctlShowSel(); var r = t.getBoundingClientRect(); edDrag = { t: t, dx: e.clientX - r.left, dy: e.clientY - r.top, id: e.pointerId };
  }, true);
  addEventListener('pointermove', function (e) {
    if (!edDrag || e.pointerId !== edDrag.id) return; var r = edDrag.t.getBoundingClientRect();
    setPos(edDrag.t, cl(e.clientX - edDrag.dx, 0, Math.max(0, innerWidth - r.width)), cl(e.clientY - edDrag.dy, 0, Math.max(0, innerHeight - r.height)));
  });
  function endDrag(e) { if (!edDrag || e.pointerId !== edDrag.id) return; edDrag = null; saveL(); }
  addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
})();
function thumb(i, cvs, wpx) {
  var m = MAPS[i], th = THEMES[m.th], k = wpx / m.w; cvs.width = wpx; cvs.height = Math.round(m.h * k);
  var g = cvs.getContext('2d'), sk = g.createLinearGradient(0, 0, 0, cvs.height); sk.addColorStop(0, th.sky[0]); sk.addColorStop(1, th.sky[1]);
  g.fillStyle = sk; g.fillRect(0, 0, cvs.width, cvs.height); g.fillStyle = th.rock[0]; g.strokeStyle = th.edge; g.lineWidth = 1;
  [[0, m.h - 220, m.w, 220], [0, 0, 70, m.h], [m.w - 70, 0, 70, m.h], [0, 0, m.w, 60]].concat(m.p).forEach(function (r) {
    var x = r[0] * k, y = r[1] * k, w = Math.max(1.5, r[2] * k), h = Math.max(1.5, r[3] * k); g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h);
  });
}
function setFighters() {
  fighters = MP ? [P, P2] : [P].concat(bots); ME = role === 'guest' ? P2 : P; P.name = MP ? 'HOST' : 'YOU';
}
function resetMatch() {
  placeItems(); bullets = []; snapBuffer = []; grenades = []; smokes = []; parts = []; feedL = []; left = matchLen; over = false; shake = 0; frame = 0; nextBot = 0; evq = []; outActs = []; in2 = { sx: 0, sy: 0, aim: 0, fire: false };
  setFighters();
  fighters.forEach(function (f) { f.kills = 0; f.joined = false; f.alive = false; f.vx = f.vy = 0; f.tilt = 0; f.an = { c: 0, la: 0, rl: 0, ll: 0, lift: 0, kb: 0 }; f.tg = null; });
  bots.forEach(function (b, i) { b.rt = Math.round(90 + i * R(60, 200)); });
  if (MP) { gFirst = true; resetNetSmooth(); } else { spawn(P); P.joined = true; }   // multiplayer: the server places both players
  s = cv.height / (560 / zoom);
  var vw = cv.width / s, vh = cv.height / s;
  cam.x = cl(ME.x + ME.w / 2 - vw / 2, 0, Math.max(0, W - vw)); cam.y = cl(ME.y - vh / 2 + 20, 0, Math.max(0, H - vh));
  el('over').classList.remove('show');
}
// ---- kills + coins: counted over the whole life of the game; saved on the device AND on a permanent server ----
var STATS_SERVER = '';   // address of the stats server (see the "server" folder), e.g. 'https://my-mm-stats.onrender.com'. Empty = saved on this device only.
var COIN_PER_KILL = 20;
var ST = { id: '', kills: 0, pend: 0, st: 'local', busy: false };
function stRid() { var a = '', i; try { var u = new Uint8Array(16); crypto.getRandomValues(u); for (i = 0; i < 16; i++) a += (u[i] < 16 ? '0' : '') + u[i].toString(16); } catch (e_) { for (i = 0; i < 32; i++) a += Math.floor(Math.random() * 16).toString(16); } return a; }
function stLoad() {
  try { ST.id = localStorage.getItem('mm_pid') || ''; var o = JSON.parse(localStorage.getItem('mm_stats') || '{}'); ST.kills = Math.max(0, parseInt(o.kills, 10) || 0); ST.pend = Math.max(0, parseInt(o.pend, 10) || 0); } catch (e_) { }
  if (!/^[0-9a-f]{32}$/.test(ST.id)) { ST.id = stRid(); try { localStorage.setItem('mm_pid', ST.id); } catch (e_) { } }
  if (ST.pend > ST.kills) ST.pend = ST.kills;
}
function stSave() { try { localStorage.setItem('mm_stats', JSON.stringify({ kills: ST.kills, pend: ST.pend })); } catch (e_) { } }
function stUi() {
  var c = el('coinN'), k = el('killN'), s = el('mSync'); if (!c) return;
  c.textContent = ST.kills * COIN_PER_KILL; k.textContent = ST.kills;
  s.textContent = !STATS_SERVER ? 'SAVED ON THIS DEVICE ONLY' : ST.busy ? 'SAVING...' : (ST.st === 'off' || ST.pend > 0) ? 'OFFLINE - WILL SYNC LATER' : 'SAVED ON SERVER';
}
function stPull() {
  if (!STATS_SERVER) return;
  fetch(STATS_SERVER.replace(/\/+$/, '') + '/api/stats/' + ST.id).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
    if (typeof j.kills === 'number') { ST.kills = j.kills + ST.pend; ST.st = 'ok'; stSave(); stUi(); }
  }).catch(function () { ST.st = 'off'; stUi(); });
}
function stFlush() {
  if (!STATS_SERVER || ST.busy || ST.pend <= 0) return;
  var n = Math.min(ST.pend, 500); ST.busy = true; stUi();
  fetch(STATS_SERVER.replace(/\/+$/, '') + '/api/kills', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ id: ST.id, n: n }) })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (j) { ST.pend -= n; if (typeof j.kills === 'number') ST.kills = j.kills + ST.pend; ST.busy = false; ST.st = 'ok'; stSave(); stUi(); if (ST.pend > 0) stFlush(); })
    .catch(function () { ST.busy = false; ST.st = 'off'; stUi(); });
}
function addKills(n) { ST.kills += n; ST.pend += n; stSave(); stUi(); stFlush(); }
var _lk = 0, _lm = null;
function statsTick() {   // every kill of ME (solo, host or guest) = +1 kill = +20 coins, forever
  if (_lm !== ME) { _lm = ME; _lk = ME.kills; return; }
  if (ME.kills < _lk) _lk = ME.kills; else if (ME.kills > _lk) { addKills(ME.kills - _lk); _lk = ME.kills; }
}
stLoad(); stUi(); stPull(); setInterval(stFlush, 15000);
try { window.addEventListener('online', function () { stPull(); stFlush(); }); } catch (e_) { }

function showMenu() {
  MENU = true; K = {}; M.d = false; T.ron = false; T.lx = T.ly = 0;
  el('mname').textContent = MAPS[MAPI].n.toUpperCase() + '  (' + (MAPI + 1) + '/' + MAPS.length + ')';
  el('bResume').style.display = started && !over ? '' : 'none';
  ['maps', 'lobby', 'net', 'fit', 'settings'].forEach(function (n) { el(n).classList.remove('show'); }); el('menu').classList.add('show'); stUi();
}
function startGame() { el('menu').classList.remove('show'); MP = false; role = 'solo'; resetMatch(); started = true; MENU = false; audio(); }
function menuBtn() { if (MP) { if (confirm(tr('Leave the match?'))) leaveNet(); } else showMenu(); }
function escKey() {
  if (el('settings').classList.contains('show')) { el('settings').classList.remove('show'); return; }
  if (MP && !MENU) { menuBtn(); return; }
  if (el('maps').classList.contains('show')) { backMaps(); return; }
  if (MENU) { if (started && !over) { el('menu').classList.remove('show'); MENU = false; } return; }
  showMenu();
}
function backMaps() { if (role === 'host') showLobby(); else showMenu(); }
function pickMap(i) { buildMap(i); if (role === 'host') { syncLobby(); return; } started = false; showMenu(); }
// ---- main-menu hero: the player's own outfit stands in the middle (same drawF as in the game)
var heroT = 0;
function drawHero() {
  var cn = el('mHero'); if (!cn || !el('menu').classList.contains('show')) return;
  var r = cn.getBoundingClientRect(), w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
  if (cn.width !== w || cn.height !== h) { cn.width = w; cn.height = h; }
  var g = cn.getContext('2d'), sc = c, k = h * 0.86 / 66, br = Math.sin(heroT += 0.045);
  c = g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.setTransform(k, 0, 0, k, w * 0.5 - k * 24, h * 0.07);
  var fe = { alive: true, inv: 0, col: CHAR, an: { c: 0, la: 0.05 * br, rl: 0, ll: 0, lift: 0.5 + 0.5 * br, kb: 0 }, tilt: 0, face: 1, w: 34, h: 65, x: 0.5, y: -5.5, wi: 1, aim: -0.12, mel: 0 };
  var fo = fitOver; fitOver = { outfit: curOutfit, skin: curSkin, hair: curHair, cap: curCap, face: curFace, hc: curHC, shoe: curShoe };
  try { drawF(fe); } catch (e_) { } fitOver = fo; c = sc;
}
(function () {
  var grid = el('grid');
  MAPS.forEach(function (m, i) {
    var b = document.createElement('button'), cv2 = document.createElement('canvas'), lb = document.createElement('span');
    b.className = 'mp'; thumb(i, cv2, 150); lb.textContent = m.n; b.appendChild(cv2); b.appendChild(lb);
    b.addEventListener('click', function () { audio(); pickMap(i); }); grid.appendChild(b);
  });

  // ---- FIT screen (BODY / HAIR / CAP / FACE tabs) ----
  var fg = el('fgrid'), fTiles = [], fTab = 'outfit', TKEY = { outfit: 'outfit', body: 'skin', hair: 'hair', cap: 'cap', face: 'face', shoe: 'shoe' };
  function fitPreview(cnv, over, zoom) {   // zoom: 0 = full body, 1 = head, 2 = face close-up
    var g = cnv.getContext('2d'), sc = c; cnv.width = 120; cnv.height = 130; c = g; g.clearRect(0, 0, 120, 130);
    if (zoom === 3) g.setTransform(3.2, 0, 0, 3.2, -9, -98); else if (zoom === 2) g.setTransform(3.3, 0, 0, 3.3, 2, 20); else if (zoom) g.setTransform(1.9, 0, 0, 1.9, 27, 70); else g.setTransform(1.55, 0, 0, 1.55, 33, 25);
    var fe = { alive: true, inv: 0, col: CHAR, an: { c: 0, la: 0, rl: 0, ll: 0, lift: 0, kb: 0 }, tilt: 0, face: 1, w: 34, h: 65, x: 0.5, y: -8.5, wi: 0, aim: Math.PI / 2, mel: 0 };
    var fo = fitOver; fitOver = over; try { drawF(fe); } catch (e_) { } fitOver = fo; c = sc;
  }
  function curOf(t) { return t === 'outfit' ? curOutfit : t === 'body' ? curSkin : t === 'hair' ? curHair : t === 'cap' ? curCap : t === 'shoe' ? curShoe : curFace; }
  function setCur(t, v) { if (t === 'outfit') curOutfit = v; else if (t === 'body') curSkin = v; else if (t === 'hair') curHair = v; else if (t === 'cap') curCap = v; else if (t === 'shoe') curShoe = v; else curFace = v; saveFit(); }
  window.fitRefresh = function () {
    fTiles.forEach(function (t) { var o = { outfit: curOutfit, skin: curSkin, hair: curHair, cap: curCap, face: curFace, hc: curHC, shoe: curShoe }; o[TKEY[fTab]] = t.v; if (fTab === 'hair') o.cap = -1; fitPreview(t.cv, o, fTab === 'body' || fTab === 'outfit' ? 0 : fTab === 'face' ? 2 : fTab === 'shoe' ? 3 : 1); t.b.classList.toggle('sel', t.v === curOf(fTab)); });
    [].forEach.call(document.querySelectorAll('#fcol .sw'), function (b, i) { b.classList.toggle('sel', i === curHC); });
  };
  function buildTab() {
    fg.innerHTML = ''; fTiles = []; var vals = [], i;
    if (fTab === 'outfit') { vals.push(-1); for (i = 0; i < OUTFITS.length; i++) vals.push(i); } else if (fTab === 'body') vals = [-1, 0, 1, 2, 3, 4]; else if (fTab === 'face' || fTab === 'shoe') for (i = 0; i < 10; i++) vals.push(i); else { vals.push(-1); for (i = 0; i < 10; i++) vals.push(i); }
    vals.forEach(function (v) {
      var b = document.createElement('button'), cv2 = document.createElement('canvas'), lb = document.createElement('span');
      b.className = 'fp'; lb.textContent = fTab === 'outfit' ? (v < 0 ? 'Classic' : OUTFIT_N[v]) : fTab === 'body' ? (v < 0 ? 'Classic' : 'FIT ' + (v + 1)) : fTab === 'hair' ? (v < 0 ? 'None' : HAIR_N[v]) : fTab === 'cap' ? (v < 0 ? 'None' : CAP_N[v]) : fTab === 'shoe' ? SHOE_N[v] : FACE_N[v];
      b.appendChild(cv2); b.appendChild(lb);
      b.addEventListener('click', function () { audio(); setCur(fTab, v); fitRefresh(); });
      fg.appendChild(b); fTiles.push({ b: b, cv: cv2, v: v });
    });
    el('fcol').style.display = fTab === 'hair' ? 'flex' : 'none';
    [].forEach.call(document.querySelectorAll('#ftabs .ftab'), function (b) { b.classList.toggle('sel', b.getAttribute('data-t') === fTab); });
    fitRefresh();
  }
  HAIR_COLS.forEach(function (col, i) {
    var b = document.createElement('button'); b.className = 'sw'; b.style.background = col; b.addEventListener('click', function () { audio(); curHC = i; saveFit(); fitRefresh(); }); el('fcol').appendChild(b);
  });
  [].forEach.call(document.querySelectorAll('#ftabs .ftab'), function (b) { b.addEventListener('click', function () { audio(); fTab = b.getAttribute('data-t'); buildTab(); }); });
  el('bFit').addEventListener('click', function () { audio(); el('menu').classList.remove('show'); el('fit').classList.add('show'); buildTab(); });
  el('fBack').addEventListener('click', function () { audio(); el('fit').classList.remove('show'); el('menu').classList.add('show'); });

  // ---- language: translates every text node of the page (and anything the game writes later) ----
  function trNode(n) {
    if (n._out === n.nodeValue && n._en !== undefined) { var v0 = tr(n._en); if (v0 !== n.nodeValue) { n.nodeValue = v0; n._out = v0; } return; }
    n._en = n.nodeValue; var v = tr(n._en); n._out = v; if (v !== n.nodeValue) n.nodeValue = v;
  }
  function walkTr(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, a = [];
    while ((n = w.nextNode())) { var p = n.parentNode && n.parentNode.nodeName; if (p !== 'SCRIPT' && p !== 'STYLE' && p !== 'TEXTAREA') a.push(n); }
    a.forEach(trNode);
  }
  function syncLang() { var bl = el('bLang'); bl.firstChild.nodeValue = 'LANGUAGE: ' + LANGS.filter(function (l) { return l[0] === LANG; })[0][1]; }
  function applyLang() {
    document.documentElement.lang = LANG; document.documentElement.classList.toggle('ar', LANG === 'ar');
    syncLang(); walkTr(document.body); el('nIn').placeholder = tr('Paste code here');
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) { if (m.type === 'characterData') trNode(m.target); else [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 3) trNode(n); else if (n.nodeType === 1) walkTr(n); }); });
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
  el('bLang').addEventListener('click', function () {
    audio(); var i = 0; LANGS.forEach(function (l, k) { if (l[0] === LANG) i = k; }); LANG = LANGS[(i + 1) % LANGS.length][0];
    try { localStorage.setItem('mm_lang', LANG); } catch (e_) { } applyLang();
  });
  el('bPlay').addEventListener('click', startGame);
  el('mPrev').addEventListener('click', function () { audio(); pickMap((MAPI + MAPS.length - 1) % MAPS.length); });
  el('mNext').addEventListener('click', function () { audio(); pickMap((MAPI + 1) % MAPS.length); });
  el('bGear').addEventListener('click', function () { audio(); el('settings').classList.add('show'); });
  el('bSetClose').addEventListener('click', function () { audio(); el('settings').classList.remove('show'); });
  el('settings').addEventListener('click', function (ev) { if (ev.target === el('settings')) el('settings').classList.remove('show'); });
  function syncSet() { el('bSnd').firstChild.nodeValue = 'SOUND: ' + (SETT.snd ? 'ON' : 'OFF'); el('bMus').firstChild.nodeValue = 'MUSIC: ' + (SETT.mus ? 'ON' : 'OFF'); }
  syncSet(); applyLang();
  el('bSnd').addEventListener('click', function () { audio(); SETT.snd = SETT.snd ? 0 : 1; saveSet(); syncSet(); if (SETT.snd) snd('rel3', 1); });
  el('bMus').addEventListener('click', function () { audio(); SETT.mus = SETT.mus ? 0 : 1; saveSet(); syncSet(); });
  el('bEdit').addEventListener('click', function () { audio(); el('settings').classList.remove('show'); el('menu').classList.remove('show'); document.body.classList.add('edit'); edSel = null; ctlShowSel(); });
  el('eDone').addEventListener('click', function () { document.body.classList.remove('edit'); showMenu(); });
  el('eReset').addEventListener('click', function () { ctlResetAll(); });
  el('bResume').addEventListener('click', function () { el('menu').classList.remove('show'); MENU = false; audio(); });
  el('bMaps').addEventListener('click', function () { audio(); el('menu').classList.remove('show'); el('maps').classList.add('show'); });
  el('bBack').addEventListener('click', backMaps);
  el('bAgain').addEventListener('click', function () { if (role === 'host') startMP(); else { resetMatch(); MENU = false; started = true; } });
  el('bToMenu').addEventListener('click', function () {
    el('over').classList.remove('show');
    if (role === 'host') { net({ t: 'tl' }); showLobby(); } else if (role === 'guest') leaveNet(); else { started = false; showMenu(); }
  });
  btn('bMenu', menuBtn);
})();

// ---------------- QR code encoder (byte mode, ECC L, mask 0) ----------------
var QR_EC = [0,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  QR_NB = [0,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25];
function qrRaw(v) { var r = (16 * v + 128) * v + 64; if (v >= 2) { var n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; }
function qrRS(data, ec) {
  var gf = [], x = 1, i, j; for (i = 0; i < 255; i++) { gf[i] = x; x <<= 1; if (x & 256) x ^= 0x11D; }
  var lg = []; for (i = 0; i < 255; i++) lg[gf[i]] = i;
  function mul(a, b) { return a && b ? gf[(lg[a] + lg[b]) % 255] : 0; }
  var g = [1]; for (i = 0; i < ec; i++) { var ng = new Array(g.length + 1).fill(0); for (j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], gf[i]); } g = ng; }
  var r = new Array(ec).fill(0);
  data.forEach(function (b) { var f = b ^ r.shift(); r.push(0); for (var k = 0; k < ec; k++) r[k] ^= mul(g[k + 1], f); });
  return r;
}
function qrMake(text) {
  var u = new TextEncoder().encode(text), v, cap;
  for (v = 1; v <= 40; v++) { cap = Math.floor(qrRaw(v) / 8) - QR_EC[v] * QR_NB[v]; if (4 + (v < 10 ? 8 : 16) + 8 * u.length <= cap * 8) break; }
  if (v > 40) return null;
  var bits = []; function put(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
  put(4, 4); put(u.length, v < 10 ? 8 : 16); u.forEach(function (b) { put(b, 8); });
  put(0, Math.min(4, cap * 8 - bits.length)); while (bits.length % 8) bits.push(0);
  var d = []; for (var i = 0; i < bits.length; i += 8) d.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (var pb = 0xEC; d.length < cap; pb ^= 0xEC ^ 0x11) d.push(pb);
  var nb = QR_NB[v], ec = QR_EC[v], raw = Math.floor(qrRaw(v) / 8), sh = nb - raw % nb, sl = Math.floor(raw / nb), blocks = [], k = 0;
  for (i = 0; i < nb; i++) { var dl = sl - ec + (i < sh ? 0 : 1), bd = d.slice(k, k + dl); k += dl; blocks.push([bd, qrRS(bd, ec)]); }
  var all = []; for (i = 0; i < sl - ec + 1; i++) blocks.forEach(function (b) { if (i < b[0].length) all.push(b[0][i]); });
  for (i = 0; i < ec; i++) blocks.forEach(function (b) { all.push(b[1][i]); });
  var n = v * 4 + 17, m = [], fn = [], y, x;
  for (y = 0; y < n; y++) { m.push(new Array(n).fill(false)); fn.push(new Array(n).fill(false)); }
  function set(x, y, b) { m[y][x] = b; fn[y][x] = true; }
  for (i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  [[3, 3], [n - 4, 3], [3, n - 4]].forEach(function (c) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var xx = c[0] + dx, yy = c[1] + dy, dist = Math.max(Math.abs(dx), Math.abs(dy)); if (xx >= 0 && xx < n && yy >= 0 && yy < n) set(xx, yy, dist !== 2 && dist !== 4); } });
  var ap = [];
  if (v > 1) { var na = Math.floor(v / 7) + 2, st = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2; ap = [6]; for (var ps = n - 7; ap.length < na; ps -= st) ap.splice(1, 0, ps); }
  ap.forEach(function (a, ia) { ap.forEach(function (b, ib) { if ((ia === 0 && ib === 0) || (ia === 0 && ib === ap.length - 1) || (ia === ap.length - 1 && ib === 0)) return; for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }); });
  function fmt() {
    var dd = 1 << 3, r = dd; for (var q = 0; q < 10; q++) r = (r << 1) ^ ((r >>> 9) * 0x537); var f = ((dd << 10) | r) ^ 0x5412;
    function bt(q) { return ((f >>> q) & 1) === 1; }
    for (var q2 = 0; q2 <= 5; q2++) set(8, q2, bt(q2)); set(8, 7, bt(6)); set(8, 8, bt(7)); set(7, 8, bt(8)); for (q2 = 9; q2 < 15; q2++) set(14 - q2, 8, bt(q2));
    for (q2 = 0; q2 < 8; q2++) set(n - 1 - q2, 8, bt(q2)); for (q2 = 8; q2 < 15; q2++) set(8, n - 15 + q2, bt(q2)); set(8, n - 8, true);
  }
  fmt();
  if (v >= 7) { var rv = v; for (i = 0; i < 12; i++) rv = (rv << 1) ^ ((rv >>> 11) * 0x1F25); var vb = (v << 12) | rv; for (i = 0; i < 18; i++) { var bb = ((vb >>> i) & 1) === 1, a = n - 11 + i % 3, b2 = Math.floor(i / 3); set(a, b2, bb); set(b2, a, bb); } }
  var bi = 0;
  for (var right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (var vert = 0; vert < n; vert++) for (var j = 0; j < 2; j++) {
      x = right - j; y = ((right + 1) & 2) === 0 ? n - 1 - vert : vert;
      if (!fn[y][x] && bi < all.length * 8) { m[y][x] = ((all[bi >>> 3] >>> (7 - (bi & 7))) & 1) === 1; bi++; }
    }
  }
  for (y = 0; y < n; y++) for (x = 0; x < n; x++) if (!fn[y][x] && (x + y) % 2 === 0) m[y][x] = !m[y][x];
  return m;
}
function drawQR(cvs, text) {
  var m = qrMake(text); if (!m) { cvs.style.display = 'none'; return false; }
  var n = m.length, px = Math.max(2, Math.floor(Math.min(innerWidth * 0.8, innerHeight * 0.5) / (n + 8))), sz = (n + 8) * px; cvs.width = cvs.height = sz;
  var g = cvs.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, sz, sz); g.fillStyle = '#000';
  for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (m[y][x]) g.fillRect((x + 4) * px, (y + 4) * px, px, px);
  cvs.style.display = 'block'; return true;
}

// ---- QR scanning (camera + BarcodeDetector) ----
var scanStream = null, scanTimer = 0;
function stopScan() { clearInterval(scanTimer); scanTimer = 0; if (scanStream) { scanStream.getTracks().forEach(function (t) { t.stop(); }); scanStream = null; } el('nVid').style.display = 'none'; }
async function startScan() {
  if (!window.BarcodeDetector) { info('This browser cannot scan QR codes. Use COPY / paste instead (Chrome on Android supports scanning).'); return; }
  try {
    var det = new BarcodeDetector({ formats: ['qr_code'] }), v = el('nVid');
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); v.srcObject = scanStream; v.style.display = 'block'; await v.play();
    scanTimer = setInterval(async function () { try { var r = await det.detect(v); if (r.length) { el('nIn').value = r[0].rawValue; stopScan(); netGo(); } } catch (_) {} }, 250);
  } catch (e) { stopScan(); info('Camera error: ' + e.message + ' (the page must be opened over HTTPS or localhost)'); }
}
// ---------------- Multiplayer: dedicated authoritative server (raw WebSocket) ----------------
// The SERVER runs the real game (movement, bullets, damage, items). Both phones are equal clients: each one predicts its own
// movement and shots locally (instant feel); everything that matters is decided by the server, which sends 30 snapshots / s.
// Set window.MP_SERVER_URL before script.js only if the game page is hosted somewhere other than the game server.
var MP_SERVER_URL = window.MP_SERVER_URL || location.origin;
var ws = null, wsOpen = false, wsWanted = false, wsBackoff = 0, wsTimer = 0, pingTimer = 0, pingSeq = 0, pingSent = {}, rtt = 0;
var roomCode = '', roomToken = '', joinPending = false, roomCreateStarted = false, mySlot = 0, netMsg = '';
var gFirst = false, DURS = [120, 180, 300, 420, 600, 900], lastSnapTk = 0, inputSeq = 0, actSeq = 0, snapBuffer = [], drift = 0, needResync = true;
// Smoothing state: snapshots are placed on the SERVER's timeline (not on arrival time), so network jitter never shows as stutter.
var clkWin = [], clkOff = 0, lagWin = [], interpDelay = 100, SNAP_MS = 1000 / 30, TICK_MS = 1000 / 60;
var predQ = new Int32Array(256), predX = new Float32Array(256), predY = new Float32Array(256), predCX = new Float32Array(256), predCY = new Float32Array(256);
var corrX = 0, corrY = 0, cumX = 0, cumY = 0;
function resetClock() { snapBuffer = []; clkWin = []; clkOff = 0; lagWin = []; interpDelay = 100; }
function resetNetSmooth() { resetClock(); corrX = corrY = cumX = cumY = 0; predQ.fill(0); lastSnapTk = 0; actSeq = 0; drift = 0; needResync = true; }
function fmt(t) { return Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2); }
function wsUrl() { return String(MP_SERVER_URL || location.origin).replace(/\/+$/, '').replace(/^http/i, 'ws') + '/ws'; }
function net(m) { if (ws && wsOpen) { try { ws.send(JSON.stringify(m)); return true; } catch (_) { } } return false; }
function info(t) { el('nInfo').textContent = t; }
function closeNet() {
  wsWanted = false; clearTimeout(wsTimer); clearInterval(pingTimer); netOK = false; joinPending = false;
  if (ws) { var w = ws; ws = null; wsOpen = false; w.onopen = w.onmessage = w.onclose = w.onerror = null; try { w.close(); } catch (_) { } }
}
function netLost() {
  if (role === 'solo') return; netOK = false;
  if (started && MP) netMsg = 'CONNECTION LOST - RECONNECTING...'; else info('Connection interrupted. Reconnecting...');
}
function leaveNet() {
  stopScan(); net({ t: 'leave' }); closeNet(); roomCode = ''; roomToken = ''; inputSeq = 0; resetNetSmooth(); netMsg = '';
  try { sessionStorage.removeItem('mm_room'); } catch (_) { }
  role = 'solo'; MP = false; matchLen = 300; started = false; over = false; setFighters();
  el('over').classList.remove('show'); showMenu();
}
function saveRoom() { try { sessionStorage.setItem('mm_room', JSON.stringify({ roomId: roomCode, token: roomToken, role: role })); } catch (_) { } }
function sendPing() {
  var c = ++pingSeq; pingSent[c] = performance.now(); delete pingSent[c - 8]; net({ t: 'ping', c: c });
}
function connectRoom() { if (ws) return; wsWanted = true; openWs(); }
function schedRetry() { if (!wsWanted) return; clearTimeout(wsTimer); wsBackoff = Math.min(wsBackoff ? wsBackoff * 1.6 : 400, 3000); wsTimer = setTimeout(openWs, wsBackoff); }
function openWs() {
  if (ws || !wsWanted) return;
  var w, opened = false;
  try { w = new WebSocket(wsUrl()); } catch (e) { info('Cannot reach the multiplayer server. Check the server address.'); schedRetry(); return; }
  ws = w;
  w.onopen = function () {
    if (ws !== w) return; opened = true; wsOpen = true; wsBackoff = 0;
    clearInterval(pingTimer); pingTimer = setInterval(sendPing, 1000); sendPing();
    if (roomToken && roomCode) net({ t: 'resume', roomId: roomCode, token: roomToken });
    else if (role === 'host' && !roomCreateStarted) { roomCreateStarted = true; net({ t: 'create' }); }
    else if (role === 'guest' && joinPending) joinRoomNow();
  };
  w.onmessage = function (ev) { if (ws !== w) return; var m; try { m = JSON.parse(ev.data); } catch (_) { return; } onMsg(m); };
  w.onclose = function () {
    if (ws !== w) return; ws = null; wsOpen = false; clearInterval(pingTimer);
    if (role === 'host' && !roomCode) roomCreateStarted = false;
    netLost(); if (!opened && !(started && MP)) info('Cannot reach the multiplayer server. Retrying...'); schedRetry();
  };
  w.onerror = function () { };
}
function netOpen(r) {
  if (ws) { closeNet(); }
  // The UI calls this with 'join', while the multiplayer runtime uses 'guest'.
  role = r === 'join' ? 'guest' : r; mySlot = role === 'guest' ? 1 : 0; MP = false; roomCode = ''; roomToken = ''; joinPending = false; roomCreateStarted = false; netMsg = '';
  ['menu'].forEach(function (n) { el(n).classList.remove('show'); }); el('net').classList.add('show');
  el('nT').textContent = r === 'host' ? 'HOST GAME' : 'JOIN GAME';
  stopScan(); el('nQR').style.display = 'none'; el('nScan').style.display = 'none'; el('nOutBox').style.display = 'none'; el('nInBox').style.display = r === 'join' ? '' : 'none';
  el('nOut').value = ''; el('nIn').value = '';
  if (r === 'host') { info('Connecting to multiplayer server...'); connectRoom(); }
  else info('Enter the 6-character room code provided by the host.');
}
function hostStart() { connectRoom(); }
function joinRoomNow() {
  if (!wsOpen || !joinPending) return;
  var code = el('nIn').value.trim().toUpperCase();
  if (!/^[A-F0-9]{6}$/.test(code)) { info('Enter a valid 6-character room code.'); joinPending = false; return; }
  net({ t: 'join', roomId: code });
}
function netGo() { if (role !== 'guest' || joinPending) return; joinPending = true; info('Connecting to multiplayer server...'); if (wsOpen) joinRoomNow(); else connectRoom(); }
function copyOut() { var o = el('nOut'); o.select(); try { navigator.clipboard.writeText(o.value); } catch (_) { document.execCommand('copy'); } }
function shareOut() { var v = el('nOut').value; if (navigator.share) navigator.share({ text: 'Room code: ' + v }).catch(function () { }); else copyOut(); }
var ERR_TXT = { room_full: 'This room is full.', host_offline: 'The host is offline.', player_reconnecting: 'A previous player is reconnecting. Try again in a moment.', room_not_found: 'Room not found. Check the code.', already_in_room: 'Already in a room.' };
function showLobby() {
  MENU = true; started = false; var h = role === 'host';
  ['menu', 'maps', 'net', 'over'].forEach(function (n) { el(n).classList.remove('show'); });
  el('lobby').classList.add('show'); thumb(MAPI, el('lpv'), 320);
  el('lmap').textContent = MAPS[MAPI].n.toUpperCase(); el('ltime').textContent = 'TIME ' + fmt(matchLen);
  el('lHost').style.display = h ? '' : 'none'; el('lWait').style.display = h ? 'none' : '';
}
function syncLobby() { net({ t: 'lb', m: MAPI, d: matchLen }); showLobby(); }
function startMP() { if (role !== 'host' || !netOK) { info('Wait until both players are connected.'); return; } net({ t: 'go', m: MAPI, d: matchLen }); }   // the server answers with 'start' for BOTH players
function beginMP(it) {
  MP = true; netMsg = ''; inputSeq = 0; el('lobby').classList.remove('show'); resetMatch();
  if (it) items = it.map(function (a) { return { x: a[0], y: a[1], k: a[2], t: 0, cd: 0 }; });
  started = true; MENU = false; audio();
}
function onMsg(m) {
  var t = m.t;
  if (t === 's') { if (role !== 'solo' && MP) onSnap(m); }
  else if (t === 'pong') { var t0 = pingSent[m.c]; if (t0) { var s = performance.now() - t0; rtt = rtt ? rtt * 0.7 + s * 0.3 : s; delete pingSent[m.c]; } }
  else if (t === 'created') {
    roomCode = m.roomId; roomToken = m.token; mySlot = 0; saveRoom();
    el('nOut').value = roomCode; el('nOutBox').style.display = ''; el('nInBox').style.display = 'none';
    info('Room created: share this 6-character code with one player. Waiting for them to join...');
  }
  else if (t === 'joined') {
    roomCode = m.roomId; roomToken = m.token; mySlot = 1; saveRoom(); joinPending = false;
    if (m.m !== MAPI) buildMap(m.m); matchLen = m.d; netOK = !!m.ready; info('Joined room. Waiting for the host...'); if (netOK) showLobby();
  }
  else if (t === 'peer') {
    var was = netOK; netOK = !!m.ready; resetClock(); netMsg = '';
    if (netOK && !started && role === 'host') showLobby();
    if (netOK && !was && started) info('The other player is back.');
  }
  else if (t === 'peer_left') { netOK = false; if (started && MP) netMsg = 'OPPONENT DISCONNECTED - WAITING...'; else info('The other player disconnected. Waiting for reconnection...'); }
  else if (t === 'resumed') {
    mySlot = m.slot; netOK = !!m.ready; netMsg = netOK ? '' : 'WAITING FOR THE OTHER PLAYER...'; resetClock(); needResync = true;
    if (m.state !== 'playing' && started && MP) { started = false; MP = false; showLobby(); }
    else if (!started && !MP) { if (netOK) showLobby(); else info('Reconnected. Waiting for the other player...'); }
  }
  else if (t === 'resume_failed') {
    info('Room session expired. Create a new room or join again.');
    if (started && MP) { leaveNet(); info('The room is gone. Back to the menu.'); } else { roomCode = ''; roomToken = ''; }
  }
  else if (t === 'error') { info(ERR_TXT[m.e] || 'Could not connect to the room.'); joinPending = false; roomCreateStarted = false; }
  else if (t === 'lb') { if (m.m !== MAPI) buildMap(m.m); matchLen = m.d; showLobby(); }
  else if (t === 'start') { if (m.m !== MAPI) buildMap(m.m); matchLen = m.d; mySlot = m.slot; netOK = true; beginMP(m.it); }
  else if (t === 'ov') showOver(m.h);
  else if (t === 'tl') { el('over').classList.remove('show'); if (m.left) netOK = false; MP = false; showLobby(); }
}
function onSnap(m) {
  if (!m || !Array.isArray(m.f) || !Array.isArray(m.b) || !Array.isArray(m.ev)) return;
  if (m.tk <= lastSnapTk) return;
  lastSnapTk = m.tk;
  var nowP = performance.now();
  // Place the snapshot on the SERVER's timeline (ts), not on its arrival time.
  var hts = m.ts, smp = nowP - hts;
  if (clkWin.length && smp - clkOff > 2000) clkWin = [];            // clock/path jump: start a fresh estimate
  clkWin.push(smp); if (clkWin.length > 90) clkWin.shift();
  var mn = clkWin[0], jm = 0, li;
  for (li = 1; li < clkWin.length; li++) if (clkWin[li] < mn) mn = clkWin[li];
  clkOff = mn;
  lagWin.push(smp - clkOff); if (lagWin.length > 45) lagWin.shift();
  for (li = 0; li < lagWin.length; li++) if (lagWin[li] > jm) jm = lagWin[li];
  // Adaptive interpolation delay: ~1.5 snapshot intervals plus the recent worst-case jitter. Grows fast, shrinks slowly.
  var dTarget = cl(SNAP_MS * 1.5 + jm * 0.8 + 10, 70, 240);
  interpDelay += cl(dTarget - interpDelay, -1, 5);
  var last = snapBuffer.length ? snapBuffer[snapBuffer.length - 1] : null;
  if (last && hts <= last.ts) hts = last.ts + 1;
  var bulletFrame = {}, grenFrame = {};
  m.b.forEach(function (q) { if (q && q.length >= 6 && q[5] !== mySlot) bulletFrame[q[0]] = q; });
  m.g.forEach(function (q) { if (q && q.length >= 5) grenFrame[q[0]] = q; });
  snapBuffer.push({ ts: hts, f: m.f.map(function (a) { return [a[0], a[1], a[5], a[11]]; }), b: bulletFrame, g: grenFrame });
  if (snapBuffer.length > 14) snapBuffer.shift();
  m.f.forEach(function (a, i) {
    var f = fighters[i]; if (!f) return; var was = f.alive, me = f === ME;
    f.hp = a[2]; f.fuel = a[3]; f.alive = !!a[7]; f.rt = a[8]; f.kills = a[10]; f.mel = a[13];
    if (!me) { f.face = a[4]; f.aim = a[5]; f.wi = a[6]; f.inv = a[9]; f.tilt = a[11]; f.jet = a[12] > 0; f.jp = a[12]; f.vx = a[14]; f.vy = a[15]; f.ground = !!a[16]; }
    var jump = (!was && f.alive) || gFirst;
    if (jump) { f.x = a[0]; f.y = a[1]; if (me) { f.inv = a[9]; f.vx = a[14]; f.vy = a[15]; f.ground = !!a[16]; needResync = true; } }
    if (!me) return;
    // ----- the local (predicted) player: reconcile with the server -----
    if (!f.alive || jump) { corrX = corrY = cumX = cumY = 0; predQ.fill(0); }
    else {
      var ak = m.ak | 0, hi = ak & 255, ex = 0, ey = 0;
      if (ak > 0 && predQ[hi] === ak) { ex = a[0] - predX[hi] - (cumX - predCX[hi]); ey = a[1] - predY[hi] - (cumY - predCY[hi]); }
      else { ex = a[0] - f.x; ey = a[1] - f.y; if (ex * ex + ey * ey <= 160000) ex = ey = 0; }
      var d2 = ex * ex + ey * ey;
      if (d2 > 160000) { f.x = a[0]; f.y = a[1]; f.vx = a[14]; f.vy = a[15]; f.ground = !!a[16]; corrX = corrY = cumX = cumY = 0; predQ.fill(0); }
      else if (d2 < 0.36) { corrX = corrY = 0; }
      else { corrX = ex; corrY = ey; }
    }
    if (a.length > 17) {   // private state (weapons / ammo): local prediction wins until the server has seen my last swap / reload
      var ackd = (m.ak | 0) >= actSeq;
      f.gren = a[19]; f.smoke = a[22];
      if (!f.ammo || !f.ammo.length || (needResync && ackd)) {
        f.ammo = a[17].slice(); f.res = a[18].slice(); f.reload = a[20]; f.inv3 = a[21].slice(); f.sl = a[23]; f.wi = a[6]; needResync = false; drift = 0;
      } else if (ackd) {
        f.wi = a[6]; f.inv3 = a[21].slice(); f.sl = a[23];
        var w = f.wi, dA = Math.abs((f.ammo[w] || 0) - a[17][w]), dR = Math.abs((f.res[w] || 0) - a[18][w]);
        drift = (dA > 3 || dR > 6) ? drift + 1 : 0;
        if (drift > 12) { f.ammo = a[17].slice(); f.res = a[18].slice(); f.reload = a[20]; drift = 0; }
        else for (var wi2 = 0; wi2 < 10; wi2++) {
          if (wi2 !== w) { f.ammo[wi2] = a[17][wi2]; f.res[wi2] = a[18][wi2]; }
          else if (a[17][wi2] > f.ammo[wi2]) f.ammo[wi2] = a[17][wi2];   // the held weapon only grows from the server (pickup); shots/reloads stay local
        }
      }
    }
  });
  // Opponent bullets keep their object by stable server id; my OWN bullets are the ones I predicted locally (b.loc).
  var oldBullets = {}; bullets.forEach(function (b) { if (!b.loc && b.id != null) oldBullets[b.id] = b; });
  var mine = bullets.filter(function (b) { return b.loc; }), theirs = [];
  m.b.forEach(function (q) {
    if (q[5] === mySlot) return;
    var b = oldBullets[q[0]]; if (!b) b = { id: q[0], x: q[1], y: q[2] };
    b.vx = q[3]; b.vy = q[4]; theirs.push(b);
  });
  bullets = mine.concat(theirs);
  var oldG = {}; grenades.forEach(function (g) { oldG[g.id] = g; });
  grenades = m.g.map(function (q) { var g = oldG[q[0]] || { id: q[0], x: q[1], y: q[2] }; g.vx = q[3]; g.vy = q[4]; return g; });
  smokes = (m.sm || []).map(function (q) { return { x: q[0], y: q[1], age: q[2], dep: !!q[3] }; });
  if (m.it) m.it.forEach(function (q, i) { if (items[i]) { items[i].k = q[0]; items[i].t = q[1]; items[i].cd = q[2]; } });
  left = m.L; m.ev.forEach(onEv);
  if (gFirst) { gFirst = false; var vw = cv.width / s, vh = cv.height / s; cam.x = cl(ME.x + ME.w / 2 - vw / 2, 0, Math.max(0, W - vw)); cam.y = cl(ME.y - vh / 2 + 20, 0, Math.max(0, H - vh)); }
}
function onEv(e) {
  var t = e[0], f;
  if (t === 'sn') { if (e[5] === mySlot && (e[1] === 'rel1' || e[1] === 'rel2' || e[1] === 'rel3' || e[1] === 'click')) return; snd(e[1], volXY(e[2], e[3]) * e[4]); }   // my own reload / swap sounds already played instantly
  else if (t === 'sh') { if (e[1] === mySlot) return; f = fighters[e[1]]; if (!f) return; var mz = muzzle(f); shotFX(f, mz[0], mz[1], e[2]); snd(WEAPONS[f.wi].snd, volXY(mz[0], mz[1])); }
  else if (t === 'ht') { bloodFX(e[1], e[2]); snd('hit', volXY(e[1], e[2]) * 0.8); }
  else if (t === 'dd') { f = fighters[e[1]]; if (!f) return; gibFX(f); snd(f === ME ? 'dieme' : 'diebot', volXY(f.x, f.y)); }
  else if (t === 'bm') { boomFX(e[1], e[2]); snd('boom', volXY(e[1], e[2])); }
  else if (t === 'sp') { if (e[3] !== mySlot) sparkFX(e[1], e[2]); }
  else if (t === 'fd') feed(e[1]);
}
function nstep() {
  frame++;
  if (over) { tail(); return; }
  var k = pctl(); ME.aim = k.aim; ME.face = Math.cos(k.aim) >= 0 ? 1 : -1;
  // vt = the server tick of the opponent that is on MY screen right now: the server rewinds the opponent to it when my bullets land (lag compensation)
  var nowNet = performance.now(), renderT = nowNet - clkOff - interpDelay, vt = snapBuffer.length ? Math.round(renderT / TICK_MS) : -1;
  net({ t: 'in', q: ++inputSeq, sx: rd(k.sx), sy: rd(k.sy), aim: Math.round(k.aim * 1000) / 1000, fire: k.fire, a: outActs, vt: vt }); outActs = [];
  if (ME.alive) {
    upd(ME, { sx: k.sx, sy: k.sy, aim: k.aim, fire: k.fire });   // same movement code as the server: predicts movement, own shots, ammo, recoil and sounds instantly
    // Spread the server correction over a few frames (no tug-of-war with a stale target position).
    if (corrX || corrY) {
      var cx = Math.abs(corrX) < 0.05 ? corrX : corrX * 0.25, cy = Math.abs(corrY) < 0.05 ? corrY : corrY * 0.25;
      ME.x += cx; ME.y += cy; cumX += cx; cumY += cy; corrX -= cx; corrY -= cy;
    }
    var hi = inputSeq & 255; predQ[hi] = inputSeq; predX[hi] = ME.x; predY[hi] = ME.y; predCX[hi] = cumX; predCY[hi] = cumY;
  }
  // The opponent (and the server's bullets / grenades) are drawn on the server timeline, a little in the past, so there is always a pair of snapshots to blend.
  var renderT2 = renderT, n = snapBuffer.length;
  var sb0 = null, sb1 = null, u = 0, lastSnap = n ? snapBuffer[n - 1] : null;
  if (n) {
    if (renderT2 >= lastSnap.ts) {              // packet late: keep moving along the last segment (max 100 ms) instead of freezing
      sb1 = lastSnap; sb0 = n > 1 ? snapBuffer[n - 2] : lastSnap;
      u = sb1 === sb0 ? 1 : 1 + Math.min(renderT2 - lastSnap.ts, 100) / Math.max(1, sb1.ts - sb0.ts);
    } else if (renderT2 <= snapBuffer[0].ts) { sb0 = sb1 = snapBuffer[0]; u = 0; }
    else {
      for (var si = n - 2; si >= 0; si--) if (snapBuffer[si].ts <= renderT2) { sb0 = snapBuffer[si]; sb1 = snapBuffer[si + 1]; break; }
      u = (renderT2 - sb0.ts) / Math.max(1, sb1.ts - sb0.ts);
    }
  }
  var uc = cl(u, 0, 1);
  fighters.forEach(function (f, fi) {
    var p0 = sb0 && sb0.f[fi], p1 = sb1 && sb1.f[fi];
    if (f !== ME && p0 && p1) {
      var dx = p1[0] - p0[0], dy = p1[1] - p0[1];
      var uu = (dx * dx + dy * dy > 22500) ? (u >= 1 ? 1 : 0) : u;   // respawn/teleport: jump, never glide across the map
      f.x = p0[0] + dx * uu; f.y = p0[1] + dy * uu;
      var da = p1[2] - p0[2]; da = Math.atan2(Math.sin(da), Math.cos(da));
      f.aim = p0[2] + da * uc; f.face = Math.cos(f.aim) >= 0 ? 1 : -1;
      f.tilt = p0[3] + (p1[3] - p0[3]) * uc;
    }
    if (f !== ME || !ME.alive) animF(f);       // my own animation already advanced inside upd()
    if (!f.alive) return;
    if (f !== ME && f.jet) flame(f, f.jp > 1 ? 2 : 1, f.jp < 2);
    if (f !== ME) { if (f.inv > 0) f.inv--; }
    if (f.mel > 0) f.mel--;
  });
  var opp = fighters[1 - mySlot];
  // my own bullets: flown locally for instant feedback (cosmetic only - the server decides what they hit)
  bullets.forEach(function (b) {
    if (b.loc) {
      b.life--; var nn = Math.ceil(Math.hypot(b.vx, b.vy) / 10);
      for (var i = 0; i < nn && !b.dead; i++) {
        b.x += b.vx / nn; b.y += b.vy / nn;
        if (solidAt(b.x, b.y) || b.x < 0 || b.x > W || b.y < 0 || b.y > H) { b.dead = true; sparkFX(b.x, b.y); break; }
        if (opp && opp.alive && b.x > opp.x - 4 && b.x < opp.x + opp.w + 4 && b.y > opp.y - 2 && b.y < opp.y + opp.h + 2) { b.dead = true; break; }
      }
      if (b.life <= 0) b.dead = true;
      return;
    }
    var q0 = sb0 && sb0.b[b.id], q1 = sb1 && sb1.b[b.id];
    if (q0 && q1) { b.x = q0[1] + (q1[1] - q0[1]) * u; b.y = q0[2] + (q1[2] - q0[2]) * u; }
    else if (lastSnap && lastSnap.b[b.id]) {   // bullet newer than the delayed timeline: trace it back from its first packet
      var ql = lastSnap.b[b.id], df = cl((renderT2 - lastSnap.ts) / TICK_MS, -8, 6);
      b.x = ql[1] + ql[3] * df; b.y = ql[2] + ql[4] * df;
    } else { b.x += b.vx; b.y += b.vy; }
  });
  bullets = bullets.filter(function (b) { return !b.dead; });
  grenades.forEach(function (g) {
    var q0 = sb0 && sb0.g[g.id], q1 = sb1 && sb1.g[g.id];
    if (q0 && q1) { g.x = q0[1] + (q1[1] - q0[1]) * u; g.y = q0[2] + (q1[2] - q0[2]) * u; }
    else if (lastSnap && lastSnap.g[g.id]) {
      var ql = lastSnap.g[g.id], df = cl((renderT2 - lastSnap.ts) / TICK_MS, -8, 6);
      g.x = ql[1] + ql[3] * df; g.y = ql[2] + ql[4] * df + 0.5 * G * 0.8 * df * df;
    }
    if (frame % 3 === 0) addP({ x: g.x, y: g.y, vx: 0, vy: -0.3, l: 18, m: 18, t: 'smoke', r: 3 });
  });
  if (jetG) jetG.gain.setTargetAtTime(ME.alive && ME.jet ? 0.12 : 0, AC.currentTime, 0.05);
  tail();
}
(function () {
  el('bHost').addEventListener('click', function () { audio(); netOpen('host'); });
  el('bJoin').addEventListener('click', function () { audio(); netOpen('join'); });
  el('nGo').addEventListener('click', netGo); el('nScan').addEventListener('click', startScan); el('nCopy').addEventListener('click', copyOut); el('nShare').addEventListener('click', shareOut);
  el('nBack').addEventListener('click', leaveNet); el('lLeave').addEventListener('click', leaveNet);
  function mapStep(d) { buildMap((MAPI + d + MAPS.length) % MAPS.length); syncLobby(); }
  function timeStep(d) { var i = DURS.indexOf(matchLen); matchLen = DURS[cl(i + d, 0, DURS.length - 1)]; syncLobby(); }
  el('lPrev').addEventListener('click', function () { mapStep(-1); }); el('lNext').addEventListener('click', function () { mapStep(1); });
  el('lMaps').addEventListener('click', function () { el('lobby').classList.remove('show'); el('maps').classList.add('show'); });
  el('tM').addEventListener('click', function () { timeStep(-1); }); el('tP').addEventListener('click', function () { timeStep(1); });
  el('lStart').addEventListener('click', startMP);
})();
addEventListener('pointerdown', audio); buildMap(0); s = cv.height / 560; showMenu();
window.__step = step; window.__draw = draw;
requestAnimationFrame(function (t) { last = t; loop(t); });
})();

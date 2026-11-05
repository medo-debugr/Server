// Runs the REAL game client (script.js) inside Node with a fake DOM/canvas, connected to the REAL server.
// It cannot render pixels, but it executes every line of the multiplayer/prediction code path and reports runtime errors.
const vm = require('vm'), fs = require('fs'), path = require('path');
function stub(name) {
  const fn = function () { return p; };
  const store = {};
  const p = new Proxy(fn, {
    get(t, k) { if (k === Symbol.toPrimitive) return () => 0; if (k === 'then') return undefined; if (k in store) return store[k]; if (k === 'length') return 0;
      if (k === 'width' || k === 'height' || k === 'clientWidth' || k === 'offsetWidth') return 800; if (k === 'data') return new Uint8ClampedArray(4 * 24 * 12);
      if (k === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 100, height: 100 }); if (k === 'measureText') return () => ({ width: 10 });
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') return () => p; return p; },
    set(t, k, v) { store[k] = v; return true; }, apply() { return p; }, construct() { return p; }
  });
  return p;
}
function makeEnv(url, label, logs) {
  const els = {}; const listeners = {};
  const doc = { getElementById(id) { return els[id] || (els[id] = elem(id)); }, createElement(t) { return elem('new-' + t); }, body: elem('body'), addEventListener() {}, querySelectorAll() { return []; }, createTreeWalker() { return { nextNode() { return null; } }; }, querySelector() { return stub('q'); }, documentElement: elem('html') };
  function elem(id) {
    const cls = new Set(); const e = stub(id);
    e.classList = { add: c => cls.add(c), remove: c => cls.delete(c), contains: c => cls.has(c), toggle() {} }; e.style = { setProperty() {}, removeProperty() {} }; e.value = ''; e.textContent = ''; e.innerHTML = '';
    e.addEventListener = (t, f) => { (e._l = e._l || {})[t] = f; }; e.getContext = () => stub('ctx'); e.querySelector = () => stub('q'); e.setPointerCapture = () => {}; e.focus = () => {};
    e.select = () => {}; e.offsetWidth = 100; e.width = 800; e.height = 450; e.appendChild = () => {}; e.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
    e._id = id; return e;
  }
  let rafCb = null; const t0 = Date.now();
  const win = {
    document: doc, location: { origin: url }, performance: { now: () => Date.now() - t0 }, requestAnimationFrame: cb => { rafCb = cb; }, innerWidth: 800, innerHeight: 450, devicePixelRatio: 1,
    navigator: { maxTouchPoints: 0, clipboard: { writeText() {} } }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); }, setInterval, clearInterval, setTimeout, clearTimeout, WebSocket, JSON, Math, Date, console: { log: (...a) => logs.push([label, ...a].join(' ')), error: (...a) => logs.push('[ERR ' + label + '] ' + a.join(' ')) },
    Image: function () { setTimeout(() => this.onload && this.onload(), 0); }, fetch: () => Promise.reject(new Error('no net')), confirm: () => true, AudioContext: undefined, webkitAudioContext: undefined,
    Int32Array, Float32Array, Uint8ClampedArray, Uint8Array, Object, Array, String, Number, Boolean, RegExp, Error, Infinity, NaN, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, BarcodeDetector: undefined, NodeFilter: { SHOW_TEXT: 4 }, MutationObserver: function () { this.observe = () => {}; }, ResizeObserver: function () { this.observe = () => {}; }
  };
  win.window = win; win.self = win; win.top = win;
  const ctx = vm.createContext(win);
  return { ctx, els, doc, win, listeners, frame(dtMs) { if (rafCb) { const cb = rafCb; rafCb = null; try { cb(Date.now() - t0); } catch (e) { if (!this._seen) { this._seen = 1; logs.push('[ERR ' + label + ' frame] ' + String(e.stack).split('\n').slice(0, 4).join(' | ')); } if (!rafCb) rafCb = cb; } } }, run(code) { return vm.runInContext(code, ctx); } };
}
module.exports = { makeEnv };

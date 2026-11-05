'use strict';
// Minimal zero-dependency WebSocket server (RFC 6455): text frames, ping/pong, close, fragmentation.
// Written so the game server needs no `npm install` at all.
const crypto = require('crypto');
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_MSG = 64 * 1024;

class Conn {
  constructor(socket) {
    this.socket = socket; this.buf = Buffer.alloc(0); this.frags = []; this.fragLen = 0; this.open = true;
    this.onmessage = null; this.onclose = null; this.lastRx = Date.now(); this.data = {};
    socket.setNoDelay(true); socket.setKeepAlive(true, 5000); socket.setTimeout(0);
    socket.on('data', d => this._data(d));
    socket.on('close', () => this._closed());
    socket.on('error', () => { try { socket.destroy(); } catch (_) {} });
  }
  _closed() { if (!this.open) return; this.open = false; if (this.onclose) this.onclose(); }
  _data(d) {
    this.lastRx = Date.now();
    this.buf = this.buf.length ? Buffer.concat([this.buf, d]) : d;
    if (this.buf.length > MAX_MSG * 2) return this.terminate();
    for (;;) {
      const b = this.buf; if (b.length < 2) return;
      const fin = (b[0] & 0x80) !== 0, op = b[0] & 0x0f, masked = (b[1] & 0x80) !== 0; let len = b[1] & 0x7f, off = 2;
      if (!masked) return this.terminate();                       // clients must mask
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (b.length < 10) return; if (b.readUInt32BE(2) !== 0) return this.terminate(); len = b.readUInt32BE(6); off = 10; }
      if (len > MAX_MSG) return this.terminate();
      if (b.length < off + 4 + len) return;
      const mask = b.slice(off, off + 4), payload = Buffer.from(b.slice(off + 4, off + 4 + len));
      for (let i = 0; i < len; i++) payload[i] ^= mask[i & 3];
      this.buf = b.slice(off + 4 + len);
      if (op === 0x8) { this.close(); return; }
      if (op === 0x9) { this._frame(0xA, payload); continue; }
      if (op === 0xA) continue;
      if (op === 0x1 || op === 0x2 || op === 0x0) {
        if (op !== 0x0) { this.frags = []; this.fragLen = 0; }
        this.frags.push(payload); this.fragLen += len; if (this.fragLen > MAX_MSG) return this.terminate();
        if (fin) { const msg = Buffer.concat(this.frags).toString('utf8'); this.frags = []; this.fragLen = 0; if (this.onmessage) { try { this.onmessage(msg); } catch (e) { console.error('msg handler error', e); } } }
      }
    }
  }
  _frame(op, payload) {
    if (!this.open) return false;
    const len = payload.length; let h;
    if (len < 126) { h = Buffer.alloc(2); h[1] = len; } else if (len < 65536) { h = Buffer.alloc(4); h[1] = 126; h.writeUInt16BE(len, 2); } else { h = Buffer.alloc(10); h[1] = 127; h.writeUInt32BE(len, 6); }
    h[0] = 0x80 | op;
    try { this.socket.write(Buffer.concat([h, payload])); return true; } catch (_) { return false; }
  }
  send(str) { return this._frame(0x1, Buffer.from(str)); }
  // true when the OS send buffer is backed up: the caller should DROP stale snapshots instead of queueing them
  get congested() { return this.socket.writableLength > 24 * 1024; }
  ping() { this._frame(0x9, Buffer.alloc(0)); }
  close() { if (!this.open) return; this._frame(0x8, Buffer.alloc(0)); this.open = false; try { this.socket.end(); } catch (_) {} setTimeout(() => { try { this.socket.destroy(); } catch (_) {} }, 500); if (this.onclose) this.onclose(); }
  terminate() { const was = this.open; this.open = false; try { this.socket.destroy(); } catch (_) {} if (was && this.onclose) this.onclose(); }
}

function upgrade(req, socket, onConn) {
  const key = req.headers['sec-websocket-key'];
  if (!key || String(req.headers.upgrade || '').toLowerCase() !== 'websocket' || req.headers['sec-websocket-version'] !== '13') {
    socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n'); return;
  }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  onConn(new Conn(socket), req);
}
module.exports = { upgrade };

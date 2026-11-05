const assert = require('node:assert/strict');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const vm = require('node:vm');


const appRequire = require;
const ts = appRequire('typescript');
const source = fs.readFileSync(process.argv[2] ?? path.join(__dirname, '../src/lib/db.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const message = (type, body) => {
  const header = Buffer.alloc(5);
  header.write(type);
  header.writeInt32BE(body.length + 4, 1);
  return Buffer.concat([header, body]);
};
const sockets = new Set();
let ready = false;
let connections = 0;
const server = net.createServer(socket => {
  connections++;
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
  let startup = true;
  let pending = Buffer.alloc(0);
  socket.on('data', chunk => {
    pending = Buffer.concat([pending, chunk]);
    while (pending.length >= (startup ? 4 : 5)) {
      const size = pending.readInt32BE(startup ? 0 : 1) + (startup ? 0 : 1);
      if (pending.length < size) return;
      const type = String.fromCharCode(pending[0]);
      pending = pending.subarray(size);
      if (startup) {
        startup = false;
        if (!ready) {
          socket.end(message('E', Buffer.from('SFATAL\0C57P03\0Mthe database system is starting up\0\0')));
          return;
        }
        socket.write(Buffer.concat([message('R', Buffer.alloc(4)), message('Z', Buffer.from('I'))]));
      } else if (type === 'Q') {
        socket.write(Buffer.concat([message('C', Buffer.from('SELECT 1\0')), message('Z', Buffer.from('I'))]));
      } else if (type === 'X') {
        socket.end();
      }
    }
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, require: appRequire, global: {},
    process: { env: { DATABASE_URL: `postgresql://test@127.0.0.1:${server.address().port}/test` } },
    console: { log() {}, error() {} },
  });
  const db = module.exports;
  try {
    await assert.rejects(db.query('SELECT 1'), { code: '57P03' });
    ready = true;
    const result = await db.query('SELECT 1');
    assert.equal(result.rowCount, 1);
    assert.equal(connections, 2);
    await db.closeDatabase();
    assert.equal((await db.query('SELECT 1')).rowCount, 1);
    assert.equal(connections, 3);
    console.log('PASS: real pg client recovers from 57P03 in the same process and reconnects after pool close');
  } finally {
    await db.closeDatabase();
    for (const socket of sockets) socket.destroy();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

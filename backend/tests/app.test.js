const test = require('node:test');
const assert = require('node:assert/strict');

const originalDatabaseUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = 'postgresql://invalid:invalid@127.0.0.1:1/invalid_db';
delete require.cache[require.resolve('../src/config/database')];
delete require.cache[require.resolve('../src/app')];

const app = require('../src/app');

async function withServer(testFn) {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    await testFn(port);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

test('POST /api/leads salva lead em fallback sem banco', async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Ana Souza',
        telefone: '(11) 99999-9999',
        assunto: 'Consultoria',
        origem: 'site',
        canal: 'site',
      }),
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.ok, true);
    assert.equal(body.data.nome, 'Ana Souza');
    assert.equal(body.data.status, 'novo');
  });
});

test('GET /api/leads retorna dados do fallback', async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/leads`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.data));
  });
});

process.on('exit', () => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, scryptSync } = require('node:crypto');

const originalDatabaseUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = 'postgresql://invalid:invalid@127.0.0.1:1/invalid_db';
delete require.cache[require.resolve('../src/config/database')];
delete require.cache[require.resolve('../src/app')];

const app = require('../src/app');

function buildPasswordHash(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

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

test('sem fallback explícito, o sistema falha quando o banco real não está disponível', async () => {
  process.env.ALLOW_MEMORY_FALLBACK = 'false';
  delete require.cache[require.resolve('../src/config/database')];
  delete require.cache[require.resolve('../src/app')];

  const appSemFallback = require('../src/app');

  const server = appSemFallback.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Ana Souza',
        telefone: '(11) 99999-9999',
        assunto: 'Consultoria',
      }),
    });

    const body = await response.json();

    assert.equal(response.status, 503);
    assert.match(body.message, /Banco de dados indisponível|DATABASE_URL|PostgreSQL/i);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }

  delete process.env.ALLOW_MEMORY_FALLBACK;
});

test('login aceita senha protegida por hash em vez de texto plano', async () => {
  const originalAdminPassword = process.env.ADMIN_PASSWORD;
  const originalAdminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const hashedPassword = buildPasswordHash('admin123');

  process.env.ADMIN_PASSWORD = 'senha_errada';
  process.env.ADMIN_PASSWORD_HASH = hashedPassword;
  delete require.cache[require.resolve('../src/app')];
  delete require.cache[require.resolve('../src/controllers/authController')];
  delete require.cache[require.resolve('../src/middleware/auth')];

  const appWithHash = require('../src/app');
  const server = appWithHash.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'admin123' }),
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.message, 'Login realizado com sucesso.');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }

  if (originalAdminPassword === undefined) {
    delete process.env.ADMIN_PASSWORD;
  } else {
    process.env.ADMIN_PASSWORD = originalAdminPassword;
  }

  if (originalAdminPasswordHash === undefined) {
    delete process.env.ADMIN_PASSWORD_HASH;
  } else {
    process.env.ADMIN_PASSWORD_HASH = originalAdminPasswordHash;
  }
});

process.on('exit', () => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

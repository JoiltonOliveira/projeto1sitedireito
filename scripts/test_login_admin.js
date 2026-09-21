const base = 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(base + path, options);
  const text = await res.text();
  let json = text;
  try {
    json = JSON.parse(text);
  } catch (error) {
    // keep raw text
  }

  return {
    status: res.status,
    ok: res.ok,
    headers: Object.fromEntries(res.headers.entries()),
    body: json,
  };
}

(async () => {
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin' }),
  });

  const cookies = login.headers['set-cookie'] || '';
  const sessionCookie = cookies.split(';')[0];

  console.log('LOGIN_RESULT', JSON.stringify(login, null, 2));
  console.log('SESSION_COOKIE', sessionCookie);

  const admin = await request('/admin', {
    headers: sessionCookie ? { Cookie: sessionCookie } : {},
  });

  console.log('ADMIN_RESULT', JSON.stringify(admin, null, 2));

  const leads = await request('/api/leads');
  console.log('LEADS_RESULT', JSON.stringify(leads, null, 2));
})();

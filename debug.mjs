import fs from 'fs';

async function test() {
  try {
    const csrfRes = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfRes.json();
    const authCookies = csrfRes.headers.get('set-cookie')?.split(',').map(c => c.split(';')[0]) || [];

    const res = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': authCookies.join('; ')
      },
      body: new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        username: 'admin',
        password: 'admin123',
        redirect: 'false',
        json: 'true'
      })
    });

    console.log('Login status:', res.status);
    const setCookie = res.headers.get('set-cookie');
    console.log('Set-Cookie:', setCookie);

    let sessionCookie = '';
    const sessionMatch = setCookie?.match(/next-auth\.session-token=[^;,]+/);
    if (sessionMatch) sessionCookie = sessionMatch[0];

    const sessionRes = await fetch('http://localhost:3000/api/auth/session', { headers: { 'Cookie': sessionCookie } });
    console.log('Session data:', await sessionRes.text());

    // Also try A.1
    const usersRes = await fetch('http://localhost:3000/api/users', { headers: { 'Cookie': sessionCookie } });
    console.log('Users res:', usersRes.status, await usersRes.text());
  } catch (e) {
    console.error(e);
  }
}
test();

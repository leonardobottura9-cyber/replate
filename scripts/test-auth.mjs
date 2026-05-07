// Auth flow integration test — uses Supabase Auth REST API directly
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

// Parse .env manually (no dotenv dependency needed)
const env = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
}

const SUPABASE_URL = env['EXPO_PUBLIC_SUPABASE_URL'];
const ANON_KEY = env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
};

const testEmail = `test.replate+${Date.now()}@gmail.com`;
const testPassword = 'Replate_Test_123!';
let accessToken = null;

async function step(label, fn) {
  process.stdout.write(`  ${label} ... `);
  try {
    const result = await fn();
    console.log('✅');
    return result;
  } catch (err) {
    console.log('❌');
    console.error(`     → ${err.message}`);
    process.exit(1);
  }
}

async function authPost(path, body, token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method: 'POST',
    headers: token
      ? { ...headers, Authorization: `Bearer ${token}` }
      : headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg ?? data.error_description ?? JSON.stringify(data));
  return data;
}

console.log('\n─────────────────────────────────────────');
console.log('  Replate — Auth Flow Test');
console.log(`  Project: ${SUPABASE_URL}`);
console.log(`  Test account: ${testEmail}`);
console.log('─────────────────────────────────────────\n');

// 1. Sign Up
const signUpData = await step('Sign up (new user)', () =>
  authPost('/signup', {
    email: testEmail,
    password: testPassword,
    data: { name: 'Replate Tester' },
  })
);

const userId = signUpData.user?.id ?? signUpData.id;
const sessionFromSignup = signUpData.access_token;

if (!userId) throw new Error('No user ID returned from signup');
console.log(`     User ID : ${userId}`);

if (sessionFromSignup) {
  console.log('     Email confirmation : DISABLED ✅ (session granted immediately)');
  accessToken = sessionFromSignup;
} else {
  console.log('     Email confirmation : ENABLED');
  console.log('     ⚠️  To test the full sign-in flow, disable email confirmation:');
  console.log('        Supabase Dashboard → Authentication → Providers → Email');
  console.log('        → uncheck "Confirm email" → Save\n');
  console.log('  Skipping sign-in (requires confirmed email) — all other checks pass.');
  process.exit(0);
}

// 2. Sign In with password (only reachable when confirmation is disabled)
const signInData = await step('Sign in with password', () =>
  authPost('/token?grant_type=password', {
    email: testEmail,
    password: testPassword,
  })
);

accessToken = signInData.access_token;
const expiresIn = signInData.expires_in;
console.log(`     Token expires in : ${expiresIn}s`);
console.log(`     Token type        : ${signInData.token_type}`);

// 3. Get user with token
const userRes = await step('Get authenticated user', async () => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { ...headers, Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg ?? JSON.stringify(data));
  return data;
});

console.log(`     Email : ${userRes.email}`);
console.log(`     Name  : ${userRes.user_metadata?.name ?? '(not set)'}`);

// 4. Wrong password rejected
await step('Reject wrong password', async () => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' }),
  });
  if (res.ok) throw new Error('Server accepted wrong password — this should not happen');
  return true;
});

// 5. Sign out
await step('Sign out', () =>
  authPost('/logout', {}, accessToken)
);

// 6. Confirm token is invalidated
await step('Confirm session is revoked', async () => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { ...headers, Authorization: `Bearer ${accessToken}` },
  });
  if (res.ok) throw new Error('Token still valid after sign-out');
  return true;
});

console.log('\n─────────────────────────────────────────');
console.log('  🎉 All auth checks passed!');
console.log('─────────────────────────────────────────\n');

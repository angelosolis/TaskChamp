// ============================================================================
// TaskChamp Smoke Test
// Runs end-to-end checks against the live Supabase project.
// Run with: node scripts/smoke-test.mjs
// Exits non-zero if any check fails.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ---------- Tiny .env loader ----------
function loadEnv() {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return {};
  const raw = fs.readFileSync(envPath, 'utf-8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const env = loadEnv();
const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const ADMIN_EMAIL = 'admin@uclm.edu.ph';
const ADMIN_PASSWORD = 'TaskChamp2026!';
const TEST_STUDENT_EMAIL = `smoketest+${Date.now()}@taskchamp.test`;
const TEST_STUDENT_PASSWORD = 'SmokeTest2026!';
const TEST_STUDENT_NAME = 'Smoke Test Student';

// ---------- Pretty results ----------
const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const SKIP = '\x1b[33m–\x1b[0m';
let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ${PASS} ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ${FAIL} ${name}`);
    console.log(`      ${e.message}`);
    failed++;
    failures.push({ name, message: e.message });
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(`${msg || 'expected equal'} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

// ============================================================================
// MAIN
// ============================================================================
console.log('\n┌──────────────────────────────────────────────────────────────────┐');
console.log('│  TASKCHAMP SMOKE TEST                                            │');
console.log('└──────────────────────────────────────────────────────────────────┘\n');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log(`${FAIL} Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env`);
  process.exit(1);
}

const anon = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

// State accumulated across tests
const state = {
  adminUserId: null,
  studentUserId: null,
  studentClient: null,
  adminClient: null,
  createdTaskId: null,
  createdCourseId: null,
  createdResourceId: null,
};

// ---------------------------------------------------------------------------
console.log('── 1. Connectivity & Schema ──────────────────────────────────────');

await test('reach Supabase (anon select on programs)', async () => {
  const { error, count } = await anon.from('programs').select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  assert(count !== null, 'count returned null');
});

await test('all 7 tables exist (sample 1 row from each)', async () => {
  const tables = ['profiles', 'programs', 'courses', 'tasks', 'resources', 'calendar_events', 'study_sessions'];
  for (const t of tables) {
    const { error } = await anon.from(t).select('*', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      throw new Error(`${t}: ${error.message}`);
    }
  }
});

await test('programs seeded (≥ 11 rows from initial seed)', async () => {
  const { data, error } = await anon.from('programs').select('code').limit(50);
  if (error) throw new Error(error.message);
  assert(data.length >= 11, `expected ≥ 11 programs, got ${data.length}`);
  const codes = data.map((p) => p.code);
  for (const expected of ['BSCS', 'BSIT', 'BSCpE', 'BSAccountancy']) {
    assert(codes.includes(expected), `missing seed program ${expected}`);
  }
});

// ---------------------------------------------------------------------------
console.log('\n── 2. Admin auth + role ──────────────────────────────────────────');

await test('admin can sign in', async () => {
  state.adminClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await state.adminClient.auth.signInWithPassword({
    email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
  });
  if (error) throw new Error(error.message);
  assert(data.user, 'no user returned');
  state.adminUserId = data.user.id;
});

await test('admin profile has role = admin', async () => {
  const { data, error } = await state.adminClient.from('profiles')
    .select('role').eq('id', state.adminUserId).single();
  if (error) throw new Error(error.message);
  assertEqual(data.role, 'admin');
});

await test('admin can read all profiles (RLS bypass via is_admin())', async () => {
  const { data, error } = await state.adminClient.from('profiles').select('id,role').limit(50);
  if (error) throw new Error(error.message);
  assert(Array.isArray(data));
});

// ---------------------------------------------------------------------------
console.log('\n── 3. Student signup + trigger ──────────────────────────────────');

await test('register a fresh student (signUp with metadata)', async () => {
  state.studentClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await state.studentClient.auth.signUp({
    email: TEST_STUDENT_EMAIL,
    password: TEST_STUDENT_PASSWORD,
    options: {
      data: {
        name: TEST_STUDENT_NAME,
        course: 'BSCS',
        education_level: '3rd year',
        role: 'student',
      },
    },
  });
  if (error) throw new Error(error.message);
  assert(data.user, 'no user returned from signUp');
  assert(data.session, 'no session — is "Confirm email" toggled OFF in Supabase?');
  state.studentUserId = data.user.id;
});

await test('on_auth_user_created trigger inserted profile with metadata', async () => {
  // small wait — trigger is synchronous but RLS read needs the JWT
  const { data, error } = await state.studentClient.from('profiles')
    .select('*').eq('id', state.studentUserId).single();
  if (error) throw new Error(error.message);
  assertEqual(data.name, TEST_STUDENT_NAME, 'name mismatch');
  assertEqual(data.course, 'BSCS', 'course mismatch');
  assertEqual(data.education_level, '3rd year', 'edu level mismatch');
  assertEqual(data.role, 'student', 'role mismatch');
});

// ---------------------------------------------------------------------------
console.log('\n── 4. Row-Level Security ────────────────────────────────────────');

await test('student CANNOT see admin profile (RLS scope)', async () => {
  const { data, error } = await state.studentClient.from('profiles')
    .select('*').eq('id', state.adminUserId).maybeSingle();
  // RLS should make the row simply not visible (no error, just empty)
  assert(error === null || error.code === 'PGRST116', `unexpected error: ${error?.message}`);
  assert(data === null, 'student saw admin profile — RLS is broken');
});

await test('student CAN see programs (read-all policy)', async () => {
  const { data, error } = await state.studentClient.from('programs').select('code').limit(5);
  if (error) throw new Error(error.message);
  assert(data.length > 0);
});

await test('student CANNOT promote themselves to admin (role guard trigger)', async () => {
  const { error } = await state.studentClient.from('profiles')
    .update({ role: 'admin' }).eq('id', state.studentUserId);
  assert(error, 'role escalation should have been rejected');
  assert(/role|admin/i.test(error.message), `unexpected error: ${error.message}`);
});

// ---------------------------------------------------------------------------
console.log('\n── 5. Task + Resource CRUD ──────────────────────────────────────');

await test('student can insert a course (subject)', async () => {
  const { data, error } = await state.studentClient.from('courses').insert({
    user_id: state.studentUserId,
    code: 'CS101',
    name: 'Intro to Programming',
    credits: 3,
    target_grade: 90,
    color: '#4ECDC4',
  }).select('*').single();
  if (error) throw new Error(error.message);
  state.createdCourseId = data.id;
});

await test('student can insert an academic task linked to course', async () => {
  const { data, error } = await state.studentClient.from('tasks').insert({
    user_id: state.studentUserId,
    title: 'Smoke test — Final Exam',
    is_academic: true,
    course_id: state.createdCourseId,
    task_type: 'exam',
    priority: 'high',
    weight: 40,
    difficulty: 'hard',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    smart_priority: 68,
    urgency_score: 25,
    importance_score: 43,
  }).select('*').single();
  if (error) throw new Error(error.message);
  state.createdTaskId = data.id;
  assertEqual(data.is_academic, true);
});

await test('student can attach a resource to that task', async () => {
  const { data, error } = await state.studentClient.from('resources').insert({
    task_id: state.createdTaskId,
    type: 'note',
    title: 'Smoke test note',
    description: 'Created by smoke test',
  }).select('*').single();
  if (error) throw new Error(error.message);
  state.createdResourceId = data.id;
});

await test('reading task back joins the resource', async () => {
  const { data, error } = await state.studentClient.from('tasks')
    .select('*, resources(*)').eq('id', state.createdTaskId).single();
  if (error) throw new Error(error.message);
  assert(Array.isArray(data.resources), 'resources should be an array');
  assert(data.resources.length === 1, `expected 1 resource, got ${data.resources.length}`);
});

await test('insert a personal (non-academic) task', async () => {
  const { data, error } = await state.studentClient.from('tasks').insert({
    user_id: state.studentUserId,
    title: 'Smoke test — Exercise',
    is_academic: false,
    priority: 'medium',
  }).select('*').single();
  if (error) throw new Error(error.message);
  assertEqual(data.is_academic, false, 'is_academic should be false');
  // delete this one immediately
  await state.studentClient.from('tasks').delete().eq('id', data.id);
});

// ---------------------------------------------------------------------------
console.log('\n── 6. Cascade behavior ──────────────────────────────────────────');

await test('deleting task cascades to resources', async () => {
  const { error: delErr } = await state.studentClient.from('tasks').delete().eq('id', state.createdTaskId);
  if (delErr) throw new Error(delErr.message);

  const { data, error } = await state.studentClient.from('resources')
    .select('id').eq('id', state.createdResourceId).maybeSingle();
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  assert(data === null, 'resource should be cascade-deleted');
});

// ---------------------------------------------------------------------------
console.log('\n── 7. Cleanup ───────────────────────────────────────────────────');

await test('cleanup: delete test course', async () => {
  if (!state.createdCourseId) return;
  const { error } = await state.studentClient.from('courses').delete().eq('id', state.createdCourseId);
  if (error) throw new Error(error.message);
});

await test('cleanup: delete test student profile', async () => {
  // Student deleting their own profile is allowed by the policy,
  // and cascades to all their data. The auth.users row stays — admin clean-up.
  const { error } = await state.studentClient.from('profiles').delete().eq('id', state.studentUserId);
  if (error) throw new Error(error.message);
});

// ============================================================================
console.log('\n┌──────────────────────────────────────────────────────────────────┐');
console.log(`│  Result: ${PASS} ${passed} passed   ${FAIL} ${failed} failed`.padEnd(74) + '│');
console.log('└──────────────────────────────────────────────────────────────────┘\n');

if (failed > 0) {
  console.log('Failures:');
  for (const f of failures) {
    console.log(`  ${FAIL} ${f.name}`);
    console.log(`      ${f.message}`);
  }
  console.log('');
  process.exit(1);
}

console.log('All checks green. Safe to build the APK.\n');
process.exit(0);

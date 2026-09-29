import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { emptyWorkspace } from '../src/lib/workspace';

test('database isolates users, rejects stale writes and forbids bypassing the save function', async () => {
  const db = new PGlite();
  try {
    // Supabase owns these objects in production. The fixture reproduces only its auth context.
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid() to authenticated;
      insert into auth.users values ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
    `);
    await db.exec(
      await readFile(new URL('../supabase/migrations/001_workspaces.sql', import.meta.url), 'utf8'),
    );
    await db.exec(
      `set role authenticated; set "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111111';`,
    );
    const payload = JSON.stringify(emptyWorkspace());
    const created = await db.query<{ revision: number }>(
      'select public.save_workspace(0, $1::jsonb) as revision',
      [payload],
    );
    assert.equal(created.rows[0].revision, 1);
    await assert.rejects(
      db.query('select public.save_workspace(0, $1::jsonb)', [payload]),
      /revision conflict/,
    );
    await assert.rejects(
      db.query('update public.workspaces set revision = 99'),
      /permission denied/,
    );
    await assert.rejects(
      db.query('select public.save_workspace(1, $1::jsonb)', ['{}']),
      /valid_workspace/,
    );
    await db.exec(`set "request.jwt.claim.sub" = '22222222-2222-4222-8222-222222222222';`);
    assert.equal((await db.query('select * from public.workspaces')).rows.length, 0);
    await assert.rejects(
      db.query('select public.save_workspace(1, $1::jsonb)', [payload]),
      /revision conflict/,
    );
    await db.query('select public.save_workspace(0, $1::jsonb)', [payload]);
    assert.equal((await db.query('select * from public.workspaces')).rows.length, 1);
    await db.exec('reset role; set role anon;');
    await assert.rejects(
      db.query('select public.save_workspace(0, $1::jsonb)', [payload]),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});

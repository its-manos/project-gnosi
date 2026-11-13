const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const { load } = require('./helpers/load-typescript.cjs');
const plain = x => JSON.parse(JSON.stringify(x));
(async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    const dir = path.join(__dirname, '../supabase/migrations');
    for (const file of ['202611120016_friends_pvp.sql', '202611120017_friends_pvp_bank.sql', '20261112235514_pvp_confirm_and_reveal.sql', '20261113103027_pvp_foundations.sql']) await db.exec(fs.readFileSync(path.join(dir, file), 'utf8'));
    const users = [1, 2].map(n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`);
    for (const user of users) await db.query('insert into auth.users values($1)', [user]);
    async function as(n) { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [users[n] ?? '']); await db.exec(`set role ${n === null ? 'anon' : 'authenticated'}`); }
    async function owner(sql, args = []) { await db.exec('reset role'); return db.query(sql, args); }
    async function rpc(name, args) { return (await db.query(`select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) result`, args)).rows[0].result; }
    await as(0); let room = await rpc('pvp_create_room', ['Host', 'all', 5, 30]);
    await as(1); await rpc('pvp_join_room', ['Friend', room.code]); await rpc('pvp_set_ready', [room.id, true]);
    await as(0); room = await rpc('pvp_start_room', [room.id, room.matchId]);
    const originalDeck = (await owner('select questions from public.pvp_rooms where id=$1', [room.id])).rows[0].questions;
    const migration = fs.readFileSync(path.join(dir, fs.readdirSync(dir).find(f => f.endsWith('_quiz_bank_v2.sql'))), 'utf8');
    await db.exec(migration); await db.exec(migration);
    assert.deepEqual((await db.query('select questions from public.pvp_rooms where id=$1', [room.id])).rows[0].questions, originalDeck, 'live deck survives bank update');
    const bank = (await db.query('select question from public.pvp_questions order by id')).rows.map(r => r.question);
    assert.deepEqual(bank, plain([...load('src/data/quickQuizQuestions.ts').quickQuizQuestions].sort((a, b) => a.id.localeCompare(b.id))));
    await owner('delete from public.pvp_rooms');
    for (const category of ['all', 'history', 'science', 'nature', 'technology', 'culture', 'geography', 'sports', 'everyday']) {
      await as(0); room = await rpc('pvp_create_room', ['Host', category, 5, 15]);
      await as(1); await rpc('pvp_join_room', ['Friend', room.code]);
      const seen = new Set(); const games = category === 'all' ? 49 : 7;
      for (let game = 0; game < games; game++) {
        const count = game < games - 1 ? 5 : 10;
        await as(0); room = await rpc('pvp_configure_room', [room.id, room.matchId, room.settingsVersion, category, count, game % 2 ? 30 : 15]);
        for (const n of [1, 0]) { await as(n); await rpc('pvp_ready_for_settings', [room.id, room.matchId, room.settingsVersion, true]); }
        await as(0); room = await rpc('pvp_start_room', [room.id, room.matchId]);
        assert.ok(!('correctIndex' in room.question) && !('explanation' in room.question), 'unrevealed solutions stay private');
        const deck = (await owner('select questions from public.pvp_rooms where id=$1', [room.id])).rows[0].questions;
        assert.equal(deck.length, count); assert.equal(new Set(deck.map(q => q.id)).size, count);
        for (const [level, n] of [['easy', 2], ['medium', 2], ['hard', 1]]) assert.equal(deck.filter(q => q.difficulty === level).length, n * (count / 5));
        if (category !== 'all') assert.ok(deck.every(q => q.categoryId === category));
        if (game < games - 1) for (const q of deck) { assert.ok(!seen.has(q.id), `${category}: repeat before inventory exhausted`); seen.add(q.id); }
        if (game === 0 && category === 'all') assert.ok(new Set(deck.map(q => q.categoryId)).size >= 3);
        await owner("update public.pvp_rooms set status='finished' where id=$1", [room.id]);
        await as(0); room = await rpc('pvp_rematch', [room.id, room.matchId]);
      }
      assert.equal(seen.size, category === 'all' ? 240 : 30);
      await owner('delete from public.pvp_rooms where id=$1', [room.id]);
    }
    await as(0); await assert.rejects(db.query("select public.pvp_has_question_capacity('all',5)"), /permission denied/);
    await assert.rejects(db.query('select * from public.pvp_questions'), /permission denied/);
    await as(null); await assert.rejects(rpc('pvp_create_room', ['Guest', 'all', 5, 30]), /permission denied/);
    console.log('PvP v2 passed: idempotent migration, 240 client/server questions, live-deck preservation, eight categories plus mixed, 5/10 questions, 15/30 seconds, 2/2/1 and 4/4/2 quotas, full inventory rotations, repeat exhaustion and private solutions.');
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

(async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    for (const file of ['202611120016_friends_pvp.sql', '202611120017_friends_pvp_bank.sql', '20261112235514_pvp_confirm_and_reveal.sql', '20261113103027_pvp_foundations.sql']) {
      await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations', file), 'utf8'));
    }
    const users = [1, 2, 3].map(n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`);
    for (const user of users) await db.query('insert into auth.users values($1)', [user]);
    async function as(n) { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [users[n] ?? '']); await db.exec(`set role ${n === null ? 'anon' : 'authenticated'}`); }
    async function owner(sql, args = []) { await db.exec('reset role'); return db.query(sql, args); }
    async function rpc(name, args = []) { return (await db.query(`select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) as result`, args)).rows[0].result; }
    await as(0); let room = await rpc('pvp_create_room', ['Host', 'all', 5, 30]); const id = room.id;
    await as(1); await rpc('pvp_join_room', ['Friend', room.code]);
    await assert.rejects(rpc('pvp_configure_room', [id, room.matchId, 0, 'all', 5, 15]), /pvp_host_only/);
    await as(0);
    await assert.rejects(rpc('pvp_configure_room', [id, room.matchId, 0, 'history', 10, 15]), /pvp_invalid_settings/);
    room = await rpc('pvp_configure_room', [id, room.matchId, 0, 'all', 5, 15]);
    assert.equal(room.settingsVersion, 1); assert.ok(room.players.every(p => !p.ready));
    await assert.rejects(rpc('pvp_ready_for_settings', [id, room.matchId, 0, true]), /pvp_stale_settings/);
    await assert.rejects(rpc('pvp_configure_room', [id, room.matchId, 0, 'all', 5, 30]), /pvp_stale_settings/);
    await assert.rejects(rpc('pvp_set_ready', [id, true]), /pvp_stale_settings/, 'old clients cannot ready unseen changed rules');
    await rpc('pvp_ready_for_settings', [id, room.matchId, 1, true]);
    room = await rpc('pvp_configure_room', [id, room.matchId, 1, 'all', 5, 15]);
    assert.equal(room.settingsVersion, 1); assert.equal(room.players[0].ready, true, 'no-op save preserves readiness');
    await as(1); await rpc('pvp_ready_for_settings', [id, room.matchId, 1, true]);
    await owner("update public.pvp_players set last_seen=clock_timestamp()-interval '16 seconds' where room_id=$1 and user_id=$2", [id, users[1]]);
    await as(0); room = await rpc('pvp_get_room', [id]);
    assert.equal(room.players[1].connected, false); assert.equal(room.players[1].ready, false);
    assert.ok(Date.parse(room.players[1].reconnectUntil) > Date.parse(room.serverNow));
    await assert.rejects(rpc('pvp_start_room', [id, room.matchId]), /pvp_not_ready/);
    await as(1); await rpc('pvp_ready_for_settings', [id, room.matchId, 1, true]);
    // The caller's own heartbeat must not hide an absence from readiness reset.
    await owner("update public.pvp_players set last_seen=clock_timestamp()-interval '16 seconds' where room_id=$1 and user_id=$2", [id, users[1]]);
    await as(1); room = await rpc('pvp_get_room', [id]); assert.equal(room.players[1].ready, false);
    await rpc('pvp_ready_for_settings', [id, room.matchId, 1, true]);
    const seen = new Set(); let completed, firstReview;
    for (let game = 0; game < 7; game++) {
      for (const n of [1, 0]) { await as(n); await rpc('pvp_ready_for_settings', [id, room.matchId, 1, true]); }
      await as(0); room = await rpc('pvp_start_room', [id, room.matchId]);
      const match = room.matchId;
      await assert.rejects(rpc('pvp_get_review', [id, match]), /pvp_review_unavailable/, 'active deck cannot be reviewed');
      await assert.rejects(rpc('pvp_configure_room', [id, match, 1, 'all', 5, 30]), /pvp_already_started/);
      const deck = (await owner('select questions from public.pvp_rooms where id=$1', [id])).rows[0].questions;
      assert.equal(new Set(deck.map(q => q.id)).size, 5);
      if (game < 6) for (const q of deck) { assert.ok(!seen.has(q.id), 'no repeats before all 30 questions are dealt'); seen.add(q.id); }
      else assert.equal(seen.size, 30, 'exhausted bank cycles safely');
      for (let round = 0; round < 5; round++) {
        await owner("update public.pvp_rooms set starts_at=clock_timestamp()-interval '1 second',deadline=clock_timestamp()+interval '30 seconds' where id=$1", [id]);
        await as(0); await rpc('pvp_answer', [id, match, round, deck[round].content.correctIndex]);
        await as(1); await rpc('pvp_answer', [id, match, round, (deck[round].content.correctIndex + 1) % 4]);
        await owner("update public.pvp_rooms set reveal_until=clock_timestamp()-interval '1 second' where id=$1", [id]);
        await as(0); room = await rpc('pvp_get_room', [id]);
      }
      const review = await rpc('pvp_get_review', [id, match]);
      assert.equal(review.items.length, 5); assert.ok(review.items.every(item => item.correct && item.answer === item.question.correctIndex));
      assert.equal(review.items[0].question.explanation, deck[0].explanation); assert.deepEqual(review.items[0].question.sources, deck[0].sources);
      if (game === 0) { completed = match; firstReview = review; }
      await as(1); const other = await rpc('pvp_get_review', [id, match]); assert.ok(other.items.every(item => !item.correct));
      await as(2); await assert.rejects(rpc('pvp_get_review', [id, match]), /pvp_review_unavailable/);
      await as(0); room = await rpc('pvp_rematch', [id, match]);
      assert.deepEqual(await rpc('pvp_get_review', [id, completed]), firstReview, 'original review survives every rematch');
      await assert.rejects(rpc('pvp_ready_for_settings', [id, match, 1, true]), /pvp_stale_settings/, 'old match taps cannot ready a new match');
    }
    // Early completion archives only reached questions, with drafts excluded.
    for (const n of [1, 0]) { await as(n); await rpc('pvp_ready_for_settings', [id, room.matchId, 1, true]); }
    await as(0); room = await rpc('pvp_start_room', [id, room.matchId]);
    await owner("update public.pvp_rooms set starts_at=clock_timestamp()-interval '1 second' where id=$1", [id]);
    await as(0); await rpc('pvp_select_answer', [id, room.matchId, 0, 0]);
    await as(1); await rpc('pvp_leave_room', [id]);
    await as(0); const early = await rpc('pvp_get_review', [id, room.matchId]);
    assert.equal(early.endedEarly, true); assert.equal(early.items.length, 1); assert.equal(early.items[0].answer, null);
    await as(1); assert.equal((await rpc('pvp_get_review', [id, completed])).items.length, 5, 'a participant can review after leaving');
    for (const table of ['pvp_rooms', 'pvp_matches']) await assert.rejects(db.query(`select * from public.${table}`), /permission denied/);
    await assert.rejects(rpc('pvp_archive_match', [id]), /permission denied/);
    await as(null); for (const name of ['pvp_get_review', 'pvp_ready_for_settings', 'pvp_configure_room']) {
      const args = name === 'pvp_get_review' ? [id, completed] : name === 'pvp_ready_for_settings' ? [id, room.matchId, 1, true] : [id, room.matchId, 1, 'all', 5, 30];
      await assert.rejects(rpc(name, args), /permission denied/);
    }
    await owner("update public.pvp_rooms set expires_at=clock_timestamp()-interval '1 second' where id=$1", [id]);
    await as(0); await assert.rejects(rpc('pvp_get_review', [id, completed]), /pvp_review_unavailable/);
    await owner('delete from public.pvp_rooms where id=$1', [id]);
    assert.equal((await db.query('select count(*)::integer n from public.pvp_matches')).rows[0].n, 0, 'room deletion cascades archived reviews');
    console.log('PvP foundations passed: settings revision/host guards, reconnect readiness, seven rematches, repeat exhaustion, personal reviews, active/future/outsider privacy, early finish, expiry and cleanup.');
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

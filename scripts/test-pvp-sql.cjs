/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.env.GNOSI_PGLITE_MODULE || '@electric-sql/pglite');
const { load } = require('./helpers/load-typescript.cjs');
const { evaluateAnswer, createQuizSession, submitQuizAnswer, advanceQuizSession, calculateQuizResults } = load('src/quiz/engine.ts');

(async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    for (let repeat = 0; repeat < 2; repeat++) for (const file of ['202611120016_friends_pvp.sql', '202611120017_friends_pvp_bank.sql', '20261112235514_pvp_confirm_and_reveal.sql']) {
      await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations', file), 'utf8'));
    }
    const users = Array.from({ length: 7 }, (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
    for (const user of users) await db.query('insert into auth.users values($1)', [user]);
    async function as(index) {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [index === null ? '' : users[index]]);
      await db.exec(`set role ${index === null ? 'anon' : 'authenticated'}`);
    }
    async function owner(sql, args = []) { await db.exec('reset role'); return db.query(sql, args); }
    async function rpc(name, args = []) {
      return (await db.query(`select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) as result`, args)).rows[0].result;
    }
    await as(null);
    await assert.rejects(rpc('pvp_resume_room'), /permission denied/);
    await as(0);
    assert.equal(await rpc('pvp_resume_room'), null);
    for (const table of ['pvp_questions', 'pvp_rooms', 'pvp_players', 'pvp_answers', 'pvp_join_limits']) {
      await assert.rejects(db.query(`select * from public.${table}`), /permission denied/);
    }
    await assert.rejects(rpc('pvp_tick', [users[0]]), /permission denied/);
    await assert.rejects(rpc('pvp_require_user'), /permission denied/);
    for (const name of ['', 'x'.repeat(25), 'bad\nname', null]) await assert.rejects(rpc('pvp_create_room', [name, 'all', 5, 30]), /pvp_invalid_name/);
    for (const settings of [['all', 6, 30], ['all', 5, 2], ['history', 10, 30], ['bad', 5, 30], [null, 5, 30]]) {
      await assert.rejects(rpc('pvp_create_room', ['Αλέξης', ...settings]), /pvp_invalid_settings/);
    }
    let room = await rpc('pvp_create_room', ['Αλέξης', 'all', 5, 30]);
    const id = room.id, match = room.matchId;
    assert.match(room.code, /^[A-F0-9]{6}$/);
    assert.equal(room.hostId, users[0]);
    assert.equal((await rpc('pvp_create_room', ['Retry', 'all', 5, 30])).id, id, 'lost create response cannot duplicate a room');
    assert.equal((await rpc('pvp_resume_room')).id, id);
    await assert.rejects(rpc('pvp_start_room', [id, match]), /pvp_not_ready/);
    for (let index = 1; index < 4; index++) {
      await as(index);
      room = await rpc('pvp_join_room', [['', 'Βάσω', 'Γιάννης', 'Δανάη'][index], room.code.toLowerCase()]);
      assert.equal(room.players.length, index + 1);
    }
    await as(4);
    assert.equal((await rpc('pvp_join_room', ['Πέμπτος', room.code])).error, 'pvp_room_full');
    await assert.rejects(rpc('pvp_get_room', [id]), /pvp_not_member/);
    await assert.rejects(rpc('pvp_answer', [id, match, 0, 0]), /pvp_not_member/);
    await as(5);
    for (let i = 0; i < 20; i++) assert.equal((await rpc('pvp_join_room', ['Guess', 'ZZZZZZ'])).error, 'pvp_not_found');
    assert.equal((await rpc('pvp_join_room', ['Guess', room.code])).error, 'pvp_rate_limit', 'failed guesses commit their rate counters');
    await as(1);
    await assert.rejects(rpc('pvp_start_room', [id, match]), /pvp_host_only/);
    for (let index = 1; index < 4; index++) { await as(index); await rpc('pvp_set_ready', [id, true]); }
    await as(0);
    room = await rpc('pvp_start_room', [id, match]);
    assert.equal(room.status, 'question');
    assert.equal(room.question.correctIndex, undefined);
    assert.equal(room.question.explanation, undefined);
    assert.equal(room.questions, undefined);
    assert.equal(room.question.sources, undefined);
    const notStarted = await rpc('pvp_answer', [id, match, 0, 0]);
    assert.equal(notStarted.players.find(player => player.id === users[0]).answered, false, 'countdown rejects early answers');
    await as(1);
    assert.deepEqual((await rpc('pvp_get_room', [id])).question, room.question, 'all devices receive the same question and order');
    await as(4);
    assert.equal((await rpc('pvp_join_room', ['Late join', room.code])).error, 'pvp_already_started');
    const deck = (await owner('select questions from public.pvp_rooms where id=$1', [id])).rows[0].questions;
    assert.equal(new Set(deck.map(q => q.id)).size, 5);
    let sharedSession = createQuizSession('server-score-parity', 'challenge', deck);
    for (let round = 0; round < 5; round++) {
      await owner("update public.pvp_rooms set starts_at=clock_timestamp()-interval '1 second',deadline=clock_timestamp()+interval '30 seconds' where id=$1", [id]);
      await as(0);
      const q = deck[round], correct = q.content.correctIndex;
      if (round === 0) {
        for (let who = 0; who < 4; who++) { await as(who); room = await rpc('pvp_select_answer', [id, match, round, correct]); }
        assert.equal(room.status, 'question', 'all selections must not end the question');
        assert.ok(room.players.every(player => !player.answered && player.answer === null && player.score === 0));
        assert.equal(room.players[3].selection, correct);
        assert.equal(room.players[0].selection, null, 'opponent drafts stay private');
        await as(0); room = await rpc('pvp_select_answer', [id, match, round, (correct + 1) % 4]);
        assert.equal(room.players[0].selection, (correct + 1) % 4, 'selection remains changeable');
      }
      await as(0);
      for (let value = 0; value < 4; value++) assert.equal(evaluateAnswer(q, value).correct, value === correct);
      await assert.rejects(rpc('pvp_answer', [id, match, round, 8]), /pvp_invalid_answer/);
      await assert.rejects(rpc('pvp_answer', [id, users[6], round, correct]), /pvp_stale_round/);
      if (round > 0) await assert.rejects(rpc('pvp_answer', [id, match, round - 1, correct]), /pvp_stale_round/);
      const token = { id: q.id, version: q.version };
      sharedSession = submitQuizAnswer(sharedSession, token, correct).session;
      sharedSession = advanceQuizSession(sharedSession, token).session;
      room = await rpc('pvp_answer', [id, match, round, correct]);
      room = await rpc('pvp_answer', [id, match, round, (correct + 1) % 4]);
      assert.equal(room.players[0].answer, correct, 'first accepted answer wins despite a retry/change');
      assert.equal(room.players[0].score, round, 'current correctness cannot leak through scores');
      await as(1);
      room = await rpc('pvp_get_room', [id]);
      assert.equal(room.players[0].answer, null, 'opponent answer remains concealed');
      assert.equal(room.players[0].answered, true);
      await rpc('pvp_answer', [id, match, round, correct]);
      await as(2);
      await rpc('pvp_answer', [id, match, round, (correct + 1) % 4]);
      if (round === 1) {
        await owner("update public.pvp_rooms set deadline=clock_timestamp()-interval '1 second' where id=$1", [id]);
        await as(3);
        room = await rpc('pvp_answer', [id, match, round, correct]);
        assert.equal(room.players.find(p => p.id === users[3]).answered, false, 'late submission cannot score');
      } else if (round === 2) {
        await as(3); await rpc('pvp_select_answer', [id, match, round, correct]);
        await owner("update public.pvp_rooms set deadline=clock_timestamp()-interval '1 second' where id=$1", [id]);
        await as(0); room = await rpc('pvp_get_room', [id]);
        assert.equal(room.players[3].answered, true, 'deadline locks the saved selection without a client confirmation');
        assert.equal(room.players[3].answer, correct);
      } else {
        await as(3); room = await rpc('pvp_answer', [id, match, round, correct]);
      }
      assert.equal(room.status, 'reveal');
      const revealMs = Date.parse(room.revealUntil) - Date.parse(room.serverNow);
      assert.ok(revealMs > 2500 && revealMs <= 3001, 'server reveal lasts three seconds');
      assert.equal(room.question.correctIndex, correct);
      assert.equal(room.question.explanation, q.explanation);
      assert.equal(room.players[0].score, round + 1);
      assert.equal(room.players[0].answer, correct);
      await owner("update public.pvp_rooms set reveal_until=clock_timestamp()-interval '1 second' where id=$1", [id]);
      await as(0); room = await rpc('pvp_get_room', [id]);
      assert.equal(room.status, round === 4 ? 'finished' : 'question');
    }
    assert.equal(room.players[0].score, calculateQuizResults(sharedSession).correctCount, 'PostgreSQL points equal shared quiz-engine correctCount');
    assert.deepEqual(room.players.map(p => p.score), [5, 5, 0, 4]);
    await as(1); await assert.rejects(rpc('pvp_rematch', [id, match]), /pvp_host_only/);
    await as(0); room = await rpc('pvp_rematch', [id, match]);
    assert.equal(room.status, 'lobby');
    assert.notEqual(room.matchId, match);
    assert.ok(room.players.every(player => player.score === 0 && !player.answered));
    const nextMatch = room.matchId;
    assert.equal((await rpc('pvp_rematch', [id, match])).matchId, nextMatch, 'duplicate rematch does not reset readiness');
    await assert.rejects(rpc('pvp_answer', [id, match, 0, 0]), /pvp_stale_round/);
    // Leaving transfers the host and frees the fourth seat.
    assert.equal(await rpc('pvp_leave_room', [id]), null);
    await as(1); room = await rpc('pvp_get_room', [id]);
    assert.equal(room.hostId, users[1]);
    assert.equal(room.players.length, 3);
    await as(4); room = await rpc('pvp_join_room', ['Έλενα', room.code]);
    assert.equal(room.players.length, 4);
    await assert.rejects(db.query('update public.pvp_rooms set status=\'finished\''), /permission denied/);
    await as(1);
    // Stale lobby seats expire; a fresh heartbeat rescues the caller's own seat.
    await owner("update public.pvp_players set last_seen=clock_timestamp()-interval '91 seconds' where room_id=$1 and user_id=$2", [id, users[2]]);
    await as(1); room = await rpc('pvp_get_room', [id]);
    assert.equal(room.players.length, 3);
    await as(2); assert.equal(await rpc('pvp_resume_room'), null);
    for (const index of [1, 3, 4]) { await as(index); await rpc('pvp_set_ready', [id, true]); }
    await as(1); room = await rpc('pvp_start_room', [id, nextMatch]);
    // A disconnected host transfers control without removing their match seat.
    await owner("update public.pvp_players set last_seen=clock_timestamp()-interval '91 seconds' where room_id=$1 and user_id=$2", [id, users[1]]);
    await as(3); room = await rpc('pvp_get_room', [id]);
    assert.equal(room.hostId, users[3]);
    assert.equal(room.players.length, 3);
    await as(1); room = await rpc('pvp_resume_room');
    assert.equal(room.id, id, 'disconnected match player can resume');
    await rpc('pvp_leave_room', [id]);
    await as(4); await rpc('pvp_leave_room', [id]);
    await as(3); room = await rpc('pvp_get_room', [id]);
    assert.equal(room.status, 'finished'); assert.equal(room.endedEarly, true);
    await owner("update public.pvp_rooms set expires_at=clock_timestamp()-interval '1 second' where id=$1", [id]);
    await as(3); assert.equal((await rpc('pvp_get_room', [id])).status, 'closed');
    assert.equal(await rpc('pvp_resume_room'), null);
    // Host transfers must not let the creator bypass room-creation throttling.
    for (let i = 0; i < 3; i++) {
      await as(6); const fresh = await rpc('pvp_create_room', ['Creator', 'all', 10, 15]);
      await as(0); await rpc('pvp_join_room', ['Friend', fresh.code]);
      await as(6); await rpc('pvp_leave_room', [fresh.id]);
      await as(0); await rpc('pvp_leave_room', [fresh.id]);
    }
    await as(6); await assert.rejects(rpc('pvp_create_room', ['Creator', 'all', 5, 30]), /pvp_rate_limit/);
    console.log('PvP PostgreSQL passed: rerunnable migrations, four seats, accounts/permissions, failed-guess throttling, shared questions/scoring, countdown/timeouts, hidden solutions, immutable answers, stale-round rejection, rematch, reconnect, host transfer and expiry.');
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

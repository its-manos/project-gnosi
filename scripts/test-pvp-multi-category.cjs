const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const { load } = require('./helpers/load-typescript.cjs');
const model = load('src/quiz/pvp.ts');
const plain = x => JSON.parse(JSON.stringify(x));
const ids = plain(model.PVP_CATEGORY_IDS);
const base = { category: 'all', count: 10, seconds: 15 };
assert.deepEqual(plain(model.pvpSelectedCategories(base)), ids);
let settings = model.togglePvpCategory(base, 'history');
assert.deepEqual(plain(settings.categories), ['history']);
settings = model.togglePvpCategory(settings, 'science');
assert.deepEqual(plain(settings.categories), ['history', 'science']);
assert.equal(settings.category, 'all'); assert.equal(settings.count, 10);
assert.equal(model.pvpCategoriesLabel(settings), 'Ιστορία, Επιστήμη');
settings = model.togglePvpCategory(settings, 'history');
assert.equal(settings.category, 'science');
settings = model.togglePvpCategory(settings, 'science');
assert.deepEqual(plain(settings.categories), ids, 'clearing the last filter restores All');
assert.equal(model.pvpCategoriesLabel(settings), 'Όλες οι κατηγορίες');
assert.deepEqual(plain(model.togglePvpCategory({ ...base, category: 'sports' }, 'all').categories), ids);
assert.deepEqual(plain(model.pvpSelectedCategories({ ...base, categories: [] })), [], 'explicit empty lists cannot silently widen');

(async () => {
 const db = new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
  const dir = path.join(__dirname, '../supabase/migrations');
  for (const name of ['202611120016_friends_pvp.sql','202611120017_friends_pvp_bank.sql','20261112235514_pvp_confirm_and_reveal.sql','20261113103027_pvp_foundations.sql',...fs.readdirSync(dir).filter(f => f.endsWith('_quiz_bank_v2.sql'))]) await db.exec(fs.readFileSync(path.join(dir,name),'utf8'));
  const users = [1,2,3].map(n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`);
  for (const user of users) await db.query('insert into auth.users values($1)',[user]);
  async function as(n) { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[users[n] ?? '']); await db.exec(`set role ${n === null ? 'anon' : 'authenticated'}`); }
  async function owner(sql,args=[]) { await db.exec('reset role'); return db.query(sql,args); }
  async function rpc(name,args) { try { const result=(await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result; if(result?.error)throw new Error(result.error);return result; } catch(error) { throw new Error(`${name}: ${error.message}`, { cause: error }); } }
  async function ready(room) { for (const n of [1,0]) { await as(n); await rpc('pvp_ready_for_settings',[room.id,room.matchId,room.settingsVersion,true]); } }
  async function deck(room) { return (await owner('select questions from public.pvp_rooms where id=$1',[room.id])).rows[0].questions; }
  const sorted = x => [...x].sort();
  function check(deck,categories,count) {
    assert.equal(deck.length,count); assert.equal(new Set(deck.map(q=>q.id)).size,count);
    assert.ok(deck.every(q=>categories.includes(q.categoryId)),'no question outside selected categories');
    for (const [difficulty,n] of [['easy',2],['medium',2],['hard',1]]) assert.equal(deck.filter(q=>q.difficulty===difficulty).length,n*count/5);
  }
  await as(0); let room = await rpc('pvp_create_room',['Host','science',5,30]);
  await as(1); await rpc('pvp_join_room',['Friend',room.code]); await rpc('pvp_set_ready',[room.id,true]);
  await as(0); room = await rpc('pvp_start_room',[room.id,room.matchId]);
  const activeDeck = await deck(room);
  await as(2); const legacyAll = await rpc('pvp_create_room',['Other','all',10,15]);
  await db.exec('reset role');
  const migration = fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(f=>f.endsWith('_pvp_multi_category.sql'))),'utf8');
  await db.exec(migration); await db.exec(migration);
  assert.deepEqual(await deck(room),activeDeck,'migration preserves active deck and answer order');
  let backfill = await owner('select id,category_ids from public.pvp_rooms');
  assert.deepEqual(backfill.rows.find(r=>r.id===room.id).category_ids,['science']);
  assert.deepEqual(backfill.rows.find(r=>r.id===legacyAll.id).category_ids,sorted(ids));
  await owner('delete from public.pvp_rooms');

  await as(0);
  for (const categories of [null,[],['all'],['history','unknown'],[null],['History'],[['history']],Array(9).fill('history')]) {
    await assert.rejects(rpc('pvp_create_room_categories',['Host',categories,5,30]),/pvp_invalid_settings/);
  }
  for (const [count,seconds] of [[null,30],[6,30],[5,null],[5,99]]) await assert.rejects(rpc('pvp_create_room_categories',['Host',['history'],count,seconds]),/pvp_invalid_settings/);
  room = await rpc('pvp_create_room_categories',['Host',['science','history','science'],5,30]);
  assert.deepEqual(room.categories,['history','science']);
  await as(1); await rpc('pvp_join_room',['Friend',room.code]); await ready(room);
  await as(1); await assert.rejects(rpc('pvp_configure_room_categories',[room.id,room.matchId,0,['sports'],5,30]),/pvp_host_only/);
  await as(2); await assert.rejects(rpc('pvp_configure_room_categories',[room.id,room.matchId,0,['sports'],5,30]),/pvp_not_member/);
  await as(0); room = await rpc('pvp_configure_room_categories',[room.id,room.matchId,0,['science','history'],5,30]);
  assert.equal(room.settingsVersion,0); assert.ok(room.players.every(p=>p.ready),'reordered same set preserves readiness');
  room = await rpc('pvp_configure_room_categories',[room.id,room.matchId,0,['history','nature','science'],5,30]);
  assert.equal(room.settingsVersion,1); assert.ok(room.players.every(p=>!p.ready),'a changed subset resets every ready flag even when legacy category stays all');
  await assert.rejects(rpc('pvp_ready_for_settings',[room.id,room.matchId,0,true]),/pvp_stale_settings/);
  await assert.rejects(rpc('pvp_configure_room_categories',[room.id,room.matchId,0,['history'],5,30]),/pvp_stale_settings/);
  await assert.rejects(rpc('pvp_start_room',[room.id,room.matchId]),/pvp_not_ready/);
  await ready(room); room = await rpc('pvp_start_room',[room.id,room.matchId]);
  check(await deck(room),room.categories,5);
  await as(0); await assert.rejects(rpc('pvp_configure_room_categories',[room.id,room.matchId,1,['history'],5,30]),/pvp_already_started/);
  await owner("update public.pvp_rooms set status='finished' where id=$1",[room.id]);
  await as(0); room = await rpc('pvp_rematch',[room.id,room.matchId]);
  assert.deepEqual(room.categories,['history','nature','science']);
  room = await rpc('pvp_configure_room',[room.id,room.matchId,1,'all',10,15]);
  assert.deepEqual(room.categories,['history','nature','science'],'legacy count/timer edit preserves a newer selected subset');
  room = await rpc('pvp_configure_room_categories',[room.id,room.matchId,2,ids,10,15]);
  assert.deepEqual(room.categories,sorted(ids),'explicit All clears selected filters');
  room = await rpc('pvp_configure_room',[room.id,room.matchId,3,'sports',10,30]);
  assert.deepEqual(room.categories,['sports']); assert.equal(room.category,'sports');
  await owner('delete from public.pvp_rooms');

  let cases = 0;
  for (let mask=1;mask<2**ids.length;mask++) {
    const categories=ids.filter((_,i)=>mask&(1<<i));
    for (const count of [5,10]) for (const seconds of [15,30]) {
      await as(0); room = await rpc('pvp_create_room_categories',['Host',categories,count,seconds]);
      assert.deepEqual(room.categories,sorted(categories));
      await as(1); await rpc('pvp_join_room',['Friend',room.code]); await ready(room);
      await as(0); room = await rpc('pvp_start_room',[room.id,room.matchId]);
      assert.ok(!('correctIndex'in room.question) && !('explanation'in room.question),'unrevealed answers remain private');
      const questions=await deck(room);check(questions,categories,count);
      assert.equal(new Set(questions.map(q=>q.categoryId)).size,Math.min(categories.length,count),'fresh mixed rounds cover selected subjects when slots allow');
      await owner('delete from public.pvp_rooms where id=$1',[room.id]);
      await owner('delete from public.pvp_join_limits'); // Independent cases must not share the real join rate limit.
      cases++;
    }
  }
  for (const categories of [['history','science'],['sports','everyday','nature']]) {
    await as(0); room=await rpc('pvp_create_room_categories',['Host',categories,10,15]);
    await as(1); await rpc('pvp_join_room',['Friend',room.code]);
    const seen = new Set(), rounds=categories.length*3;
    for (let round=0;round<=rounds;round++) {
      await ready(room);await as(0);room=await rpc('pvp_start_room',[room.id,room.matchId]);
      const questions=await deck(room);check(questions,categories,10);
      if(round<rounds)for(const q of questions){assert.ok(!seen.has(q.id),'no repeats before the selected inventory is exhausted');seen.add(q.id);}
      await owner("update public.pvp_rooms set status='finished' where id=$1",[room.id]);
      await as(0);room=await rpc('pvp_rematch',[room.id,room.matchId]);
      assert.deepEqual(room.categories,sorted(categories));
    }
    assert.equal(seen.size,categories.length*30);
    await owner('delete from public.pvp_rooms where id=$1',[room.id]);
  }
  await as(0);await assert.rejects(db.query("select public.pvp_normalize_categories(array['history'])"),/permission denied/);
  await assert.rejects(db.query("select public.pvp_has_category_capacity(array['history'],5)"),/permission denied/);
  await assert.rejects(db.query('select * from public.pvp_rooms'),/permission denied/);
  await as(null);await assert.rejects(rpc('pvp_create_room_categories',['Guest',['history'],5,30]),/permission denied/);
  console.log(`PvP multi-category passed: ${cases} subset/count/timer cases, canonical sets, legacy backfill/API, active-deck preservation, revisions/readiness, host/member/anonymous guards, selected-only draws, diversity, rematches and repeat exhaustion.`);
 } finally { await db.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});

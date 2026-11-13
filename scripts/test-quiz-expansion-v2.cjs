const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('./helpers/load-typescript.cjs');
const plain = value => JSON.parse(JSON.stringify(value));
const { questions: daily } = load('src/data/questions.ts');
const { quickQuizQuestions: quick } = load('src/data/quickQuizQuestions.ts');
const { DAILY_CHALLENGE_TOPICS: topics } = load('src/data/dailyChallengeTopics.ts');
const { PVP_TOPICS } = load('src/quiz/pvp.ts');
const shared = load('src/utils/sharedDailyChallenge.ts');
const { SHARED_DAILY_V2_START } = load('src/data/sharedDailyPoolV2.ts');
const legacy = JSON.parse(fs.readFileSync('scripts/fixtures/play-banks-before-v2.json', 'utf8'));
assert.deepEqual(plain(daily.slice(0, 109)), legacy.daily, 'published Daily objects and answer slots stay intact');
assert.deepEqual(plain(quick.slice(0, 30)), legacy.quick, 'published Quick/PvP objects stay intact');
assert.equal(daily.length, 336); assert.equal(quick.length, 240);
assert.deepEqual(new Set(PVP_TOPICS.filter(t => t.id !== 'all').map(t => t.id)), new Set(topics.map(t => t.id)));
for (const [bank, targets] of [[daily, [12, 18, 12]], [quick, [12, 12, 6]]]) {
  assert.equal(new Set(bank.map(q => q.id)).size, bank.length);
  for (const topic of topics) for (const [i, difficulty] of ['easy', 'medium', 'hard'].entries()) {
    assert.equal(bank.filter(q => q.categoryId === topic.id && q.difficulty === difficulty).length, targets[i]);
  }
}
const pilot = JSON.parse(fs.readFileSync('content/quiz/pilot-v2.json')).questionIds;
assert.equal(pilot.length, 48); assert.equal(new Set(pilot).size, 48);
for (const topic of topics) for (const difficulty of ['easy', 'medium', 'hard']) for (const bank of [daily, quick]) {
  assert.equal(bank.filter(q => pilot.includes(q.id) && q.categoryId === topic.id && q.difficulty === difficulty).length, 1);
}
const recent = [];
for (let day = 0; day < 740; day++) {
  const key = new Date(Date.parse(`${SHARED_DAILY_V2_START}T12:00:00Z`) + day * 86400000).toISOString().slice(0, 10);
  const picked = shared.selectSharedDailyQuestions(key);
  assert.equal(picked.length, 7); assert.equal(new Set(picked.map(q => q.id)).size, 7);
  assert.deepEqual(plain(picked.map(q => q.difficulty)), ['easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard']);
  assert.equal(new Set(picked.map(q => q.categoryId)).size, 4);
  assert.ok(picked.every(q => picked.filter(x => x.categoryId === q.categoryId).length <= 2));
  recent.push(picked.map(q => q.id)); if (recent.length > 30) recent.shift();
  assert.equal(new Set(recent.flat()).size, recent.length * 7, `repeat in rolling 30 days at ${key}`);
  if (day % 47 === 0) assert.deepEqual(plain(shared.selectSharedDailyQuestions(key, [...daily].reverse())), plain(picked));
}
assert.equal(shared.createSharedDailyRecord(SHARED_DAILY_V2_START).selectionVersion, 'shared-v2');
const past = '2026-11-13';
assert.deepEqual(plain(shared.selectSharedDailyQuestions(past)), plain(shared.selectSharedDailyQuestions(past, legacy.daily)));
assert.equal(shared.createSharedDailyRecord(past).selectionVersion, 'shared-v1');
const future = '2026-12-31';
assert.equal(shared.selectSharedDailyQuestions(future, legacy.daily).length, 0, 'missing published v2 content fails closed');
const changed = daily.map((q, i) => i === 0 ? { ...q, correctIndex: (q.correctIndex + 1) % 4 } : q);
assert.equal(shared.selectSharedDailyQuestions(future, changed).length, 0);
assert.deepEqual(plain(shared.selectSharedDailyQuestions(future, [...daily, { ...daily[0], id: 'unpublished' }])), plain(shared.selectSharedDailyQuestions(future)));
const saved = shared.createSharedDailyRecord(past);
assert.equal(shared.dailyQuestionsCompatible(saved), true);
const quickIds = new Set(quick.map(q => q.id));
assert.ok(daily.every(q => !quickIds.has(q.id)), 'Daily reserve remains outside Quick/PvP');
const sources = JSON.parse(fs.readFileSync('content/quiz/sources.json'));
const audit = JSON.parse(fs.readFileSync('content/quiz/source-audit.json'));
for (const topic of topics) for (const line of fs.readFileSync(`content/quiz/v2/${topic.id}.psv`, 'utf8').trim().split('\n')) {
  const fields = line.split('|'); const source = fields[4];
  assert.ok(sources[source], source);
  assert.equal(audit[source]?.url, sources[source][1], `${source}: stale source audit`);
  assert.equal(audit[source]?.status, 200, `${source}: missing successful source fetch`);
  assert.ok(audit[source].characters >= 700, `${source}: empty or unavailable source body`);
}
console.log('Quiz v2 passed: immutable legacy banks, 48-cell quotas, 48-question pilot, eight shared categories, 740 deterministic dates, rolling 30-day exclusion including cycle boundaries, frozen revisions, Daily reserve and source availability.');

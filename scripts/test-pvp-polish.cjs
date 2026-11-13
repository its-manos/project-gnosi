const assert = require('node:assert/strict');
const { load } = require('./helpers/load-typescript.cjs');
const { PvpIdentityStore, validPlayerName } = load('src/state/PvpIdentity.ts');
const { PvpFeedbackTracker } = load('src/play/pvpFeedback.ts');

(async () => {
  const disk = new Map(); let failRead = false, failWrite = false, writes = 0;
  const storage = {
    getItem: async key => { if (failRead) throw Error('offline disk'); return disk.get(key) ?? null; },
    setItem: async (key, value) => { writes++; if (failWrite) throw Error('full disk'); disk.set(key, value); },
  };
  for (const value of ['', ' '.repeat(5), 'x'.repeat(25), 'a\nb']) assert.equal(validPlayerName(value), false);
  const first = new PvpIdentityStore(storage, 'account:A'); await first.load();
  assert.equal(first.getSnapshot().name, '');
  assert.equal(await first.choose(' Μάνος '), true);
  const reopened = new PvpIdentityStore(storage, 'account:A'); await reopened.load();
  assert.equal(reopened.getSnapshot().name, 'Μάνος', 'name survives leaving the screen/process');
  const second = new PvpIdentityStore(storage, 'account:B'); await second.load();
  assert.equal(second.getSnapshot().name, '', 'different account cannot inherit a player name');
  assert.equal(await reopened.choose('Μάνος'), true); assert.equal(writes, 1, 'unchanged name does not rewrite storage');
  failWrite = true; assert.equal(await reopened.choose('Νέο όνομα'), false);
  assert.equal(reopened.getSnapshot().name, 'Μάνος', 'failed save keeps the committed identity');
  failWrite = false; assert.equal(await reopened.choose('Νέο όνομα'), true);
  const corrupt = new PvpIdentityStore(storage, 'corrupt'); disk.set('corrupt', '{bad');
  await corrupt.load(); assert.equal(corrupt.getSnapshot().ready, false);
  assert.equal(await corrupt.choose('Overwrite'), false); assert.equal(disk.get('corrupt'), '{bad');
  failRead = true; const retry = new PvpIdentityStore(storage, 'retry'); await retry.load();
  assert.equal(retry.getSnapshot().ready, false); failRead = false; await retry.load();
  assert.equal(retry.getSnapshot().ready, true, 'failed loads can be retried');
  let release; const pending = new Promise(resolve => { release = resolve; });
  const racing = new PvpIdentityStore({ ...storage, setItem: async () => pending }, 'racing'); await racing.load();
  const one = racing.choose('First'); await Promise.resolve();
  assert.equal(await racing.choose('Second'), false); release(); assert.equal(await one, true);
  assert.equal(racing.getSnapshot().name, 'First');

  const tracker = new PvpFeedbackTracker();
  const lobby = { id: 'room', matchId: 'match', index: 0, status: 'lobby', players: [{ id: 'self', answered: false, answer: null }] };
  const question = { ...lobby, status: 'question' };
  const reveal = { ...question, status: 'reveal', question: { correctIndex: 2 }, players: [{ id: 'self', answered: true, answer: 2 }] };
  const cues = value => JSON.parse(JSON.stringify(value));
  assert.deepEqual(cues(tracker.update(lobby, 'self', false, true)), []);
  assert.deepEqual(cues(tracker.update(question, 'self', false, true)), []);
  assert.deepEqual(cues(tracker.update(question, 'self', true, true)), ['question-open']);
  assert.deepEqual(cues(tracker.update({ ...question }, 'self', true, true)), []);
  assert.deepEqual(cues(tracker.update(reveal, 'self', false, true)), ['correct']);
  assert.deepEqual(cues(tracker.update({ ...reveal }, 'self', false, true)), []);
  assert.deepEqual(cues(tracker.update({ ...reveal, status: 'finished' }, 'self', false, true)), ['complete']);
  assert.deepEqual(cues(new PvpFeedbackTracker().update(reveal, 'self', false, true)), [], 'restored reveal is silent');
  const late = new PvpFeedbackTracker(); late.update(question, 'self', true, true);
  assert.deepEqual(cues(late.update(reveal, 'self', false, false)), [], 'background/stale reveal is silent');
  assert.deepEqual(cues(late.update(reveal, 'self', false, true)), [], 'foreground recovery does not replay results');
  const wrong = new PvpFeedbackTracker(); wrong.update(question, 'self', true, true);
  assert.deepEqual(cues(wrong.update({ ...reveal, players: [{ id: 'self', answered: true, answer: 0 }] }, 'self', false, true)), ['incorrect']);
  const timeout = new PvpFeedbackTracker(); timeout.update(question, 'self', true, true);
  assert.deepEqual(cues(timeout.update({ ...reveal, players: question.players }, 'self', false, true)), ['incorrect']);
  const early = new PvpFeedbackTracker(); early.update(reveal, 'self', false, true);
  assert.deepEqual(cues(early.update({ ...reveal, status: 'finished', endedEarly: true }, 'self', false, true)), []);
  console.log('PvP polish passed: durable/account-isolated names, errors/retry/concurrent saves, and one-shot question/reveal/result cues with hydration, reconnect, timeout and early-exit guards. Native sound playback needs device QA.');
})().catch(error => { console.error(error); process.exitCode = 1; });

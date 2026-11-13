/* global __dirname */
// Source-of-truth: content/quiz/v2/*.psv. No model/API calls at build or play time.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { load } = require('./helpers/load-typescript.cjs');
const { contentVersion, createQuizSession } = load('src/quiz/engine.ts');
const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const baseline = read('scripts/fixtures/play-banks-before-v2.json');
const sources = read('content/quiz/sources.json');
const topics = load('src/data/dailyChallengeTopics.ts').DAILY_CHALLENGE_TOPICS.map(t => t.id);
const normal = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('el').replace(/[^\p{L}\p{N}]/gu, '');
const rows = [];
for (const categoryId of [...topics].sort()) {
  const lines = fs.readFileSync(path.join(root, `content/quiz/v2/${categoryId}.psv`), 'utf8').trim().split('\n');
  for (const line of lines) {
    const fields = line.split('|');
    assert.equal(fields.length, 11, `${categoryId}: expected 11 pipe-separated fields`);
    const [pool, difficulty, slug, subcategoryId, sourceId, prompt, correct, wrong1, wrong2, wrong3, explanation] = fields;
    assert.ok(['D', 'Q'].includes(pool) && ['easy', 'medium', 'hard'].includes(difficulty), slug);
    assert.ok(/^[a-z][a-z0-9-]+$/.test(slug) && subcategoryId && explanation.trim(), slug);
    assert.ok(sources[sourceId], `${slug}: unknown source ${sourceId}`);
    assert.equal(new Set([correct, wrong1, wrong2, wrong3].map(a => a.normalize("NFC").trim().toLocaleLowerCase("el"))).size, 4, slug);
    assert.ok(prompt.length <= (pool === 'Q' ? 220 : 280), `${slug}: shorten prompt (${prompt.length})`);
    assert.ok([correct, wrong1, wrong2, wrong3].every(a => a.trim() && a.length <= 100), slug);
    if (pool === 'Q') assert.ok([prompt, correct, wrong1, wrong2, wrong3].join('').length <= 260, `${slug}: timed reading budget exceeded`);
    const id = pool === "D" ? `daily-v2-${categoryId}-${slug}` : `quick:v2:${categoryId}:${slug}`;
    if (pool === "D") assert.ok(/^[a-zA-Z0-9_-]{1,100}$/.test(id), `${slug}: incompatible report ID`);
    const source = sources[sourceId];
    rows.push({ id, pool, difficulty, categoryId, subcategoryId, sourceId, prompt, correct, wrong: [wrong1, wrong2, wrong3], explanation,
      sources: [{ title: source[0], url: source[1], publisher: source[2] }] });
  }
}
assert.equal(rows.length, 437);
const ids = new Set([...baseline.daily, ...baseline.quick].map(q => q.id));
const prompts = new Set([...baseline.daily.map(q => q.question), ...baseline.quick.map(q => q.prompt)].map(normal));
for (const row of rows) {
  assert.ok(!ids.has(row.id), `duplicate ID: ${row.id}`); ids.add(row.id);
  assert.ok(!prompts.has(normal(row.prompt)), `duplicate prompt: ${row.id}`); prompts.add(normal(row.prompt));
}
// Rotate correct positions independently within each pool; wrong-answer order is authored.
const ordinal = { D: 0, Q: 0 };
const daily = [], quick = [];
for (const row of rows) {
  const correctIndex = [2, 0, 3, 1][ordinal[row.pool]++ % 4];
  const answers = [...row.wrong]; answers.splice(correctIndex, 0, row.correct);
  const content = { answers, correctIndex };
  const common = { id: row.id, categoryId: row.categoryId, subcategoryId: row.subcategoryId,
    conceptIds: [row.id], difficulty: row.difficulty, explanation: row.explanation, sources: row.sources };
  if (row.pool === 'D') daily.push({ ...common, question: row.prompt, answers, correctIndex, sourceTitle: row.sources[0].title, sourceUrl: row.sources[0].url });
  else quick.push({ ...common, type: 'multiple-choice', version: contentVersion(row.prompt, content), difficultyOrigin: 'editorial', prompt: row.prompt, content });
}
for (const [pool, bank, target] of [['D', [...baseline.daily, ...daily], [12, 18, 12]], ['Q', [...baseline.quick, ...quick], [12, 12, 6]]]) {
  for (const category of topics) for (const [i, difficulty] of ['easy', 'medium', 'hard'].entries()) {
    assert.equal(bank.filter(q => q.categoryId === category && q.difficulty === difficulty).length, target[i], `${pool}:${category}:${difficulty}`);
  }
}
for (let i = 0; i < quick.length; i += 10) createQuizSession(`new-quick-bank:${i}`, 'challenge', quick.slice(i, i + 10));
const allDaily = [...baseline.daily, ...daily];
const idsV2 = allDaily.map(q => q.id).sort();
const versionsV2 = Object.fromEntries(idsV2.map(id => { const q = allDaily.find(q => q.id === id); return [id, contentVersion(q.question, { answers: q.answers, correctIndex: q.correctIndex }, q.version)]; }));
const hash = text => { let n = 2166136261; for (let i = 0; i < text.length; i++) n = Math.imul(n ^ text.charCodeAt(i), 16777619); return n >>> 0; };
const queues = new Map();
for (const category of topics) for (const difficulty of ['easy', 'medium', 'hard']) {
  queues.set(`${category}:${difficulty}`, allDaily.filter(q => q.categoryId === category && q.difficulty === difficulty)
    .sort((a, b) => hash(`shared-v2|${a.id}`) - hash(`shared-v2|${b.id}`) || a.id.localeCompare(b.id)).map(q => q.id));
}
const dailyLevels = ['easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard'];
const offsets = [0, 1, 0, 2, 3, 1, 2];
const schedule = Array.from({ length: 48 }, (_, day) => dailyLevels.map((difficulty, slot) => {
  const category = topics[(day + offsets[slot]) % topics.length];
  const id = queues.get(`${category}:${difficulty}`).shift();
  assert.ok(id); return id;
}));
assert.equal(new Set(schedule.flat()).size, 336);
assert.ok([...queues.values()].every(queue => queue.length === 0));
const outputs = {
  'src/data/generatedQuizExpansion.ts': '// Generated by scripts/generate-quiz-expansion.cjs. Edit content/quiz/v2/*.psv.\nimport type { GeneralKnowledgeQuestion } from "./questions";\nimport type { ChoiceQuestion } from "../quiz/types";\nexport const dailyExpansionQuestions: GeneralKnowledgeQuestion[] = ' + JSON.stringify(daily, null, 2) + ';\nexport const quickExpansionQuestions: readonly ChoiceQuestion[] = ' + JSON.stringify(quick, null, 2) + ';\n',
  'src/data/sharedDailyScheduleV2.ts': '// Generated immutable 48-day cycle: each published ID occurs once.\nexport const SHARED_DAILY_V2_SCHEDULE: readonly (readonly string[])[] = ' + JSON.stringify(schedule, null, 2) + ';\n',
  'src/data/sharedDailyPoolV2.ts': '// Published shared-v2. Do not change scored content or this manifest after release.\nexport const SHARED_DAILY_V2_START = "2026-11-14";\nexport const SHARED_DAILY_V2_VERSION = "shared-v2";\nexport const SHARED_DAILY_V2_IDS: readonly string[] = ' + JSON.stringify(idsV2, null, 2) + ';\nexport const SHARED_DAILY_V2_VERSIONS: Readonly<Record<string, string>> = ' + JSON.stringify(versionsV2, null, 2) + ';\n',
};
// The pilot is a reviewable subset of this release, not a second copy of its questions.
const pilot = topics.flatMap(category => ['D', 'Q'].flatMap(pool => ['easy', 'medium', 'hard'].map(level => rows.find(r => r.categoryId === category && r.pool === pool && r.difficulty === level).id)));
outputs['content/quiz/pilot-v2.json'] = JSON.stringify({ revision: 'v2', questionIds: pilot }, null, 2) + '\n';
outputs['docs/quiz-v2-inventory.md'] = '# Quiz expansion v2 inventory\n\n437 additions: 227 Daily-only and 210 shared Quick/PvP questions. Difficulty labels are editorial estimates.\n\n| Pool | Category | Easy | Medium | Hard | Total |\n|---|---|---:|---:|---:|---:|\n' + ['D', 'Q'].flatMap(pool => topics.map(category => { const bank = pool === 'D' ? allDaily : [...baseline.quick, ...quick]; const counts = ['easy', 'medium', 'hard'].map(d => bank.filter(q => q.categoryId === category && q.difficulty === d).length); return `| ${pool === 'D' ? 'Daily' : 'Quick/PvP'} | ${category} | ${counts.join(' | ')} | ${counts.reduce((a, b) => a + b)} |`; })).join('\n') + '\n\n| ID | Difficulty | Subtopic | Prompt |\n|---|---|---|---|\n' + rows.map(r => `| ${r.id}${pilot.includes(r.id) ? ' (pilot)' : ''} | ${r.difficulty} | ${r.subcategoryId} | ${r.prompt} |`).join('\n') + '\n';
outputs['docs/quiz-v2-pilot.md'] = '# Quiz v2 — 48-question pilot\n\nOne new question per category, difficulty and pool. This subset is included in the full expansion. Correct options are marked in bold for editorial review.\n\n' + rows.filter(r => pilot.includes(r.id)).map(r => {
  const q = (r.pool === 'D' ? daily : quick).find(q => q.id === r.id);
  const answers = r.pool === 'D' ? q.answers : q.content.answers;
  const correctIndex = r.pool === 'D' ? q.correctIndex : q.content.correctIndex;
  return `## ${r.categoryId} / ${r.pool === 'D' ? 'Daily' : 'Quick + PvP'} / ${r.difficulty}\n\n${r.prompt}\n\n` + answers.map((a, i) => `- ${i === correctIndex ? '**' + a + '**' : a}`).join('\n') + `\n\n${r.explanation}\n\nSource: [${r.sources[0].title}](${r.sources[0].url})\n\n`;
}).join('');
for (const [file, text] of Object.entries(outputs)) {
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), text, `${file} is stale`);
  else fs.writeFileSync(path.join(root, file), text);
}
console.log(`Quiz v2: ${daily.length} Daily + ${quick.length} Quick/PvP additions; all 48 category/difficulty/pool cells meet targets; 48-question pilot.`);

const assert = require('node:assert/strict');
const { load } = require('./helpers/load-typescript.cjs');
let learning = { ready: true, backup: { completedIds: [] }, activity: {}, weeklyReviews: {}, knowledgeReviews: {}, rewards: {} };
let daily = { ready: true, doc: { days: {} } };
let history = [];
const { useKnowledgeProfile } = load('src/hooks/useKnowledgeProfile.ts', {
  react: { useMemo: fn => fn() },
  '../state/LearningSession': { useLearningDataSnapshot: () => learning, useDailyDataSnapshot: () => daily },
  '../hooks/useAthensDate': {},
  './useAthensDate': { useAthensDate: () => '2026-11-12' },
  '../utils/dailySyncDocument': { dailyHistory: () => history },
});
let result = useKnowledgeProfile();
assert.equal(result.profile.trophies.filter(t => t.unlocked).length, 0);
learning.rewards = {
  'game:hangman:2026-11-12:a': 10,
  'game:hangman:2026-11-12:b': 0,
  'game:quick:2026-11-12:c': 2,
  'game:hangman:2026-11-13:d': 10,
  'review:2026-11-10': 10,
};
history = [10, 11, 12, 13].map(day => ({ dateKey: `2026-11-${day}`, correctCount: 4, score: 400 }));
result = useKnowledgeProfile();
const metric = family => result.profile.trophies.find(t => t.family === family).current;
assert.equal(metric('hangman'), 1, 'Only past rewarded Hangman wins count');
assert.equal(metric('daily'), 3, 'Future challenge entries do not count');
assert.equal(metric('streak'), 3);
assert.equal(metric('revision'), 1);
history = [{ dateKey: '2026-11-02', correctCount: 4, score: 400 }, { dateKey: '2026-11-03', correctCount: 4, score: 400 }, { dateKey: '2026-11-04', correctCount: 4, score: 400 }];
result = useKnowledgeProfile();
assert.equal(metric('streak'), 3, 'A broken current streak preserves the best streak trophy');
learning = { ...learning, ready: false, rewards: {} };
assert.equal(useKnowledgeProfile().ready, false);
learning = { ...learning, ready: true };
history = [];
assert.equal(useKnowledgeProfile().profile.trophies.filter(t => t.unlocked).length, 0, 'Account switch cannot leak trophies');
console.log('Live trophy hydration, history, account isolation and receipt counting passed');

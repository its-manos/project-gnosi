# Hangman word bank

The game contains 180 Greek words: 20 each in History, Science, Nature, Technology, Arts, Geography, Difficult History, Sports and Everyday Knowledge. The original 28 entries and IDs are preserved exactly in `scripts/fixtures/hangman-before-expansion.json`.

Author additions in `words-v2.psv`, using `category|slug|word|difficulty|clue|fact`. Run `npm run hangman:generate`, then `npm run test:hangman`. `npm run hangman:check` verifies that the checked-in generated bank matches the authored rows.

The 152 additions include 58 easy, 65 medium and 29 hard words. Difficulty estimates consider familiarity, spelling, repeated or uncommon letters and how directly the clue identifies the answer. They are editorial metadata; the game continues to mix all levels in its shuffled deck. Existing categories gain 6 easy, 7 medium and 3 hard words each; the two new categories have 8 easy, 8 medium and 4 hard words each.

Answers are single Greek words of 4–13 letters. Clues do not contain the normalized answer, and each word has a short educational fact. Validation checks unique IDs and answers, Greek letters, length, category coverage and the difficulty mix. Gameplay tests solve and lose every word, then exercise three complete decks to verify that words do not repeat until the deck is exhausted.

The Greek descriptions were authored for the game. New word IDs are namespaced with `hangman-v2-`; retain published IDs and wording when making later additions. Lessons, question banks and saved reward receipts use their existing content and compatibility rules.

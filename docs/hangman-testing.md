# Hangman first device pass

Branch: `codex/expand-quiz-banks-v2`

```bash
git fetch origin
git switch codex/expand-quiz-banks-v2
git pull --ff-only
npm ci
npm run test:hangman
npm run typecheck
npx expo start --clear
```

Use the same installed development client / Expo setup you already use for Gnosi.

On both Android and iPhone:

- Home: Κρεμάλα is below the knowledge worlds. Check small and tall screens, cold launch and returning to Home. Cards must remain readable and the last card reachable.
- Open Κρεμάλα. Check the title, clue, blank slots, six remaining mistakes and all 24 Greek keys. Nothing overlaps safe areas or the system navigation bar.
- Tap a correct letter: all occurrences appear. Tap a wrong letter: one figure part appears and the figure shakes. Used keys show distinct states and cannot consume another guess.
- Solve a word: celebration, complete sound, fact and Επόμενη λέξη appear. Lose another: the entire word appears, missed letters are marked, and the fact remains available.
- Check words from Αθλητισμός and Καθημερινές γνώσεις as well as the original seven categories. The bank contains 180 words, 20 per category, with a mix of familiar and more challenging spellings.
- Rapidly double-tap letters and Next. No extra mistake, duplicate sound or skipped word should occur.
- Try a long word and increased system text size. Text and keyboard must remain readable, with scrolling available when needed. Rotate the device too.
- Enable reduced motion, then open and play again. No entrance, shake, pulse or drawing fade should run; all results remain visible.
- Check sounds with the app's sound setting both on and off. Opening and starting another word should play the question-open cue when sound is on.
- Use the header and Android system Back: both return to Home. Open a lesson and both quizzes afterward to check their navigation.
- With VoiceOver/TalkBack, check the clue, word slots as one phrase, remaining mistakes, keyboard labels and result status. No answer should be announced before it is revealed.

This version is casual session play. Leaving the screen starts a fresh session on the next visit; wins and the shuffled deck last for that visit only. Existing rewards give 10 XP per eligible win, up to 30 Hangman XP per day; replaying a rewarded word on the same day does not duplicate that receipt. Daily quiz progress and lesson completion are independent. No new native dependencies or build configuration are required.

Automated tests cover Greek normalization (including final sigma, tonos and dialytika), every word's win/loss transitions, duplicate and stale taps, shuffled deck coverage, screen actions, audio requests, compact mode, safe-area padding and animation guards. Headless tests do not establish native layout or hardware audio quality; the device pass above is still required.

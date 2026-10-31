# Content reporting

This update follows the working Progress layout update. Replace matching project files from the ZIP, then run `supabase/migrations/202610300008_content_reports.sql` in the Supabase SQL Editor. No new dependencies are needed. This does not change progress, scores, authentication settings, or the temporary beta email-confirmation choice.

## Where to report

- The flag in the article reader's toolbar reports the lesson's text, sources or images.
- “Αναφορά ερώτησης” reports an individual inline checkpoint, lesson quiz question, mistake-practice question, daily question or weekly second-chance question.
- A lesson-level report is also available on its results screen.
- Reasons: possible factual/answer error, unclear wording, image issue, or other. A comment is optional except for “other”.
- Context includes the lesson/daily question ID, title, canonical question index where applicable, question wording, and a fingerprint of the content version. Shuffling or mistake-review positions do not change the canonical index.

Reports are sent only when the learner presses Submit or Retry. Opening the form does not send anything. Reports do not automatically change answers or award points; editorial review decides whether a correction is needed.

## Offline delivery and identity

A submitted report is saved locally before sending. On a failed request, timeout, or missing server migration, the form explains that delivery has not been confirmed. The same report can be retried from the form or Account → Αναφορές σε αναμονή. Closing/reopening the app preserves submitted pending reports. A successful server acknowledgement removes the pending local copy. Retry IDs are stable so a lost acknowledgement cannot create duplicate inbox rows.

Unsubmitted comments remain only in the mounted form; they are not saved across an app restart. The server receives data only after explicit Submit. Comments must not contain credentials or personal details.

Guest and account outboxes use separate local keys. Guest reports do not transfer into an account during progress import. Return to the original guest/account to resend its pending reports. The server derives ownership from the session and compares the expected owner, so an account switch cannot attach an in-flight report to the wrong account. No email address, password, verification code, selected quiz answer, or progress history is included in the report payload. A random installation/scope identifier supports basic guest rate limiting. Signed-in submissions are associated with the account user ID.

## Editorial inbox

Open **Supabase → Table Editor → content_reports**. This is a private editorial inbox, not a public feed. App roles can submit via the function but cannot read, edit, or delete reports directly. Dashboard administrators can inspect the payload and set `status` to `new`, `reviewed`, `fixed`, or `dismissed`, with an `editorial_note`.

For a readable view in SQL Editor:

```sql
select report_id, received_at, status,
       payload->'target'->>'kind' as kind,
       payload->'target'->>'itemId' as item_id,
       payload->'target'->>'title' as title,
       payload->'target'->>'questionIndex' as question_index,
       payload->'target'->>'questionText' as question,
       payload->>'reason' as reason,
       payload->>'note' as learner_note
from public.content_reports
order by received_at desc;
```

There is no automatic email/Slack notification or in-app promise of a reply. Check this inbox during beta, verify reported issues against trusted sources, then fix content in the repository. Retain only useful reports and remove obsolete reports through the administrative dashboard when no longer needed.

The server validates payload structure/length, uses idempotent immutable submissions, and limits new reports to 20 per hour per authenticated account or guest client identifier. A guest identifier can be reset/spoofed: this is a basic beta safeguard, not a strong public anti-abuse boundary. Before a broad public launch, use an edge endpoint with appropriate request throttling/CAPTCHA if anonymous reporting attracts abuse. Never ship a service-role key in the app.

## Verify on a phone

```bash
npm run typecheck
node scripts/test-content-reports.cjs
node scripts/test-reader-pilot.cjs
npx expo start -c
```

1. As a guest, open a lesson's toolbar flag and dismiss it. No report should appear in Supabase.
2. Report an individual question, selecting a reason and optionally adding a comment. Confirm the success message, and inspect `content_reports` to verify lesson/question context. Your answer/score must remain unchanged.
3. Disable connectivity, submit a report, and close/reopen the app. Visit Account: the report should be waiting. Restore connectivity and press Retry; exactly one inbox row should be created.
4. Repeat for a daily question and a weekly/practice question, checking their canonical IDs/index rather than display position.
5. Sign in/out to confirm pending guest reports stay in the guest scope and account reports stay with their account.
6. Check modal scrolling, keyboard behavior, close/Android Back, and larger text on iPhone/Android.

TypeScript, lint, real parser/outbox/form/transport tests with mocked network/native views, existing reader/quiz/progress regressions, local PostgreSQL migration checks and Android export were checked. No report was sent to your live Supabase project during automated validation. Native presentation and live migration/delivery still need the phone test above.

After reporting is verified, the next beta task is the focused content and phone review. This update does not claim that editorial review of every article has been completed.

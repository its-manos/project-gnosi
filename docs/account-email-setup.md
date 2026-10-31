# Account email configuration and beta acceptance

The mobile app uses email/password signup followed by an email code entered inside the app (`verifyOtp`, type `email`). No browser redirect or app deep link is involved in this confirmation flow. The app changes do not automatically update the hosted Supabase email template or sender settings.

## Required hosted settings

In the same Supabase project configured in the app:

1. Under Authentication, ensure email/password sign-in and new user signup are enabled. Keep email confirmation enabled.
2. Under Authentication → Email / SMTP settings, configure a **custom SMTP sender** with the provider credentials and a sender address/domain the provider has verified. Supabase's default sender is intended for testing by project-team members and refuses other recipient addresses. Do not add beta testers to the Supabase project team as a workaround. Provider sandbox restrictions must also be lifted if that provider restricts test recipients.
3. Under Authentication → Email Templates → Confirm signup, use the subject **Επιβεβαίωσε το email σου στη ΓΝΩΣΗ** and replace the body with the full contents of `supabase/templates/confirm-signup.html`. The `{{ .Token }}` placeholder must remain exactly as written. Save the template. It intentionally has no confirmation link.
4. Check the authentication email rate limits and the email provider's sending limits before inviting a group. The app's resend cooldown is 60 seconds; it does not bypass server limits. Keep the project's configured OTP expiration in mind; the template does not promise a hardcoded expiry.
5. Ensure the distributed app/build has its own `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` build environment configured. Local `.env` values are not a substitute for the remote build configuration. Use the project's public publishable key only. SMTP credentials and service-role keys belong only in server/provider settings.

This confirmation-code path does not need a custom app URL scheme, localhost redirect, or a running laptop. Other auth flows (password reset, magic links, OAuth) need their own configuration before being offered; this update does not introduce them. Leave existing unrelated templates alone.

## Real phone acceptance test — required before inviting friends

Use an address that is **not** a member of the Supabase project team:

1. Open the account icon on Home, or Progress → Ο λογαριασμός μου.
2. Create an account. Receive the Greek email with a numeric code, without any localhost link.
3. Copy the code into the app. Check that the app becomes signed in, with the correct email on the account screen, and cloud sync succeeds. An invalid/expired code should leave a usable retry/resend path.
4. Close and reopen the app: sign-in should persist. If you leave before verification, the app remembers only the pending email address and can resume confirmation.
5. Sign out, then sign in with the same email/password. If an older account was never confirmed, sign-in offers the verification screen, where a new code can be requested.
6. If there is guest progress, explicitly preview/import it from Account → Η πρόοδός σου. Account progress must remain separate until this import.
7. Try a second device/build with the account to confirm cross-device progress.

If email never arrives, check Supabase Auth logs and the provider's delivery logs, SMTP/domain verification, recipient restrictions and rate limits. App code cannot repair a blocked SMTP sender. Never paste credentials, verification codes or session tokens into bug reports.

## App/navigation polish in this update

- Dedicated account page and Home profile icon; Progress leads to it with a compact account row.
- Confirmation instructions consistently use an in-app code. Paste/one-time-code autofill, resend cooldown, wrong-email correction, expired-code errors, and unconfirmed-account sign-in recovery.
- Optional email-only memory for unfinished confirmation; no passwords/codes saved by this helper.
- Account backup tools collapsed until requested; database diagnostics appear only in development.
- Normal saved/guest sync status is quiet on Home, Progress and weekly quizzes; errors/retries stay visible. Account retains detailed sync/import controls.
- Weekly card omitted on Home when there are no available questions; the explanatory card remains in Progress.
- Consistent pressed feedback on primary/secondary buttons and quiz answers, larger back touch targets and tab selection through results/reviews/account screens.
- Reader Back returns to its entry screen (Search, Saved, Home or a category), with the existing unfinished-attempt warning. Android system Back uses the same guard and exits normally only from Home.

No database migration or dependency installation is needed for this update. Replace the matching project files from the ZIP, then run:

```bash
npm run typecheck
node scripts/test-account-panel.cjs
node scripts/test-welcome.cjs
npx expo start -c
```

Auth requests and native screens were tested with mocks, and the Android export was checked. SMTP delivery, live Supabase settings, iPhone/Android layout, keyboard behavior and large-text rendering still need real-device acceptance. No live accounts or emails were created during automated checks.

## Official references

- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/reference/javascript/auth-verifyotp
- https://reactnative.dev/docs/backhandler

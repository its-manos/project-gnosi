import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import ActionButton from './ActionButton';
import CloudBackupPanel, { type BackupControls } from './CloudBackupPanel';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';

function friendlyError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'PGRST205' || code === '42P01') return 'Δεν βρέθηκε ο πίνακας προφίλ. Έλεγξε ότι έτρεξε η SQL migration στο σωστό Supabase project.';
  if (code === '42501') return 'Η βάση αρνήθηκε την πρόσβαση. Έλεγξε τα δικαιώματα και τις πολιτικές RLS της migration.';
  if (code === 'signup_disabled') return 'Η εγγραφή χρηστών δεν είναι ενεργοποιημένη στο Supabase project.';
  if (code === 'invalid_credentials') return 'Το email ή ο κωδικός δεν είναι σωστός.';
  if (code === 'email_not_confirmed') return 'Επιβεβαίωσε πρώτα το email σου από το μήνυμα εγγραφής.';
  if (code === 'otp_expired') return 'Ο κωδικός επιβεβαίωσης έληξε ή δεν είναι σωστός. Ζήτησε νέο κωδικό.';
  if (code === 'weak_password') return 'Διάλεξε ισχυρότερο κωδικό σύμφωνα με τις απαιτήσεις του λογαριασμού.';
  if (code === 'user_already_exists') return 'Δοκίμασε σύνδεση με το email σου.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') return 'Έγιναν πολλές προσπάθειες. Περίμενε λίγο και ξαναδοκίμασε.';
  return 'Η ενέργεια δεν ολοκληρώθηκε. Έλεγξε τη σύνδεση στο διαδίκτυο και τις ρυθμίσεις Supabase και ξαναδοκίμασε.';
}

/** Optional account with explicit, additive cloud backup/restore. */
export default function AccountPanel({ backupControls }: { backupControls?: BackupControls } = {}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'verify'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const mounted = useRef(false);
  const requestLock = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const client = supabase;
    if (!client) return () => { mounted.current = false; };
    let authEventReceived = false;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      authEventReceived = true;
      if (!mounted.current) return;
      setSession(next);
      setLoading(false);
      setPassword('');
      setToken('');
      setMessage('');
      setError('');
    });
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted.current || authEventReceived) return;
      if (sessionError) setError(friendlyError(sessionError));
      else setSession(data.session);
      setLoading(false);
    }).catch((reason: unknown) => {
      if (mounted.current && !authEventReceived) {
        setError(friendlyError(reason));
        setLoading(false);
      }
    });
    return () => { mounted.current = false; subscription.unsubscribe(); };
  }, []);

  async function run(action: () => Promise<void>) {
    if (requestLock.current) return;
    requestLock.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try { await action(); }
    catch (reason) { if (mounted.current) setError(friendlyError(reason)); }
    finally {
      requestLock.current = false;
      if (mounted.current) { setBusy(false); setPassword(''); }
    }
  }

  function submit() {
    const client = supabase;
    if (!client) return;
    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Συμπλήρωσε ένα έγκυρο email.'); return;
    }
    if (password.length < (mode === 'signup' ? 8 : 1)) {
      setError(mode === 'signup' ? 'Χρησιμοποίησε τουλάχιστον 8 χαρακτήρες για τον κωδικό.' : 'Συμπλήρωσε τον κωδικό σου.'); return;
    }
    void run(async () => {
      if (mode === 'signup') {
        const { data, error: signupError } = await client.auth.signUp({ email: cleanEmail, password });
        if (signupError) throw signupError;
        if (!mounted.current) return;
        if (!data.session) {
          setConfirmationEmail(cleanEmail);
          setMode('verify');
          setMessage('Αν μπορεί να γίνει εγγραφή με αυτό το email, θα λάβεις μήνυμα επιβεβαίωσης. Συμπλήρωσε τον κωδικό του μηνύματος ή επιβεβαίωσε από τον σύνδεσμο και μετά συνδέσου.');
        }
      } else {
        const { error: signinError } = await client.auth.signInWithPassword({ email: cleanEmail, password });
        if (signinError) throw signinError;
      }
    });
  }

  const notice = <View accessibilityLiveRegion="polite">
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {message ? <Text style={styles.body}>{message}</Text> : null}
    {busy ? <ActivityIndicator color={colors.accentLight} accessibilityLabel="Επεξεργασία αιτήματος" /> : null}
  </View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.card}>
      <Text style={styles.title}>Λογαριασμός</Text>
      <Text style={styles.body}>Η σύνδεση είναι προαιρετική. Μπορείς να αποθηκεύσεις αντίγραφο προόδου στον λογαριασμό και να το επαναφέρεις σε άλλη συσκευή. Η σύνδεση από μόνη της δεν μεταφέρει ή διαγράφει δεδομένα.</Text>
      {!supabase ? <Text style={styles.error}>Δεν έχει ρυθμιστεί η σύνδεση Supabase. Έλεγξε τις EXPO_PUBLIC_SUPABASE_URL και EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY στο .env και επανεκκίνησε το Expo. Μπορείς να συνεχίσεις να μαθαίνεις χωρίς λογαριασμό.</Text>
        : loading ? <ActivityIndicator color={colors.accentLight} />
        : session ? <>
          <Text style={styles.label}>Συνδεδεμένος ως</Text>
          <Text selectable style={styles.email}>{session.user.email ?? 'Χρήστης'}</Text>
          <ActionButton label="Έλεγχος σύνδεσης με τη βάση" disabled={busy} secondary onPress={() => {
            void run(async () => {
              const client = supabase!;
              // Never overwrite an existing profile. Both operations are subject to RLS.
              const { error: insertError } = await client.from('profiles').upsert({ user_id: session.user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
              if (insertError) throw insertError;
              const { data, error: readError } = await client.from('profiles').select('user_id').eq('user_id', session.user.id).single();
              if (readError) throw readError;
              if (data.user_id !== session.user.id) throw new Error('Profile mismatch');
              if (mounted.current) setMessage('Η σύνδεση με τη βάση λειτουργεί. Το προφίλ σου είναι διαθέσιμο. Χρησιμοποίησε τα κουμπιά αντιγράφου για να μεταφέρεις την πρόοδό σου.');
            });
          }} />
          {backupControls ? <CloudBackupPanel key={session.user.id} userId={session.user.id} {...backupControls} onBusyChange={setBusy} /> : <Text style={styles.body}>Περίμενε να φορτωθεί η τοπική πρόοδος για να χρησιμοποιήσεις τα αντίγραφα.</Text>}
          <ActionButton label="Αποσύνδεση από αυτή τη συσκευή" disabled={busy} onPress={() => {
            void run(async () => {
              const { error: signoutError } = await supabase!.auth.signOut({ scope: 'local' });
              if (signoutError) throw signoutError;
              if (mounted.current) { setMode('signin'); setEmail(''); setConfirmationEmail(''); }
            });
          }} />
        </> : mode === 'verify' ? <>
          <Text style={styles.label}>Επιβεβαίωση email: {confirmationEmail}</Text>
          <TextInput accessibilityLabel="Κωδικός επιβεβαίωσης email" placeholder="Κωδικός από το email" placeholderTextColor={colors.textMuted} value={token} onChangeText={setToken} keyboardType="number-pad" autoComplete="one-time-code" editable={!busy} style={styles.input} />
          <ActionButton label="Επιβεβαίωση email" disabled={busy || !token.trim()} onPress={() => {
            void run(async () => {
              const { error: verifyError } = await supabase!.auth.verifyOtp({ email: confirmationEmail, token: token.trim(), type: 'email' });
              if (verifyError) throw verifyError;
            });
          }} />
          <ActionButton label="Αποστολή νέου κωδικού" disabled={busy} secondary onPress={() => {
            void run(async () => {
              const { error: resendError } = await supabase!.auth.resend({ type: 'signup', email: confirmationEmail });
              if (resendError) throw resendError;
              if (mounted.current) setMessage('Αν εκκρεμεί επιβεβαίωση, θα λάβεις νέο μήνυμα. Έλεγξε και την ανεπιθύμητη αλληλογραφία.');
            });
          }} />
          <ActionButton label="Επιστροφή στη σύνδεση" disabled={busy} secondary onPress={() => { setMode('signin'); setToken(''); setError(''); setMessage(''); }} />
        </> : <>
          <Text style={styles.label}>{mode === 'signup' ? 'Δημιουργία λογαριασμού' : 'Σύνδεση με email'}</Text>
          <TextInput accessibilityLabel="Email" placeholder="Email" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} style={styles.input} />
          <TextInput accessibilityLabel="Κωδικός πρόσβασης" placeholder={mode === 'signup' ? 'Κωδικός — τουλάχιστον 8 χαρακτήρες' : 'Κωδικός πρόσβασης'} placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} autoCapitalize="none" autoCorrect={false} secureTextEntry autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} editable={!busy} style={styles.input} />
          <ActionButton label={mode === 'signup' ? 'Δημιουργία λογαριασμού' : 'Σύνδεση'} disabled={busy} onPress={submit} />
          <ActionButton label={mode === 'signup' ? 'Έχω ήδη λογαριασμό' : 'Δεν έχω λογαριασμό — Εγγραφή'} disabled={busy} secondary onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setPassword(''); setError(''); setMessage(''); }} />
        </>}
      {notice}
      <Text style={styles.note}>Μπορείς να συνεχίσεις από τις καρτέλες στο κάτω μέρος χωρίς να συνδεθείς.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface, gap: 12, marginVertical: 18 },
  title: { color: colors.text, fontSize: 23, fontWeight: '800' },
  label: { color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: '700' },
  body: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  email: { color: colors.accentLight, fontSize: 15 },
  input: { color: colors.text, backgroundColor: colors.background, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, minHeight: 52, fontSize: 14 },
  error: { color: colors.error, fontSize: 13, lineHeight: 21 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
});

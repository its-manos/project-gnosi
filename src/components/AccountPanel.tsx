import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import ActionButton from './ActionButton';
import CloudBackupPanel, { type BackupControls } from './CloudBackupPanel';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import { pendingSignup, rememberSignup, validEmail } from '../utils/pendingSignup';

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
  if (code === 'email_address_not_authorized' || code === 'unexpected_failure') return 'Δεν ήταν δυνατή η αποστολή email. Δοκίμασε αργότερα· μπορείς να συνεχίσεις ως επισκέπτης.';
  return 'Η ενέργεια δεν ολοκληρώθηκε. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.';
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
  const [showPassword, setShowPassword] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [resendAfter, setResendAfter] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const mounted = useRef(false);
  const requestLock = useRef(false);
  const touched = useRef(false);

  useEffect(() => {
    if (!resendAfter) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAfter]);
  const resendSeconds = Math.max(0, Math.ceil((resendAfter - now) / 1000));

  useEffect(() => {
    mounted.current = true;
    const client = supabase;
    if (!client) return () => { mounted.current = false; };
    let authEventReceived = false;
    let signedIn = false;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      authEventReceived = true;
      signedIn = Boolean(next);
      if (!mounted.current) return;
      setSession(next);
      setLoading(false);
      setPassword('');
      setToken('');
      setMessage('');
      setError('');
      if (next) void rememberSignup(null);
    });
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted.current || authEventReceived) return;
      if (sessionError) setError(friendlyError(sessionError));
      else { signedIn = Boolean(data.session); setSession(data.session); if (data.session) void rememberSignup(null); }
      setLoading(false);
    }).catch((reason: unknown) => {
      if (mounted.current && !authEventReceived) {
        setError(friendlyError(reason));
        setLoading(false);
      }
    });
    void pendingSignup().then(address => {
      if (!mounted.current || signedIn || touched.current || !address) return;
      setEmail(address); setConfirmationEmail(address); setMode('verify');
      setMessage('Έχεις μια εγγραφή σε αναμονή. Βάλε τον κωδικό του email σου ή ζήτησε έναν νέο.');
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
    touched.current = true;
    if (!validEmail(cleanEmail)) {
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
          void rememberSignup(cleanEmail);
          setResendAfter(Date.now() + 60_000); setNow(Date.now());
          setMessage('Αν μπορεί να γίνει εγγραφή με αυτό το email, θα λάβεις έναν κωδικό. Αντέγραψέ τον εδώ για να επιβεβαιώσεις το email σου.');
        }
      } else {
        const { error: signinError } = await client.auth.signInWithPassword({ email: cleanEmail, password });
        if (signinError?.code === 'email_not_confirmed') {
          setConfirmationEmail(cleanEmail); setMode('verify'); void rememberSignup(cleanEmail);
          setMessage('Το email δεν έχει επιβεβαιωθεί ακόμη. Βάλε τον κωδικό σου ή ζήτησε έναν νέο παρακάτω.');
        } else if (signinError) throw signinError;
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
      <Text style={styles.eyebrow}>{session ? 'Η ΔΙΚΗ ΣΟΥ ΔΙΑΔΡΟΜΗ' : mode === 'verify' ? 'ΕΝΑ ΤΕΛΕΥΤΑΙΟ ΒΗΜΑ' : 'Η ΓΝΩΣΗ ΣΟΥ, ΜΑΖΙ ΣΟΥ'}</Text>
      <Text style={styles.title}>{session ? 'Καλώς επέστρεψες' : mode === 'verify' ? 'Δες το email σου' : mode === 'signup' ? 'Κράτησε όσα μαθαίνεις' : 'Συνέχισε τη διαδρομή σου'}</Text>
      <Text style={styles.body}>{session ? 'Τα μαθήματα, τα αποθηκευμένα άρθρα και οι προκλήσεις σου συγχρονίζονται όταν υπάρχει σύνδεση.' : 'Συνδέσου για να κρατάς την πρόοδό σου σε όλες τις συσκευές σου.'}</Text>
      {!supabase ? <Text style={styles.error}>Η σύνδεση λογαριασμού δεν είναι διαθέσιμη ακόμη. Μπορείς να συνεχίσεις να μαθαίνεις ως επισκέπτης.{__DEV__ ? ' Έλεγξε τη ρύθμιση Supabase στο .env και επανεκκίνησε το Expo.' : ''}</Text>
        : loading ? <ActivityIndicator color={colors.accentLight} />
        : session ? <>
          <Text style={styles.label}>Συνδεδεμένος ως</Text>
          <Text selectable style={styles.email}>{session.user.email ?? 'Χρήστης'}</Text>
          {__DEV__ ? <ActionButton label="Έλεγχος σύνδεσης με τη βάση" disabled={busy} secondary onPress={() => {
            void run(async () => {
              const client = supabase!;
              // Never overwrite an existing profile. Both operations are subject to RLS.
              const { error: insertError } = await client.from('profiles').upsert({ user_id: session.user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
              if (insertError) throw insertError;
              const { data, error: readError } = await client.from('profiles').select('user_id').eq('user_id', session.user.id).single();
              if (readError) throw readError;
              if (data.user_id !== session.user.id) throw new Error('Profile mismatch');
              if (mounted.current) setMessage('Η σύνδεση με τη βάση λειτουργεί. Το προφίλ σου είναι διαθέσιμο. Ο αυτόματος συγχρονισμός εκτελείται όταν υπάρχει σύνδεση.');
            });
          }} /> : null}
          <ActionButton label={advanced ? 'Απόκρυψη εργαλείων αντιγράφου' : 'Αντίγραφο ασφαλείας & επαναφορά'} secondary disabled={busy} onPress={() => setAdvanced(value => !value)} />
          {advanced ? backupControls ? <CloudBackupPanel key={session.user.id} userId={session.user.id} {...backupControls} onBusyChange={setBusy} /> : <Text style={styles.body}>Περίμενε να φορτωθεί η τοπική πρόοδος για να χρησιμοποιήσεις τα αντίγραφα.</Text> : null}
          <ActionButton label="Αποσύνδεση από αυτή τη συσκευή" disabled={busy} onPress={() => {
            void run(async () => {
              const { error: signoutError } = await supabase!.auth.signOut({ scope: 'local' });
              if (signoutError) throw signoutError;
              if (mounted.current) { setMode('signin'); setEmail(''); setConfirmationEmail(''); }
            });
          }} />
        </> : mode === 'verify' ? <>
          <Text style={styles.label}>Επιβεβαίωση email: {confirmationEmail}</Text>
          <Text style={styles.body}>Άνοιξε το μήνυμα της ΓΝΩΣΗΣ και βάλε τον κωδικό εδώ. Δεν χρειάζεται να ανοίξεις σύνδεσμο. Έλεγξε και τα ανεπιθύμητα.</Text>
          <TextInput accessibilityLabel="Κωδικός επιβεβαίωσης email" placeholder="Κωδικός από το email" placeholderTextColor={colors.textMuted} value={token} onChangeText={value => setToken(value.replace(/\s/g, ''))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" editable={!busy} style={[styles.input, styles.codeInput]} />
          <ActionButton label="Επιβεβαίωση email" disabled={busy || !token.trim()} onPress={() => {
            if (!/^[0-9]{6,10}$/.test(token.trim())) { setError('Βάλε ολόκληρο τον αριθμητικό κωδικό από το email.'); return; }
            void run(async () => {
              const { error: verifyError } = await supabase!.auth.verifyOtp({ email: confirmationEmail, token: token.trim(), type: 'email' });
              if (verifyError) throw verifyError;
            });
          }} />
          <ActionButton label={resendSeconds ? `Νέος κωδικός σε ${resendSeconds}″` : 'Αποστολή νέου κωδικού'} disabled={busy || resendSeconds > 0} secondary onPress={() => {
            if (resendSeconds > 0) return;
            void run(async () => {
              const { error: resendError } = await supabase!.auth.resend({ type: 'signup', email: confirmationEmail });
              if (resendError) throw resendError;
              if (mounted.current) { setResendAfter(Date.now() + 60_000); setNow(Date.now()); }
              if (mounted.current) setMessage('Αν εκκρεμεί επιβεβαίωση, θα λάβεις νέο μήνυμα. Έλεγξε και την ανεπιθύμητη αλληλογραφία.');
            });
          }} />
          <ActionButton label="Επιστροφή στη σύνδεση" disabled={busy} secondary onPress={() => { setMode('signin'); setToken(''); setError(''); setMessage(''); }} />
          <ActionButton label="Χρησιμοποίησα λάθος email" disabled={busy} secondary onPress={() => { touched.current = true; void rememberSignup(null); setMode('signup'); setToken(''); setConfirmationEmail(''); setError(''); setMessage(''); setResendAfter(0); }} />
        </> : <>
          <Text style={styles.label}>{mode === 'signup' ? 'Δημιουργία λογαριασμού' : 'Σύνδεση με email'}</Text>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput accessibilityLabel="Email" placeholder="to-email-sou@example.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={value => { touched.current = true; setEmail(value); }} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} style={styles.input} />
          <View style={styles.passwordLabel}><Text style={styles.fieldLabel}>Κωδικός πρόσβασης</Text><Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'} style={styles.passwordToggle} onPress={() => setShowPassword(value => !value)}><Text style={styles.toggleText}>{showPassword ? 'Απόκρυψη' : 'Εμφάνιση'}</Text></Pressable></View>
          <TextInput accessibilityLabel="Κωδικός πρόσβασης" placeholder={mode === 'signup' ? 'Τουλάχιστον 8 χαρακτήρες' : 'Ο κωδικός σου'} placeholderTextColor={colors.textMuted} value={password} onChangeText={value => { touched.current = true; setPassword(value); }} autoCapitalize="none" autoCorrect={false} secureTextEntry={!showPassword} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} editable={!busy} style={styles.input} />
          <ActionButton label={mode === 'signup' ? 'Δημιουργία λογαριασμού' : 'Σύνδεση'} disabled={busy} onPress={submit} />
          <ActionButton label={mode === 'signup' ? 'Έχω ήδη λογαριασμό' : 'Δεν έχω λογαριασμό — Εγγραφή'} disabled={busy} secondary onPress={() => { touched.current = true; setMode(mode === 'signin' ? 'signup' : 'signin'); setPassword(''); setShowPassword(false); setError(''); setMessage(''); }} />
        </>}
      {notice}
      <Text style={styles.note}>Ο λογαριασμός είναι προαιρετικός.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.accentLight, fontSize: 10, lineHeight: 18, letterSpacing: 1.1, fontWeight: '800' },
  fieldLabel: { color: colors.textBody, fontSize: 12, lineHeight: 20, fontWeight: '700' },
  passwordLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  passwordToggle: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  toggleText: { color: colors.accentLight, fontSize: 12 },
  codeInput: { fontSize: 24, letterSpacing: 5, textAlign: 'center', fontWeight: '700' },
  card: { padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface, gap: 12, marginVertical: 18 },
  title: { color: colors.text, fontSize: 23, fontWeight: '800' },
  label: { color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: '700' },
  body: { color: colors.textBody, fontSize: 13, lineHeight: 21 },
  email: { color: colors.accentLight, fontSize: 15 },
  input: { color: colors.text, backgroundColor: colors.background, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, minHeight: 52, fontSize: 14 },
  error: { color: colors.error, fontSize: 13, lineHeight: 21 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
});

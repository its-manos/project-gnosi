import AsyncStorage from "@react-native-async-storage/async-storage";

const key = "@gnosi/pending-signup-email";
export const validEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// Remember only the address, never passwords, verification codes or sessions.
export async function pendingSignup(): Promise<string | null> {
  try { const value = await AsyncStorage.getItem(key); return value && validEmail(value) ? value : null; }
  catch { return null; }
}
export async function rememberSignup(email: string | null): Promise<void> {
  try { if (email && validEmail(email)) await AsyncStorage.setItem(key, email); else await AsyncStorage.removeItem(key); }
  catch { /* Signup still works if this optional navigation convenience cannot be saved. */ }
}

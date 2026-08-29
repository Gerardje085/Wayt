// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Settings Store
// Manages user preferences such as default rest time between sets.
// ─────────────────────────────────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_REST_KEY = '@wayt_default_rest_time';
export const STANDAARD_RUST_TIJD = 90; // Standaard 90 seconden

export async function getDefaultRestTime(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(DEFAULT_REST_KEY);
    if (val !== null) {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch (err) {
    console.warn('Fout bij ophalen standaard rusttijd:', err);
  }
  return STANDAARD_RUST_TIJD;
}

export async function setDefaultRestTime(seconds: number): Promise<void> {
  try {
    const sec = Math.max(5, Math.min(600, Math.round(seconds)));
    await AsyncStorage.setItem(DEFAULT_REST_KEY, String(sec));
  } catch (err) {
    console.warn('Fout bij opslaan standaard rusttijd:', err);
  }
}

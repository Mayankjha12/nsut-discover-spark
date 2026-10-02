import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_ROLL = "nsut_hub_roll";
const KEY_PASSWORD = "nsut_hub_pw";
const KEY_PROFILE = "nsut_hub_profile";
const KEY_ATTENDANCE = "nsut_hub_attendance";
const KEY_SESSION_COOKIE = "nsut_hub_session_cookie";

type Store = {
  getItemAsync: (k: string) => Promise<string | null>;
  setItemAsync: (k: string, v: string) => Promise<void>;
  deleteItemAsync: (k: string) => Promise<void>;
};

const nativeStore: Store = {
  getItemAsync: (k) => SecureStore.getItemAsync(k),
  setItemAsync: (k, v) => SecureStore.setItemAsync(k, v),
  deleteItemAsync: (k) => SecureStore.deleteItemAsync(k),
};

const webStore: Store = {
  getItemAsync: async (k) => (await AsyncStorage.getItem(k)) ?? null,
  setItemAsync: async (k, v) => AsyncStorage.setItem(k, v),
  deleteItemAsync: async (k) => AsyncStorage.removeItem(k),
};

const store: Store = Platform.OS === "web" ? webStore : nativeStore;

export const storage = {
  async getRollAndPassword() {
    const [roll, pw] = await Promise.all([
      store.getItemAsync(KEY_ROLL),
      store.getItemAsync(KEY_PASSWORD),
    ]);
    return { roll, password: pw };
  },
  async setRollAndPassword(roll: string, password: string) {
    await Promise.all([
      store.setItemAsync(KEY_ROLL, roll),
      store.setItemAsync(KEY_PASSWORD, password),
    ]);
  },
  async clear() {
    await Promise.all([
      store.deleteItemAsync(KEY_ROLL),
      store.deleteItemAsync(KEY_PASSWORD),
      store.deleteItemAsync(KEY_PROFILE),
      store.deleteItemAsync(KEY_ATTENDANCE),
      store.deleteItemAsync(KEY_SESSION_COOKIE),
    ]);
  },
  async getProfile(): Promise<any | null> {
    const s = await store.getItemAsync(KEY_PROFILE);
    return s ? JSON.parse(s) : null;
  },
  async setProfile(p: any) {
    await store.setItemAsync(KEY_PROFILE, JSON.stringify(p));
  },
  async getAttendance(): Promise<any | null> {
    const s = await store.getItemAsync(KEY_ATTENDANCE);
    return s ? JSON.parse(s) : null;
  },
  async setAttendance(a: any) {
    await store.setItemAsync(KEY_ATTENDANCE, JSON.stringify(a));
  },
};

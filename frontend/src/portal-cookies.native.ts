import CookieManager from '@preeternal/react-native-cookie-manager';
import { Platform } from 'react-native';
export async function clearPortalCookies() {
  await CookieManager.clearAllStores();
  await flushPortalCookies();
}
export async function flushPortalCookies() {
  if (Platform.OS === 'android') await CookieManager.flush();
}

import * as SecureStore from 'expo-secure-store';

const SETTING_KEY = 'onboardingSeen';

export async function isOnboardingSeen(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(SETTING_KEY);
  return value === 'true';
}

export async function markOnboardingSeen(): Promise<void> {
  await SecureStore.setItemAsync(SETTING_KEY, 'true');
}

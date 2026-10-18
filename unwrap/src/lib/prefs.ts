// Küçük tercih bayrakları (karşılama görüldü mü vb.).
import * as SecureStore from 'expo-secure-store';

const ONBOARDED = 'unwrap.onboarded';

export const hasOnboarded = () => SecureStore.getItem(ONBOARDED) === '1';
export const setOnboarded = () => SecureStore.setItem(ONBOARDED, '1');

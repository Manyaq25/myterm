import { Platform, Switch, type SwitchProps } from 'react-native';

// iOS/Android'in kendi sistem "açık" rengi — markanın teal'i yerine, kullanıcının
// zaten bildiği platform varsayılanı (iOS yeşili / Android mavisi).
const IOS_ON = '#34C759';
const ANDROID_ON = '#4285F4';

export function ThemedSwitch(props: SwitchProps) {
  const onColor = Platform.OS === 'ios' ? IOS_ON : ANDROID_ON;
  return (
    <Switch
      {...props}
      trackColor={{ false: Platform.OS === 'ios' ? undefined : '#B0B7C3', true: onColor }}
      thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      ios_backgroundColor="#E5E5EA"
    />
  );
}

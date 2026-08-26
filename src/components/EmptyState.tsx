import { StyleSheet, Text, View } from 'react-native';

export function EmptyState({
  title,
  subtitle,
  icon = '🗒️',
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

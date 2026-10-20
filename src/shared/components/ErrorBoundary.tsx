import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from './PrimaryButton';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error);
    try {
      const { writeLog } = require('@/core/services/logService') as typeof import('@/core/services/logService');
      writeLog('boundary', 'unexpected error', error);
    } catch {
      // ignore
    }
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.wrapper}>
          <Text style={styles.title}>Terjadi kesalahan yang tidak terduga.</Text>
          <Text style={styles.subtitle}>Data Anda tetap tersimpan. Silakan muat ulang halaman ini.</Text>
          <PrimaryButton label="Coba Lagi" onPress={() => this.setState({ hasError: false })} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14, backgroundColor: '#121212' },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#9AA7B4', fontSize: 13, textAlign: 'center', marginBottom: 8 },
});

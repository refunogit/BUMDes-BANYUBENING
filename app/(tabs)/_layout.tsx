import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';

import { BottomTabBar } from '@/shared/components/BottomTabBar';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';

export default function TabsLayout(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const [exitVisible, setExitVisible] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pathname !== '/' && pathname !== '/(tabs)') {
        router.navigate('/');
        return true;
      }
      setExitVisible(true);
      return true;
    });
    return () => subscription.remove();
  }, [pathname, router]);

  return (
    <>
      <Tabs
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="produk" options={{ title: 'Produk' }} />
        <Tabs.Screen name="riwayat" options={{ title: 'Riwayat' }} />
        <Tabs.Screen name="pengaturan" options={{ title: 'Pengaturan' }} />
      </Tabs>
      <ConfirmDialog
        visible={exitVisible}
        title="Keluar Aplikasi?"
        message="Yakin ingin keluar dari aplikasi?"
        confirmLabel="Keluar"
        cancelLabel="Batal"
        destructive
        onCancel={() => setExitVisible(false)}
        onConfirm={() => {
          setExitVisible(false);
          BackHandler.exitApp();
        }}
      />
    </>
  );
}

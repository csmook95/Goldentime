import { Stack } from "expo-router";

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

export default function RootLayout() {
  return <GluestackUIProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="main_backup" />
      <Stack.Screen name="main" />
      <Stack.Screen name="result" />
      <Stack.Screen name="ktas" />
      <Stack.Screen name="qr" />
    </Stack>
  </GluestackUIProvider>
}

import { Stack } from "expo-router";

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

export default function RootLayout() {
  return <GluestackUIProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="main_backup" options={{ headerShown: false }} />
              <Stack.Screen name="main" options={{ headerShown: false }} />
              <Stack.Screen name="result" options={{ headerShown: false }} />
              <Stack.Screen name="ktas" options={{ headerShown: false }} />
              <Stack.Screen name="qr" options={{ headerShown: false }} />
            </Stack>
  </GluestackUIProvider>
}

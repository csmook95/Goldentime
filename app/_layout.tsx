import { Stack } from "expo-router";

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

export default function RootLayout() {
  return <GluestackUIProvider>
    <Stack >
      <Stack.Screen name="index" options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="result" options={{ headerShown: false }}></Stack.Screen>
    </Stack>
  </GluestackUIProvider>
}

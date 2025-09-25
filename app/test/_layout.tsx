import { Stack } from "expo-router";

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

export default function RootLayout() {
  return <GluestackUIProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="xmlParser1" options={{ headerShown: false }} />
    </Stack>
  </GluestackUIProvider>
}

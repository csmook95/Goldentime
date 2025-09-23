import { Camera } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface CameraIconProps {
  size?: number;
  color?: string;
}

export default function CameraIcon({ size = 20, color = "#5f6368" }: CameraIconProps) {
  return (
    <View style={styles.container}>
      <Camera size={size} color={color} strokeWidth={1.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

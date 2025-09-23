import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

type Props = { text: string; maxWidth?: number };

export default function Disclaimer({ text, maxWidth = 560 }: Props) {
  const normalized = (text ?? "")
    .replace(/&#10;/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  return (
    <View style={[styles.wrap, { maxWidth }]}>
      <Text
        style={[
          styles.txt,
          Platform.select({ web: { whiteSpace: "pre-line" } })
        ]}
        numberOfLines={3}
        ellipsizeMode="tail"
      >
        {normalized}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 0,
    width: "100%",
  },
  txt: {
    fontSize: 12,
    lineHeight: 18,     // 줄간격 고정
    color: '#5f6368',
    textAlign: "center",
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 0,
  },
});

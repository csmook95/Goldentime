import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { DimensionValue, Platform, StyleSheet, Text, View } from "react-native";


export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // 라우터가 준비된 후 메인 화면으로 이동
    const timer = setTimeout(() => {
      router.replace("/main_backup");
    }, 100); // 짧은 딜레이로 라우터 초기화 대기

    return () => clearTimeout(timer);
  }, [router]);

  // 로딩 중일 때 보여줄 간단한 화면
  return (
    <View style={s.wrap}>
      <Text style={s.loading}>로딩 중...</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: "#ADD8E6",
    ...Platform.select({
      web: { minHeight: "100vh" as DimensionValue },
      default: { flex: 1 }
    }),
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loading: {
    fontSize: 18,
    color: "#44515B",
    textAlign: "center",
  },
});

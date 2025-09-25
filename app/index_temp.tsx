import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";

const BG = "#ADD8E6";   // 라이트 블루
const LOGO = "#A85B2C"; // 로고 색

function pickLogo() {
  try {
    return require("../assets/images/logo.png");
  } catch (error) {
    // console.log("logo.png를 찾을 수 없습니다:", error);
  }

  try {
    return require("../assets/images/golden Time LOGO.png");
  } catch (error) {
    // console.log("golden Time LOGO.png를 찾을 수 없습니다:", error);
  }

  // 기본 아이콘들도 시도
  try {
    return require("../assets/images/icon.png");
  } catch (error) {
    // console.log("icon.png를 찾을 수 없습니다:", error);
  }

  // console.log("로고를 찾을 수 없습니다.");
  return null;
}

export default function Intro() {
  const router = useRouter();
  const logoSource = pickLogo();

  useEffect(() => {
    // 3초 후 자동으로 메인 화면으로 이동 (로고를 좀 더 오래 보여주기)
    const timer = setTimeout(() => {
      router.replace("/main");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={s.wrap}>
      {logoSource ? (
        <Image
          source={logoSource}
          style={s.logo}
          resizeMode="contain"
        />
      ) : (
        <View style={s.textLogo}>
          <Text style={s.logoText}>G</Text>
        </View>
      )}
      <Text style={s.title}>GOLDEN TIME</Text>
      <Text style={s.subtitle}>AI 응급의료 진단</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: BG,
    ...Platform.select({ web: { minHeight: "100vh" }, default: { flex: 1 } }),
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    // tintColor 제거 - 원본 색상 사용
  },
  textLogo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: LOGO,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: Platform.select({
      ios: 'Arial Black',
      android: 'sans-serif-black',
      default: 'Arial Black'
    }),
  },
  title: {
    marginTop: 12,
    fontSize: 32, fontWeight: "700", letterSpacing: 1,
    color: LOGO, textAlign: "center",
  },
  subtitle: {
    marginTop: 6, fontSize: 16, color: "#44515B", opacity: 0.85, textAlign: "center",
  },
});

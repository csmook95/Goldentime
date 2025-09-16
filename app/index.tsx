import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { GestureResponderEvent, StyleSheet, View } from "react-native";

// 응급 상황에 대한 증상을 입력받아 AI 진단 및 주변 병원 정보를 제공하는 메인 화면 컴포넌트
export default function Index() {
  const router = useRouter(); // 라우터 객체 초기화

  // 현재 위치 정보를 저장하는 상태
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  // 사용자가 입력한 증상 텍스트를 저장하는 상태
  const [content, setContent] = useState<string>("오른쪽 아랫배가 아픕니다.");

  // 컴포넌트 마운트 시 현재 위치 정보를 가져오는 효과
  useEffect(() => {
    async function getCurrentLocation() {
      // 위치 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // 현재 위치 정보 가져오기
      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  // "확인" 버튼 클릭 시 실행되는 함수
  const onPressConfirm = async (e: GestureResponderEvent) => {
    router.push({
      pathname: "/result",
      params: {
        content
      }
    })
  };

  // UI 렌더링
  return <View style={styles.container}>
    <Text>증상을 입력하고 확인 버튼을 누르세요.</Text>
    <Textarea
      size="md"
      className="w-64"
    >
      <TextareaInput placeholder="증상을 입력하세요." value={content} onChangeText={setContent} />
    </Textarea>
    <Button onPress={onPressConfirm} isDisabled={location === null}>
      <ButtonText>확인</ButtonText>
    </Button>
  </View>;
}

// 컴포넌트 스타일
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
import Card from "@/components/Card";
import Disclaimer from "@/components/Disclaimer";
import SymptomInput from "@/components/SymptomInput";
import { Text } from "@/components/ui/text";
import { useFonts } from 'expo-font';
import { useRouter } from "expo-router";
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

const { width, height } = Dimensions.get('window');

// 응급 상황에 대한 증상을 입력받아 AI 진단 및 주변 병원 정보를 제공하는 메인 화면 컴포넌트
export default function MainBackup() {
  const router = useRouter(); // 라우터 객체 초기화

  // 폰트 로딩
  let [fontsLoaded] = useFonts({
    'JosefinSans-Light': require('../assets/fonts/Josefin_Sans/static/JosefinSans-Light.ttf'),
    'JosefinSans-Regular': require('../assets/fonts/Josefin_Sans/static/JosefinSans-Regular.ttf'),
    'JosefinSans-SemiBold': require('../assets/fonts/Josefin_Sans/static/JosefinSans-SemiBold.ttf'),
  });

  // 사용자가 입력한 증상 텍스트를 저장하는 상태
  const [content, setContent] = useState<string>("");
  
  // 폰트가 로드되지 않았으면 로딩 화면 표시
  if (!fontsLoaded) {
    return null;
  }

  // "확인" 버튼 클릭 시 실행되는 함수
  const onPressConfirm = async () => {
    if (!content.trim()) {
      return; // 빈 내용일 때는 진행하지 않음
    }
    
    console.log('진단 시작 - 전송할 내용:', content);
    router.push({
      pathname: "/result",
      params: {
        content: content.trim()
      }
    })
  };

  // UI 렌더링
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.page}>
        {/* 헤더 */}
        <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.appName}>GOLDEN TIME</Text>
              <Text style={styles.appSubtitle}>AI 응급의료 진단</Text>
            </View>
        </View>
        
        {/* 카드 섹션 */}
        <View style={styles.cardsRow}>
            <Card
              title="KTAS 응급분류"
              description="한국형 응급환자\n중증도 분류"
              onPress={() => router.push('/ktas')}
              actionText="KTAS 란? →"
              backgroundColor="#E0F2F3"
              textColor="#8B4F0F"
              compact={true}
            />
            <Card
              title="본인확인 QR"
              description="병·의원 접수처에\nQR을 보여주세요"
              compact={true}
              actionText="제출하기 →"
              onPress={() => router.push('/qr')}
              backgroundColor="#F4E7C1"
              textColor="#8B4513"
            />
        </View>
        
        {/* 입력창 섹션 */}
        <View style={styles.inputSection}>
          <SymptomInput
            value={content}
            onChangeText={setContent}
            onCamera={() => console.log('카메라 버튼 클릭')}
            onMic={() => console.log('마이크 버튼 클릭 (웹에서만 지원)')}
            placeholder="증상을 입력해 주세요."
            onSubmitEditing={() => {
              if (content.trim()) {
                onPressConfirm();
              }
            }}
            isListening={false}
            hasImage={false}
          />
        
        {content.trim() ? (
          <TouchableOpacity style={styles.diagnoseButton} onPress={onPressConfirm}>
            <Text style={styles.diagnoseButtonText}>AI 진단 시작</Text>
          </TouchableOpacity>
        ) : null}
        </View>
        
        {/* 빈 공간 추가 */}
        <View style={{ flex: 1, minHeight: 40 }} />
        
        {/* 면책문구 - 화면 최하단 */}
        <Disclaimer text={`AI의 결과는 참고용으로 의료진의 진단을 대체하지 않습니다.\n응급 상황 시 즉시 119에 신고하세요.`} />
      </View>
    </ScrollView>
  );
}

// 컴포넌트 스타일
const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
  },
  page: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 80,
  },
  headerText: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: '300',
    color: '#1B3A52',
    fontFamily: 'JosefinSans-Regular',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#5f6368',
    marginTop: 4,
    fontFamily: 'JosefinSans-Light',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 100,
  },
  inputSection: {
    marginBottom: 24,
  },
  diagnoseButton: {
    backgroundColor: '#1B3A52',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 200,
    alignSelf: 'center'
  },
  diagnoseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
});
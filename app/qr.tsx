import { Stack, useRouter } from "expo-router";
import { ChevronLeft } from 'lucide-react-native';
import QRCode from 'qrcode';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function QRScreen() {
  const router = useRouter();
  const [patientId, setPatientId] = useState<string>('');
  const [qrImageUri, setQrImageUri] = useState<string>('');

  // 컴포넌트 마운트 시 고유번호 생성
  useEffect(() => {
    generatePatientId();
  }, []);

  // 환자 고유번호 생성 함수
  const generatePatientId = async () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // 연도 뒤 2자리
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 월 (01-12)
    const day = now.getDate().toString().padStart(2, '0'); // 일 (01-31)
    const datePrefix = `${year}${month}${day}`; // YYMMDD 형식

    // 1-99999 범위의 랜덤 숫자 생성
    const randomNumber = Math.floor(Math.random() * 99999) + 1;

    // 숫자 범위에 따라 알파벳 결정
    let alphabet;
    let displayNumber;

    if (randomNumber <= 9999) {
      alphabet = 'A';
      displayNumber = randomNumber.toString().padStart(4, '0');
    } else if (randomNumber <= 19999) {
      alphabet = 'B';
      displayNumber = (randomNumber - 10000).toString().padStart(4, '0');
    } else if (randomNumber <= 29999) {
      alphabet = 'C';
      displayNumber = (randomNumber - 20000).toString().padStart(4, '0');
    } else if (randomNumber <= 39999) {
      alphabet = 'D';
      displayNumber = (randomNumber - 30000).toString().padStart(4, '0');
    } else if (randomNumber <= 49999) {
      alphabet = 'E';
      displayNumber = (randomNumber - 40000).toString().padStart(4, '0');
    } else if (randomNumber <= 59999) {
      alphabet = 'F';
      displayNumber = (randomNumber - 50000).toString().padStart(4, '0');
    } else if (randomNumber <= 69999) {
      alphabet = 'G';
      displayNumber = (randomNumber - 60000).toString().padStart(4, '0');
    } else if (randomNumber <= 79999) {
      alphabet = 'H';
      displayNumber = (randomNumber - 70000).toString().padStart(4, '0');
    } else if (randomNumber <= 89999) {
      alphabet = 'I';
      displayNumber = (randomNumber - 80000).toString().padStart(4, '0');
    } else {
      alphabet = 'J';
      displayNumber = (randomNumber - 90000).toString().padStart(4, '0');
    }

    const id = `${datePrefix}-${alphabet}${displayNumber}`;
    // console.log('새로 생성된 ID:', id);
    setPatientId(id);

    // QR 코드 데이터 생성 (JSON 형태)
    const qrInfo = {
      patientId: id,
      timestamp: Date.now(),
      service: 'GoldenTime',
      type: 'patient_identification'
    };

    try {
      // QR 코드 이미지 생성
      const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrInfo), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrImageUri(qrDataURL);
    } catch (error) {
      // console.error('QR 코드 생성 오류:', error);
    }
  };

  // 새로운 번호 생성
  const regenerateId = () => {
    // console.log('새 번호 생성 버튼 클릭됨');
    if (Platform.OS === 'web') {
      // 웹에서는 바로 생성
      // console.log('웹 환경에서 바로 생성');
      generatePatientId();
    } else {
      // 네이티브에서는 Alert 사용
      Alert.alert(
        '새 번호 생성',
        '새로운 고유번호를 생성하시겠습니까?',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '생성',
            onPress: generatePatientId,
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#3c4043" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>본인확인 QR</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* 안내 텍스트 */}
        <Text style={styles.introText}>
          병·의원 접수처에서 아래 QR코드를 보여주세요.
        </Text>

        {/* QR 코드 영역 */}
        <View style={styles.qrContainer}>
          {qrImageUri ? (
            <Image
              source={{ uri: qrImageUri }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.placeholderText}>QR 코드 생성 중...</Text>
            </View>
          )}
        </View>

        {/* 환자 고유번호 */}
        <View style={styles.idContainer}>
          <Text style={styles.idLabel}>환자 고유번호</Text>
          <Text style={styles.idValue}>{patientId}</Text>
        </View>

        {/* 새로 생성 버튼 */}
        <TouchableOpacity style={styles.regenerateButton} onPress={regenerateId}>
          <Text style={styles.regenerateButtonText}>새 번호 생성</Text>
        </TouchableOpacity>

        {/* 사용 안내 */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>사용 방법</Text>
          <Text style={styles.instructionText}>
            1. 병·의원 방문 시 접수처에서 QR코드를 보여주세요.{'\n'}
            2. 고유번호를 구두로 알려주셔도 됩니다.{'\n'}
            3. 개인정보 보호를 위해 타인에게 노출하지 마세요.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    ...Platform.select({
      web: {
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
        minHeight: '100vh'
      }
    })
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3c4043',
  },
  scrollViewContent: {
    padding: 20,
    alignItems: 'center',
  },
  introText: {
    fontSize: 16,
    color: '#3c4043',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  qrContainer: {
    backgroundColor: '#F4E7C1',
    padding: 30,
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
  },
  idContainer: {
    backgroundColor: '#F7E7CE',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  idLabel: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 8,
    textAlign: 'center',
  },
  idValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B242A',
    textAlign: 'center',
    letterSpacing: 1,
  },
  regenerateButton: {
    backgroundColor: '#2A3439',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 30,
  },
  regenerateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionContainer: {
    backgroundColor: '#73A9C2',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
});

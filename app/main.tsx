import Card from "@/components/Card";
import Disclaimer from "@/components/Disclaimer";
import SymptomInput from "@/components/SymptomInput";
import { Text } from "@/components/ui/text";
import { useFonts } from 'expo-font';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { AudioConfig, CancellationReason, ResultReason, SpeechConfig, SpeechRecognizer } from "microsoft-cognitiveservices-speech-sdk";
import React, { useRef, useState } from 'react';
import { Alert, Dimensions, GestureResponderEvent, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

const {
  EXPO_PUBLIC_SPEECH_KEY,
  EXPO_PUBLIC_SPEECH_REGION
} = process.env;

const { width, height } = Dimensions.get('window');

// 응급 상황에 대한 증상을 입력받아 AI 진단 및 주변 병원 정보를 제공하는 메인 화면 컴포넌트
export default function Index() {
  const router = useRouter(); // 라우터 객체 초기화

  // 폰트 로딩
  const [fontsLoaded] = useFonts({
    'JosefinSans-Light': require('../assets/fonts/Josefin_Sans/static/JosefinSans-Light.ttf'),
    'JosefinSans-Regular': require('../assets/fonts/Josefin_Sans/static/JosefinSans-Regular.ttf'),
    'JosefinSans-SemiBold': require('../assets/fonts/Josefin_Sans/static/JosefinSans-SemiBold.ttf'),
  });

  // 현재 위치 정보를 저장하는 상태
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  // 사용자가 입력한 증상 텍스트를 저장하는 상태
  const [content, setContent] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognizer>(null);

  // 디버깅용 로그
  console.log('현재 content 상태:', content);

  // 폰트가 로드되지 않았으면 로딩 화면 표시
  if (!fontsLoaded) {
    return null; // 또는 로딩 스피너
  }

  // 컴포넌트 마운트 시 자동으로 위치 권한 요청
  React.useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        console.log('위치 권한 요청 시작...');

        // 현재 권한 상태 먼저 확인
        const currentStatus = await Location.getForegroundPermissionsAsync();
        console.log('현재 위치 권한 상태:', currentStatus);

        if (currentStatus.status !== 'granted') {
          console.log('위치 권한 요청 중...');
          const { status } = await Location.requestForegroundPermissionsAsync();
          console.log('위치 권한 요청 결과:', status);

          if (status === 'granted') {
            console.log('위치 정보 가져오는 중...');
            const location = await Location.getCurrentPositionAsync({});
            setLocation(location);
            console.log('위치 권한 승인됨:', location);
          } else {
            console.log('위치 권한 거부됨, 상태:', status);
          }
        } else {
          console.log('위치 권한이 이미 허용되어 있음');
          const location = await Location.getCurrentPositionAsync({});
          setLocation(location);
          console.log('기존 위치 정보:', location);
        }
      } catch (error) {
        console.log('위치 권한 요청 오류:', error);
      }
    };

    requestLocationPermission();
  }, []);

  // 음성 인식 시작/중지 함수
  const toggleSpeechRecognition = () => {
    if (!isListening) {
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }
  };

  // Azure Speech Service를 사용한 음성 인식 시작
  const startSpeechRecognition = async () => {
    if (!EXPO_PUBLIC_SPEECH_KEY || !EXPO_PUBLIC_SPEECH_REGION) {
      console.error('Azure Speech Service 키가 설정되지 않았습니다.');
      alert('음성 인식 서비스가 설정되지 않았습니다.');
      return;
    }

    try {
      console.log('Azure Speech Service 음성 인식 시작...');

      // Azure Speech Config 설정
      const speechConfig = SpeechConfig.fromSubscription(EXPO_PUBLIC_SPEECH_KEY, EXPO_PUBLIC_SPEECH_REGION);
      speechConfig.speechRecognitionLanguage = "ko-KR";

      // 오디오 설정
      const audioConfig = AudioConfig.fromDefaultMicrophoneInput();

      // Speech Recognizer 생성
      const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
      recognitionRef.current = recognizer;

      // 인식 중 이벤트 (실시간)
      recognizer.recognizing = (s, e) => {
        console.log(`인식 중: ${e.result.text}`);
      };

      // 인식 완료 이벤트
      recognizer.recognized = (s, e) => {
        if (e.result.reason === ResultReason.RecognizedSpeech) {
          console.log(`인식 완료: ${e.result.text}`);
          // 기존 텍스트에 추가
          setContent(prev => prev ? `${prev} ${e.result.text}` : e.result.text);
        } else if (e.result.reason === ResultReason.NoMatch) {
          console.log("음성을 인식할 수 없습니다.");
        }
      };

      // 취소/오류 이벤트
      recognizer.canceled = (s, e) => {
        console.log(`인식 취소: ${e.reason}`);
        if (e.reason === CancellationReason.Error) {
          console.error(`오류: ${e.errorDetails}`);
          alert(`음성 인식 오류: ${e.errorDetails}`);
        }
        setIsListening(false);
      };

      // 세션 중지 이벤트
      recognizer.sessionStopped = (s, e) => {
        console.log("음성 인식 세션이 중지되었습니다.");
        setIsListening(false);
      };

      // 인식 시작
      setIsListening(true);
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log("음성 인식이 시작되었습니다.");
        },
        (error) => {
          console.error("음성 인식 시작 오류:", error);
          setIsListening(false);
          alert("음성 인식을 시작할 수 없습니다.");
        }
      );

    } catch (error) {
      console.error('Azure Speech Service 오류:', error);
      setIsListening(false);
      alert('음성 인식 서비스에 오류가 발생했습니다.');
    }
  };

  // Azure Speech Service 음성 인식 중지
  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      console.log('음성 인식을 중지합니다...');
      recognitionRef.current.stopContinuousRecognitionAsync(
        () => {
          console.log("음성 인식이 중지되었습니다.");
          setIsListening(false);
          recognitionRef.current = null;
        },
        (error) => {
          console.error("음성 인식 중지 오류:", error);
          setIsListening(false);
          recognitionRef.current = null;
        }
      );
    }
  };

  // 이미지 선택 옵션 표시
  const showImagePicker = () => {
    if (Platform.OS === 'web') {
      // 웹에서는 카메라 우선 시도, 실패시 파일 선택
      pickImageWebWithCamera();
    } else {
      // 네이티브에서는 바로 카메라 실행
      takePicture();
    }
  };

  // 웹에서 카메라 우선 시도
  const pickImageWebWithCamera = () => {
    if (typeof document === 'undefined') {
      console.log('웹 환경이 아닙니다.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // 후면 카메라 사용
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        console.log('사진 촬영됨:', file.name);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          console.log('이미지 로드 완료');
          setSelectedImage(e.target.result);
          setContent(prev => prev ? `${prev}\n[사진이 첨부되었습니다: ${file.name}]` : `[사진이 첨부되었습니다: ${file.name}]`);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // 웹에서 이미지 선택 (갤러리용)
  const pickImageWeb = () => {
    if (typeof document === 'undefined') {
      console.log('웹 환경이 아닙니다.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        console.log('파일 선택됨:', file.name);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          console.log('이미지 로드 완료');
          setSelectedImage(e.target.result);
          setContent(prev => prev ? `${prev}\n[사진이 첨부되었습니다: ${file.name}]` : `[사진이 첨부되었습니다: ${file.name}]`);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // 카메라로 사진 촬영
  const takePicture = async () => {
    try {
      // 카메라 권한 요청
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

      if (cameraPermission.status !== 'granted') {
        Alert.alert('권한 필요', '카메라 사용을 위해 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        // 이미지가 선택되었음을 텍스트에 표시
        setContent(prev => prev ? `${prev}\n[사진이 첨부되었습니다]` : '[사진이 첨부되었습니다]');
      }
    } catch (error) {
      console.error('카메라 오류:', error);
      Alert.alert('오류', '사진 촬영 중 오류가 발생했습니다.');
    }
  };

  // 갤러리에서 이미지 선택
  const pickImage = async () => {
    try {
      // 미디어 라이브러리 권한 요청
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (libraryPermission.status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근을 위해 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        // 이미지가 선택되었음을 텍스트에 표시
        setContent(prev => prev ? `${prev}\n[사진이 첨부되었습니다]` : '[사진이 첨부되었습니다]');
      }
    } catch (error) {
      console.error('갤러리 오류:', error);
      Alert.alert('오류', '사진 선택 중 오류가 발생했습니다.');
    }
  };

  // "확인" 버튼 클릭 시 실행되는 함수
  const onPressConfirm = async (e?: GestureResponderEvent) => {
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
          {/* 선택된 이미지 미리보기 */}
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setSelectedImage(null);
                  setContent(prev => prev.replace(/\[사진이 첨부되었습니다[^\]]*\]/g, '').trim());
                }}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <SymptomInput
            value={content}
            onChangeText={setContent}
            onCamera={showImagePicker}
            onMic={toggleSpeechRecognition}
            placeholder="증상을 입력해 주세요."
            onSubmitEditing={() => {
              if (content.trim()) {
                onPressConfirm();
              }
            }}
            onKeyPress={(e) => {
              if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                e.preventDefault();
                if (content.trim()) {
                  onPressConfirm();
                }
              }
            }}
            isListening={isListening}
            hasImage={!!selectedImage}
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

// 컴포넌트 스타일 - 모바일 폭 고정 및 자연스러운 레이아웃
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
    color: '#1B3A52', // 네이비 색상으로 변경
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
  footer: {
    alignItems: 'center',
    marginTop: 8
  },
  disclaimer: {
    fontSize: 11,
    color: '#5f6368',
    textAlign: 'center',
    lineHeight: 16,
    flexWrap: 'wrap'
  },
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 12,
  },
  imagePreview: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  removeImageText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 14
  },
});
import React from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import CameraIcon from "./CameraIcon";
import MicIcon from "./MicIcon";

type Props = {
  value?: string;
  onChangeText?: (v: string) => void;
  onMic?: () => void;
  onCamera?: () => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  onKeyPress?: (e: any) => void;
  isListening?: boolean;
  hasImage?: boolean;
};

export default function SymptomInput({
  value,
  onChangeText,
  onMic,
  onCamera,
  placeholder = "증상을 입력해 주세요.",
  onSubmitEditing,
  onKeyPress,
  isListening = false,
  hasImage = false
}: Props) {
  return (
    <View style={styles.wrap}>
      {/* 좌측: 카메라 버튼 */}
      <Pressable
        onPress={onCamera}
        style={[styles.leftIcon, hasImage && styles.iconActive]}
        hitSlop={8}
      >
        <CameraIcon size={18} color={hasImage ? "#1a73e8" : "#5f6368"} />
      </Pressable>

      {/* 가운데: 입력창과 placeholder 오버레이 */}
      <View style={styles.inputContainer}>
        {/* 입력창 (투명한 placeholder, 커서는 왼쪽) */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={[
            styles.input,
            {
              textAlign: 'left',
              textAlignVertical: value ? 'top' : 'center'
            }
          ]}
          placeholder={placeholder} // 빈 placeholder
          multiline
          numberOfLines={3}
          onSubmitEditing={onSubmitEditing}
          onKeyPress={onKeyPress}
          returnKeyType="send"
          blurOnSubmit={false}
        />
      </View>

      {/* 우측: 마이크 버튼 */}
      <Pressable
        onPress={onMic}
        style={[styles.rightIcon, isListening && styles.iconListening]}
        hitSlop={8}
      >
        <MicIcon size={16} color={isListening ? "#ffffff" : "#1B3A52"} />
      </Pressable>
    </View>
  );
}

const HEIGHT = 64;
const ICON_BOX = 36; // 아이콘 버튼 원형 크기
const SIDE_PAD = 12; // 컨테이너 기본 좌우 패딩

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    minHeight: HEIGHT,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e8eaed",
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      web: {
        border: "1px solid #e8eaed",
        borderRadius: "20px",
        display: "flex"
      }
    })
  },
  inputContainer: {
    position: "relative",
    flex: 1,
    marginLeft: SIDE_PAD + ICON_BOX + 8,
    marginRight: SIDE_PAD + ICON_BOX + 8,
    marginVertical: 12,
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    minHeight: HEIGHT - 24,
    textAlignVertical: "center",
    color: '#3c4043',
    textAlign: 'left', // 커서와 텍스트는 왼쪽 정렬
    backgroundColor: "transparent",
    ...Platform.select({
      web: {
        outlineWidth: 0,
        border: "none",
        backgroundColor: "transparent",
        textAlign: 'left', // 웹에서 왼쪽 정렬
      }
    })
  },
  leftIcon: {
    position: "absolute",
    left: SIDE_PAD,
    top: "50%",
    marginTop: -ICON_BOX / 2,
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: ICON_BOX / 2,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 2
  },
  rightIcon: {
    position: "absolute",
    right: SIDE_PAD,
    top: "50%",
    marginTop: -ICON_BOX / 2,
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: ICON_BOX / 2,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 2
  },
  iconActive: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#1a73e8'
  },
  iconListening: {
    backgroundColor: '#1B3A52',
    shadowColor: '#1B3A52',
    shadowOpacity: 0.3,
    elevation: 4
  }
});

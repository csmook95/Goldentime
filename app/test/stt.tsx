import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { AudioConfig, CancellationReason, ResultReason, SpeechConfig, SpeechRecognizer } from "microsoft-cognitiveservices-speech-sdk";
import React, { useState } from 'react';
import { GestureResponderEvent, StyleSheet, View } from "react-native";

const {
    EXPO_PUBLIC_SPEECH_KEY,
    EXPO_PUBLIC_SPEECH_REGION
} = process.env

// 응급 상황에 대한 증상을 입력받아 AI 진단 및 주변 병원 정보를 제공하는 메인 화면 컴포넌트
export default function STT() {
    const [text, setText] = useState("")

    const speechConfig = SpeechConfig.fromSubscription(EXPO_PUBLIC_SPEECH_KEY!, EXPO_PUBLIC_SPEECH_REGION!);
    speechConfig.speechRecognitionLanguage = "ko-KR"

    const audioConfig = AudioConfig.fromDefaultMicrophoneInput()
    const recognizer = new SpeechRecognizer(speechConfig, audioConfig)

    const dd = (e: GestureResponderEvent) => {
        speechRecognizer.startContinuousRecognitionAsync();
    }

    const stop = () => {
        speechRecognizer.stopContinuousRecognitionAsync();
    }

    const speechRecognizer = new SpeechRecognizer(speechConfig, audioConfig)

    speechRecognizer.recognizing = (s, e) => {
        console.log(`RECOGNIZING: Text=${e.result.text}`);
    };

    speechRecognizer.recognized = (s, e) => {
        if (e.result.reason == ResultReason.RecognizedSpeech) {
            console.log(`RECOGNIZED: Text=${e.result.text}`);
        }
        else if (e.result.reason == ResultReason.NoMatch) {
            console.log("NOMATCH: Speech could not be recognized.");
        }
    };

    speechRecognizer.canceled = (s, e) => {
        console.log(`CANCELED: Reason=${e.reason}`);

        if (e.reason == CancellationReason.Error) {
            console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
            console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
            console.log("CANCELED: Did you set the speech resource key and region values?");
        }

        speechRecognizer.stopContinuousRecognitionAsync();
    };

    speechRecognizer.sessionStopped = (s, e) => {
        console.log("\n    Session stopped event.");
        speechRecognizer.stopContinuousRecognitionAsync();
    };



    // UI 렌더링
    return <View style={styles.container}>
        <Button onPress={dd}>
            <ButtonText>녹음 시작</ButtonText>
        </Button>
        <Button onPress={stop}>
            <ButtonText>녹음 중지</ButtonText>
        </Button>
        <Text>
            {text}
        </Text>
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
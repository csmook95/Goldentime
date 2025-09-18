import { AzureOpenAI } from 'openai';
import React, { useEffect } from 'react';
import { StyleSheet, View } from "react-native";

const {
  EXPO_PUBLIC_ENDPOINT,
  EXPO_PUBLIC_API_KEY
} = process.env

// 응급 상황에 대한 증상을 입력받아 AI 진단 및 주변 병원 정보를 제공하는 메인 화면 컴포넌트
export default function Stream() {
  const client = new AzureOpenAI({
    endpoint: EXPO_PUBLIC_ENDPOINT,
    apiKey: EXPO_PUBLIC_API_KEY,
    apiVersion: "2025-03-01-preview",
    dangerouslyAllowBrowser: true
  });

  useEffect(() => {
    azureOpenAI()
  }, [])

  const azureOpenAI = async () => {
    const events = await client.chat.completions.stream({
      model: "gpt-4.1",
      messages: [
        {
          role: "user",
          content: "안녕"
        }
      ],
      max_tokens: 1200,
      temperature: 0.2,
      top_p: 0.3,
      frequency_penalty: 0.1,
      presence_penalty: 0,
    })

    let response = "";

    for await (const event of events) {
      for (const choice of event.choices) {
        const newText = choice.delta?.content;
        if (!!newText) {
          response += newText;
          // To see streaming results as they arrive, uncomment line below
          console.log(newText);
        }
      }
    }

    console.log(response);
  }

  // UI 렌더링
  return <View style={styles.container}>
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
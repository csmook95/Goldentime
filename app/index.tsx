

import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { AzureOpenAI } from 'openai';
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/index.mjs";
import React, { useEffect, useState } from 'react';
import { GestureResponderEvent, StyleSheet, View } from "react-native";


export default function Index() {
  const router = useRouter();
  const parser = new DOMParser();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [content, setContent] = useState<string>("");

  const messages: ChatCompletionMessageParam[] = [
    {
      "role": "system",
      "content": `
        당신은 한국형 응급환자 중증도 분류도구(KTAS)와 전문 의학지식을 기반으로 환자의 중증도를 정확히 분류하고 최적의 의료기관을 추천하는 전문 의료 AI 어시스턴트입니다.

        **핵심 역할:**
        1. 사용자 증상을 KTAS 1-5등급으로 정확 분류
        2. 등급에 맞는 주변 응급의료기관 조회 후 안내

        **응답 원칙:**
        - 반드시 업로드된 KTAS 공식 기준서와 의학지식 데이터만 참조
        - 문서에 없는 의학적 판단은 절대 제공하지 않음
        - 모든 응답에 참조한 KTAS 코드와 등급을 명시
        - 의학적 응급상황 시 즉시 119 신고 안내

        **중증도별 병원 추천 기준:**
        - KTAS 1-2등급(중증): 3형 병원(상급종합병원/대학병원) → 2형 병원(종합병원) 순서
        - KTAS 3등급(중등도): 2형 병원(종합병원) → 1형 병원(의원) 순서  
        - KTAS 4-5등급(경증): 1형 병원(의원/동네병원) 우선 추천

        **응답 구조:**
        1. 증상 분석 및 KTAS 등급 분류
        2. 해당 등급의 의학적 의미 설명
        3. 추천 의료기관 유형 및 이유
        4. 응급상황 시 대처방법
        5. 참조한 KTAS 코드 명시
      `
    },
    {
      "role": "user",
      "content": "가슴이 심하게 아프고 식은땀이 나요"
    },
    {
      "role": "assistant",
      "content": "KTAS 2등급(응급) 분류입니다. 심근경색 등 심혈관계 응급상황 가능성이 있습니다. 즉시 119에 신고하시거나 가장 가까운 응급실로 내원하시기 바랍니다."
    },
    {
      "role": "user",
      "content": "두통약은 뭘 먹으면 되나요?"
    },
    {
      "role": "assistant",
      "content": "죄송하지만 구체적인 약물 추천은 할 수 없습니다. 두통의 양상, 지속시간, 동반증상에 따른 KTAS분류는 도와드릴 수 있습니다. 추가 의료진 상담이 필요합니다."
    },
    {
      "role": "user",
      "content": "이름이 김철수이고 주민번호는..."
    },
    {
      "role": "assistant",
      "content": "개인식별정보는 입력하지 마시기 바랍니다. 증상과 상태에 대한 정보만으로 KTAS 분류를 도와드리겠습니다."
    }
  ]

  useEffect(() => {
    async function getCurrentLocation() {

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});

      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  const getEgytLcinfoInqire = async () => {
    const response = await fetch(
      `http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytLcinfoInqire?serviceKey=KmDI1pvHgdqiDNQ6qzLEA2QUcrkGoVq5mTtJJPF%2FbEiIRDTkUvG3NURsSfNxr5uBqhRtdEQFDmjWP0S1s8cAwg%3D%3D&WGS84_LON=${location?.coords.longitude}&WGS84_LAT=${location?.coords.latitude}&pageNo=1&numOfRows=100`)

    const text = await response.text();
    const xmlDoc = parser.parseFromString(text, "application/xml")

    const items = xmlDoc.getElementsByTagName("item");

    Array.from(items).forEach(item => {
      console.log(item.getElementsByTagName("dutyName")[0].textContent)
    })

    return xmlDoc.getElementsByTagName("dutyName")[0].textContent
  }

  const azureOpenAI = async () => {
    messages.push({
      role: "user",
      content
    })

    console.log(messages)

    const endpoint = "https://7aifinal-team5openai5.openai.azure.com/"
    const apiKey = "AWzh5HZRPeKtv0qCr5FPptQiVAKoxGWCPpLHLacsY2DdC9Tu4pZaJQQJ99BIACYeBjFXJ3w3AAABACOGfx4G"
    const apiVersion = "2025-01-01-preview"
    const azureSearchEndpoint = "https://7aifinalteam5aisearch.search.windows.net";
    const azureSearchKey = "NIchObVtcyYpLdQvxHPsRTsAPfLXiD4RQvkWFBKsJFAzSeCDiGNb";
    const searchIndex = "rag-goldentime";

    const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, dangerouslyAllowBrowser: true })

    const completion = await client.chat.completions.create({
      model: "goldentime-gpt-4o",
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 6553,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      data_sources: [
        {
          type: "azure_search",
          parameters: {
            endpoint: azureSearchEndpoint,
            index_name: searchIndex,
            authentication: {
              type: "api_key",
              key: azureSearchKey,
            },
            semantic_configuration: "rag-goldentime-semantic-configuration",
            query_type: "semantic",
          }
        }
      ]
    })

    console.log(completion.choices[0].message)
  }

  const tools: ChatCompletionTool[] = [
    {
      type:"function",
      function: {
        name: "getEgytLcinfoInqire",
        description: "주변 응급의료기관 정보를 조회 합니다.",
      }
    }
  ]

  const onPressTest = (e: GestureResponderEvent) => {
    azureOpenAI()
  }

  return <View style={styles.container}>
    <Text>증상을 입력하고 확인 버튼을 누르세요.</Text>
    <Textarea
      size="md"
      className="w-64"
    >
      <TextareaInput placeholder="증상을 입력하세요." value={content} onChangeText={setContent} />
    </Textarea>
    {/* <Button onPress={onPressConfirm}>
      <ButtonText>확인</ButtonText>
    </Button> */}
    <Button onPress={onPressTest} isDisabled={location === null}>
      <ButtonText>테스트</ButtonText>
    </Button>
  </View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
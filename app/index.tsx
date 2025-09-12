import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { AzureOpenAI } from 'openai';
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/index.mjs";
import React, { useEffect, useState } from 'react';
import { GestureResponderEvent, StyleSheet, View } from "react-native";

// 응급 상황에 대한 증상을 입력받아 AI 진단 및 주변 병원 정보를 제공하는 메인 화면 컴포넌트
export default function Index() {
  const router = useRouter(); // 라우터 객체 초기화
  const parser = new DOMParser(); // XML 파싱을 위한 DOMParser 객체 생성

  // 현재 위치 정보를 저장하는 상태
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  // 사용자가 입력한 증상 텍스트를 저장하는 상태
  const [content, setContent] = useState<string>("배가 아프다");
  // AI 모델과 주고받는 메시지 목록을 저장하는 상태
  const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([
    {
      role: "system",
      content: `
너는 119 구급차를 호출하려는 환자를 돕는 응급의료 챗봇이다.
사용자가 증상을 입력하면 반드시 다음을 수행하라:

1. 입력한 증상이 어떤 증상인지 간단히 설명한다. (증상 이름과 주요 특징)
2. 일반인이 즉시 시도할 수 있는 기본적인 응급처치 방법을 안내한다.
   - 응급처치는 전문 의료 행위가 아닌 일반인이 할 수 있는 수준만 포함한다.
   - 약 처방이나 의학적 판단을 내리지 않는다.
3. 반드시 getEgytLcinfoInqire 툴을 호출하여 현재 위치 기준으로 주변 응급의료기관 3~5곳을 찾아 안내한다.
   - 병원 이름, 주소, 전화번호를 포함한다.
   - 툴 호출 시 위치 좌표는 이미 확보되어 있으므로, 모델은 어떤 좌표도 만들거나 입력하지 않는다.

응답은 반드시 위 순서(증상 설명 → 응급처치 → 병원 안내)로 작성하라.
      `.trim()
    }
  ]);

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

  // 주변 응급의료기관 정보를 조회하는 함수
  const getEgytLcinfoInqire = async () => {
    // 공공 데이터 API 호출
    const response1 = await fetch(
      `http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytLcinfoInqire?serviceKey=KmDI1pvHgdqiDNQ6qzLEA2QUcrkGoVq5mTtJJPF%2FbEiIRDTkUvG3NURsSfNxr5uBqhRtdEQFDmjWP0S1s8cAwg%3D%3D&WGS84_LON=${location?.coords.longitude}&WGS84_LAT=${location?.coords.latitude}&pageNo=1&numOfRows=100`
    );

    // XML 응답 파싱
    const text = await response1.text();
    const xmlDoc = parser.parseFromString(text, "application/xml");

    // 병원 이름 추출
    const dutyName = xmlDoc.getElementsByTagName("dutyName");
    let result = "";

    Array.from(dutyName).forEach(({ textContent }) => {
      if (result === "") result = textContent;
      else result += `, ${textContent}`;
    });

    return result;
  };

  // Azure OpenAI 서비스를 호출하여 AI 모델의 응답을 받는 함수
  const azureOpenAI = async (messages: ChatCompletionMessageParam[]) => {
    const endpoint = "https://7aifinal-team5openai5.openai.azure.com/";
    const apiKey = "AWzh5HZRPeKtv0qCr5FPptQiVAKoxGWCPpLHLacsY2DdC9Tu4pZaJQQJ99BIACYeBjFXJ3w3AAABACOGfx4G";
    const apiVersion = "2025-01-01-preview";
    const azureSearchEndpoint = "https://7aifinalteam5aisearch.search.windows.net";
    const azureSearchKey = "NIchObVtcyYpLdQvxHPsRTsAPfLXiD4RQvkWFBKsJFAzSeCDiGNb";
    const searchIndex = "rag-goldentime";

    // Azure OpenAI 클라이언트 초기화
    const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, dangerouslyAllowBrowser: true });

    // AI 모델 호출
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
    });

    return completion;
  };

  // AI 모델이 사용할 수 있는 도구 목록
  const tools: ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "getEgytLcinfoInqire",
        description: "현재 디바이스 위치 기준으로 주변 응급의료기관을 조회한다.",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      }
    }
  ];

  // "확인" 버튼 클릭 시 실행되는 함수
  const onPressConfirm = async (e: GestureResponderEvent) => {
    const newMessages: ChatCompletionMessageParam[] = [...messages, {
      role: "user",
      content
    }];

    // AI 모델 호출
    let completion = await azureOpenAI(newMessages);

    // 도구 호출 처리
    newMessages.push({ role: completion.choices[0].message.role, content: "", tool_calls: completion.choices[0].message.tool_calls });

    if (completion.choices[0].message.tool_calls) {
      const toolCalls = completion.choices[0].message.tool_calls;

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;

        let content;

        switch (functionName) {
          case "getEgytLcinfoInqire":
            content = await getEgytLcinfoInqire();
            break;
          default:
            content = "";
            break;
        }

        newMessages.push({
          role: "tool",
          tool_call_id: toolCalls[0].id,
          content,
        });
      }

      // 도구 호출 후 AI 모델 재호출
      completion = await azureOpenAI(newMessages);
    }

    setMessages(newMessages);
  };

  // 테스트용 함수
  const onPressTest = async () => {
    // Google Maps API를 사용하여 주소 정보 가져오기
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${location?.coords.latitude},${location?.coords.longitude}&key=AIzaSyAiO0AHB6a-2N4aHczh6_YNvlUsmVRZytQ`);
    const data = await response.json();

    // 공공 데이터 API 호출
    const response1 = await fetch(`http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire?serviceKey=KmDI1pvHgdqiDNQ6qzLEA2QUcrkGoVq5mTtJJPF%2FbEiIRDTkUvG3NURsSfNxr5uBqhRtdEQFDmjWP0S1s8cAwg%3D%3D&STAGE1=${data.results[6].address_components[2].long_name}&STAGE2=${data.results[6].address_components[1].long_name}&pageNo=1&numOfRows=100`);
    const text = await response1.text();
    const xmlDoc = parser.parseFromString(text, "application/xml");

    console.log(xmlDoc);
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
    <Button onPress={onPressTest} isDisabled={location === null}>
      <ButtonText>테스트</ButtonText>
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


import { Text } from "@/components/ui/text";
import * as Location from 'expo-location';
import { useLocalSearchParams } from "expo-router";
import { AzureOpenAI } from 'openai';
import { ChatCompletionCreateParamsNonStreaming, ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/index.mjs";
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from "react-native";

const {
  EXPO_PUBLIC_ENDPOINT,
  EXPO_PUBLIC_API_KEY,
  EXPO_PUBLIC_AZURE_SEARCH_ENDPOINT,
  EXPO_PUBLIC_AZURE_SEARCH_KEY,
  EXPO_PUBLIC_AZURE_SEARCH_INDEX,
  EXPO_PUBLIC_SEMENTIC_CONFIGURATION,
  EXPO_PUBLIC_GOOGLE_API_KEY,
  EXPO_PUBLIC_SERVICE_KEY
} = process.env


type hospital = {
  name: string,
  tel: string,
  description: string
}

type Diagnosis = {
  symptom: string,
  firstAid: string,
  hospitals: hospital[]
}


export default function Result() {
  // Azure OpenAI 클라이언트 초기화
  const client = new AzureOpenAI({
    endpoint: EXPO_PUBLIC_ENDPOINT,
    apiKey: EXPO_PUBLIC_API_KEY,
    apiVersion: "2025-01-01-preview",
    dangerouslyAllowBrowser: true
  });

  const [diagnosis, setDiagnosis] = useState<Diagnosis>();
  const { content } = useLocalSearchParams<{ content: string }>();

  useEffect(() => {
    initSearch();
  }, [])

  const initSearch = async () => {
    // 위치 권한 요청
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') return;

    // 현재 위치 정보 가져오기
    const location = await Location.getCurrentPositionAsync({});

    const newMessages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `
          너는 119 구급차를 호출하려는 환자를 돕는 응급의료 챗봇이다.

          사용자가 증상을 입력하면 반드시 다음을 수행하라:

          1. 입력한 증상이 어떤 증상인지 간단히 설명한다. (증상 이름과 주요 특징)

          2. 일반인이 즉시 시도할 수 있는 기본적인 응급처치 방법을 안내한다.
            - 응급처치는 전문 의료 행위가 아닌 일반인이 할 수 있는 수준만 포함한다.
            - 약 처방이나 의학적 판단을 내리지 않는다.

          3. 툴 응답을 바탕으로, 입력된 증상을 실제로 처치할 수 있는 병원만 선별하여 
            3~5곳을 추천한다.
            - 무조건 가까운 병원이 아니라, 해당 증상과 관련된 진료과나 장비, 병상이 있는 병원을 선택한다.
            - 병원 이름(dutyname), 주소, 전화번호(dutyTel3)를 반드시 포함한다.
            - 증상 처치와 관련된 가용 자원(hv*, hvcc, hvicc, hvventiayn 등)을 근거로 설명한다.
            - 만약 조건을 만족하는 병원이 없을 경우, 가장 근접한 대체 가능 병원을 안내한다.

          응답은 반드시 위 순서(증상 설명 → 응급처치 → 병원 안내)로 작성하라.
        `.trim()
      }
      , {
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
          case "getEmrrmRltmUsefulSckbdInfoInqire":
            content = await getEmrrmRltmUsefulSckbdInfoInqire(location);
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

    if (!completion.choices[0].message.tool_calls) setDiagnosis(JSON.parse(completion.choices[0].message.content!))
  }

  // Azure OpenAI 서비스를 호출하여 AI 모델의 응답을 받는 함수
  const azureOpenAI = async (messages: ChatCompletionMessageParam[]) => {
    const body: ChatCompletionCreateParamsNonStreaming = {
      model: "gpt-4.1",
      messages,
      tools,
      max_tokens: 1200,
      temperature: 0.2,
      top_p: 0.3,
      frequency_penalty: 0.1,
      presence_penalty: 0,
    }

    if (messages[messages.length - 1].role !== "tool") {
      body.tool_choice = { type: "function", function: { name: "getEmrrmRltmUsefulSckbdInfoInqire" } }
      body.data_sources = [
        {
          type: "azure_search",
          parameters: {
            endpoint: EXPO_PUBLIC_AZURE_SEARCH_ENDPOINT,
            index_name: EXPO_PUBLIC_AZURE_SEARCH_INDEX,
            authentication: {
              type: "api_key",
              key: EXPO_PUBLIC_AZURE_SEARCH_KEY,
            },
            semantic_configuration: EXPO_PUBLIC_SEMENTIC_CONFIGURATION,
            query_type: "semantic",
          }
        }
      ]
    }
    else {
      body.tool_choice = "none"
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: "diagnosis",
          schema: {
            type: "object",
            properties: {
              symptom: { type: "string" },
              firstAid: { type: "string" },
              hospitals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    tel: { type: "string" },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    }

    // AI 모델 호출
    const completion = await client.chat.completions.create(body);

    return completion;
  };

  // AI 모델이 사용할 수 있는 도구 목록
  const tools: ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "getEmrrmRltmUsefulSckbdInfoInqire",
        description: `현재 디바이스 위치 기준으로 주변 응급의료기관 정보를 조회한다.`,
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      }
    }
  ];

  const getEmrrmRltmUsefulSckbdInfoInqire = async (location: Location.LocationObject) => {
    // Google Maps API를 사용하여 주소 정보 가져오기
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${location?.coords.latitude},${location?.coords.longitude}&key=${EXPO_PUBLIC_GOOGLE_API_KEY}&result_type=sublocality_level_1`);
    const data = await response.json();

    // 공공 데이터 API 호출
    const response1 = await fetch(`http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire?serviceKey=${EXPO_PUBLIC_SERVICE_KEY}&STAGE1=${data.results[0].address_components[1].long_name}&STAGE2=${data.results[0].address_components[0].long_name}&pageNo=1&numOfRows=100`);
    const text = await response1.text();

    return text
  }

  return <View style={styles.container}>
    <Text>
      증상: {diagnosis?.symptom}
    </Text>
    <Text>
      응급조치: {diagnosis?.firstAid}
    </Text>
    {diagnosis?.hospitals.map(({ name, tel, description }) => (
      <View key={name}>
        <Text>병원이름: {name}</Text>
        <Text>전화번호: {tel}</Text>
        <Text>상세정보: {description}</Text>
      </View>
    ))}
  </View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
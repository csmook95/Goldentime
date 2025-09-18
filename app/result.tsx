

import * as Location from 'expo-location';
import { useLocalSearchParams } from "expo-router";
import { AzureOpenAI } from 'openai';
import { ChatCompletionCreateParamsNonStreaming, ChatCompletionMessageParam } from "openai/resources/index.mjs";
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

type specialty = "내과" | "소아청소년과" | "신경과" | "정신건강의학과" | "피부과" | "외과" | "흉부외과" | "정형외과" | "신경외과" | "성형외과" | "산부인과" | "안과" | "이비인후과" | "비뇨기과" | "재활의학과" | "마취통증의학과" | "영상의학과" | "치료방사선과" | "임상병리과" | "해부병리과" | "가정의학과" | "핵의학과" | "응급의학과" | "치과" | "구강악안면외과"

type severity = 1 | 2 | 3 | 4 | 5

type Diagnosis = {
  /**
   * 진단명
   */
  name: string,
  /**
   * 입력된 증상이 해당 진단일 확률 또는 연관성(퍼센트 정수)
   */
  percentage: number,
  /**
   * 증상에 대한 간단한 설명
   */
  description: string,
  /**
   * 응급처치
   */
  firstAid: string[],
  /**
   * 해당 증상을 진료할 수 있는 진료과 목록
   */
  specialty: specialty[]
  /**
   * KTAS 기준 응급 중증도 (1: 최중증 ~ 5: 최경증)
   */
  severity: severity
}


export default function Result() {
  const parser = new DOMParser();

  // Azure OpenAI 클라이언트 초기화
  const client = new AzureOpenAI({
    endpoint: EXPO_PUBLIC_ENDPOINT,
    apiKey: EXPO_PUBLIC_API_KEY,
    apiVersion: "2025-01-01-preview",
    dangerouslyAllowBrowser: true
  });

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>();
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
        너는 응급 증상 상담 챗봇이다.
        사용자가 입력한 증상을 바탕으로 가능한 진단과 응급 처치 정보를 제공한다.
        반드시 JSON Schema 형식에 맞게만 응답한다.

        규칙:
        - 입력은 반드시 의료적 증상이어야 한다.
        - 응급 증상과 무관한 질문(일상 대화, 상식, 농담, 잡담 등)은 절대 답하지 않고, JSON 응답으로 아래와 같이 반환한다:
          {
            "diagnosis": []
          }

        출력 항목:
        - name: 진단명
        - percentage: 입력 증상과 해당 진단의 연관성(정수 %)
        - description: 증상 설명
        - firstAid: 단계별 응급 처치 방법
        - specialty: 관련 진료과 (정해진 enum 값 중 선택)
        - severity: KTAS 기준 1~5

        반드시 **JSON Schema 형식**에 맞추어 응답해야 하며, 불필요한 텍스트나 설명은 포함하지 않는다.
        의심되는 진단이 여러개면 복수의 진단을 응답한다.
        `.trim(),
      }
      , {
        role: "user",
        content
      }];

    // AI 모델 호출
    const completion = await azureOpenAI(newMessages);

    if (!completion.choices[0].message.content) return

    const diagnoses: Diagnosis[] = JSON.parse(completion.choices[0].message.content).diagnoses

    console.log(diagnoses)

    setDiagnoses(diagnoses)

    const map = {
      내과: "D001",
      소아청소년과: "D002",
      신경과: "D003",
      정신건강의학과: "D004",
      피부과: "D005",
      외과: "D006",
      흉부외과: "D007",
      정형외과: "D008",
      신경외과: "D009",
      성형외과: "D010",
      산부인과: "D011",
      안과: "D012",
      이비인후과: "D013",
      비뇨기과: "D014",
      재활의학과: "D016",
      마취통증의학과: "D017",
      영상의학과: "D018",
      치료방사선과: "D019",
      임상병리과: "D020",
      해부병리과: "D021",
      가정의학과: "D022",
      핵의학과: "D023",
      응급의학과: "D024",
      치과: "D026",
      구강악안면외과: "D034"
    }

    // Google Maps API를 사용하여 주소 정보 가져오기
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${location?.coords.latitude},${location?.coords.longitude}&key=${EXPO_PUBLIC_GOOGLE_API_KEY}&result_type=sublocality_level_1`);
    const data = await response.json();

    const response1 = await fetch(`http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytListInfoInqire?serviceKey=${EXPO_PUBLIC_SERVICE_KEY}&Q0=${data.results[0].address_components[1].long_name}&Q1=${data.results[0].address_components[0].long_name}&QD=${map[diagnoses[0].specialty[0]]}&pageNo=1&numOfRows=100`);
    const text = await response1.text();
    const xmlDoc = parser.parseFromString(text, "application/xml");

    console.log(xmlDoc);
  }

  // Azure OpenAI 서비스를 호출하여 AI 모델의 응답을 받는 함수
  const azureOpenAI = async (messages: ChatCompletionMessageParam[]) => {
    const body: ChatCompletionCreateParamsNonStreaming = {
      model: "gpt-4.1",
      messages,
      // tools,
      max_tokens: 1200,
      temperature: 0.2,
      top_p: 0.3,
      frequency_penalty: 0.1,
      presence_penalty: 0,
      // data_sources: [
      //   {
      //     type: "azure_search",
      //     parameters: {
      //       endpoint: EXPO_PUBLIC_AZURE_SEARCH_ENDPOINT,
      //       index_name: EXPO_PUBLIC_AZURE_SEARCH_INDEX,
      //       authentication: {
      //         type: "api_key",
      //         key: EXPO_PUBLIC_AZURE_SEARCH_KEY,
      //       },
      //       semantic_configuration: EXPO_PUBLIC_SEMENTIC_CONFIGURATION,
      //       query_type: "semantic",
      //     }
      //   }
      // ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "diagnosis",
          schema: {
            type: "object",
            properties: {
              diagnoses: {
                type: "array",
                description: "가능한 진단 목록이다. 각 목록에는 오직 하나의 진단에 대한 내용만 입력한다.",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "진단명"
                    },
                    percentage: {
                      type: "integer",
                      description: "입력된 증상이 해당 진단일 확률 또는 연관성(퍼센트 정수)"
                    },
                    description: {
                      type: "string",
                      description: "증상에 대한 간단한 설명"
                    },
                    firstAid: {
                      type: "array",
                      description: "단계별 응급처치",
                      items: {
                        type: "string",
                        description: "응급처치 상세 내용"
                      },
                    },
                    specialty: {
                      type: "array",
                      description: "해당 증상을 진료할 수 있는 진료과 목록.",
                      items: {
                        type: "string",
                        enum: [
                          "내과", "소아청소년과", "신경과", "정신건강의학과", "피부과", "외과", "흉부외과", "정형외과", "신경외과", "성형외과", "산부인과", "안과", "이비인후과", "비뇨기과", "재활의학과", "마취통증의학과", "영상의학과", "치료방사선과", "임상병리과", "해부병리과", "가정의학과", "핵의학과", "응급의학과", "치과", "구강악안면외과"
                        ],
                      }
                    },
                    severity: {
                      type: "integer",
                      description: "KTAS 기준 응급 중증도 (1: 최중증 ~ 5: 최경증)",
                      enum: [1, 2, 3, 4, 5],
                    }
                  },
                  required: ["symptom", "percentage", "description", "firstAid", "specialty", "severity"]
                }
              },
            }
          }
        }
      }
    }

    // AI 모델 호출
    const completion = await client.chat.completions.create(body);

    return completion;
  };

  return <View style={styles.container}>

  </View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
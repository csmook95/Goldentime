

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
  const [content, setContent] = useState<string>("배가 아프다");
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

    const dutyName = xmlDoc.getElementsByTagName("dutyName");

    let result = "";

    Array.from(dutyName).forEach(({ textContent }) => {
      if (result === "") result = textContent
      else result += `, ${textContent}`
    })

    return result
  }

  const azureOpenAI = async (messages: ChatCompletionMessageParam[]
  ) => {
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

    return completion
  }

  const finalAzureOpenAI = async (messages: ChatCompletionMessageParam[]
  ) => {
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
      // data_sources: [
      //   {
      //     type: "azure_search",
      //     parameters: {
      //       endpoint: azureSearchEndpoint,
      //       index_name: searchIndex,
      //       authentication: {
      //         type: "api_key",
      //         key: azureSearchKey,
      //       },
      //       semantic_configuration: "rag-goldentime-semantic-configuration",
      //       query_type: "semantic",
      //     }
      //   }
      // ]
    })

    return completion
  }

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
  ]

  const onPressConfirm = async (e: GestureResponderEvent) => {
    const dd: ChatCompletionMessageParam[] = [...messages, {
      role: "user",
      content
    }]

    const completion = await azureOpenAI(dd)

    // console.log(completion.choices[0].message)

    // dd.push(completion.choices[0].message)
    dd.push({ role: completion.choices[0].message.role, content: "", tool_calls: completion.choices[0].message.tool_calls })
    // dd.push({
    //   role: "assistant",
    //   tool_calls:completion.choices[0].message.tool_calls
    // })

    console.log(dd)

    if (completion.choices[0].message.tool_calls) {
      const toolCalls = completion.choices[0].message.tool_calls;

      await toolCalls.forEach(async toolCall => {
        const functionName = toolCall.function.name

        let content;

        switch (functionName) {
          case "getEgytLcinfoInqire":
            content = await getEgytLcinfoInqire();
            break;
          default:
            content = ""
            break;
        }
      })

      dd.push({
        role: "tool",
        tool_call_id: toolCalls[0].id,
        content: `{"name":"의료법인명지의료재단명지병원","address":"인천광역시 부평구","tel":"010-4444-2222"}`,
      })

      console.log(dd)

      const completion1 = await finalAzureOpenAI(dd)

      console.log(completion1, completion1.choices[0].message.content)
    }

    setMessages(dd)
  }

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
  </View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
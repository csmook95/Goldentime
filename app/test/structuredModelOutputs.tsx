import { AzureOpenAI } from 'openai';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const {
  EXPO_PUBLIC_ENDPOINT,
  EXPO_PUBLIC_API_KEY
} = process.env

export default function StructuredModelOutputs() {
  const client = new AzureOpenAI({
    endpoint: EXPO_PUBLIC_ENDPOINT,
    apiKey: EXPO_PUBLIC_API_KEY,
    apiVersion: "2025-03-01-preview",
    dangerouslyAllowBrowser: true
  });

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "Extract the event information." },
        {
          role: "user",
          content: "Alice and Bob are going to a science fair on Friday.",
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "event",
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              date: { type: "string" },
              participants: { type: "array", items: { type: "string" } }
            },
          }
        }
      }
    })

    console.log(response.choices[0].message.content)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.paragraph}>{ }</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  paragraph: {
    fontSize: 18,
    textAlign: 'center',
  },
});
import { XMLParser } from "fast-xml-parser";
import { useEffect } from "react";
import { StyleSheet, Text, View } from 'react-native';


export default function XMLParser1() {
  useEffect(() => {
    const init = async () => {
      const parser = new XMLParser();

      const response1 = await fetch(`http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytBassInfoInqire?serviceKey=132fe236a8ba8b7ed37050e2caa445c27a2f0c98225f5424bf30e1a567c9aab5&HPID=A1100043&pageNo=1&nomOfRows=500`)

      const text = await response1.text();
      const xmlDoc = parser.parse(text);

      console.log(xmlDoc.response.body.items.item)
    }

    init()
  }, [])

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
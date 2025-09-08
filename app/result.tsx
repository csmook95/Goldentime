

import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import React from 'react';
import { StyleSheet, View } from "react-native";

export default function Result() {
  return <View style={styles.container}>
    <Text>맹장 의증입니다.</Text>
    <Text>근처 서울삼성병원에서 처치 가능합니다.</Text>
    <Text>서울삼성병원 가용병상은 20석입니다.</Text>
    <Text>전화번호: 02-0000-0000</Text>
    <Text>해당 내용으로 119 호출을 원하시면 호출 버튼을 누르세요.</Text>
    <Button>
      <ButtonText>호출</ButtonText>
    </Button>
  </View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
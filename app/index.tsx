

import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { useRouter } from "expo-router";
import React from 'react';
import { GestureResponderEvent, StyleSheet, View } from "react-native";


export default function Index() {
  const router = useRouter();

  const onPressConfirm = (e: GestureResponderEvent) => {
    router.push("/result")
  }
  const onPressLocation1 = (e: GestureResponderEvent) => {
    router.push("/location1")
  }


  return <View style={styles.container}>
    <Text>증상을 입력하고 확인 버튼을 누르세요.</Text>
    <Textarea
      size="md"
      isReadOnly={false}
      isInvalid={false}
      isDisabled={false}
      className="w-64"
    >
      <TextareaInput placeholder="증상을 입력하세요." />
    </Textarea>
    <Button onPress={onPressConfirm}>
      <ButtonText>확인</ButtonText>
    </Button>
    <Button onPress={onPressLocation1}>
      <ButtonText>location1</ButtonText>
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
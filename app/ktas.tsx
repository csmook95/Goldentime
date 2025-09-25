import { useRouter } from "expo-router";
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function KTASPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            try {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/');
              }
            } catch (error) {
              // console.log('Navigation error:', error);
              router.push('/');
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{"<"}</Text>
        </TouchableOpacity>
        <View style={styles.placeholder} />
      </View>

      {/* 콘텐츠 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>KTAS</Text>
          <Text style={styles.subtitle}>Korean Triage and Acuity Scale</Text>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.description}>
            KTAS(Korean Triage and Acuity Scale)는 환자의 중증도에 따라 1등급부터 5등급까지 분류하여
            응급 진료 우선순위를 정하는 한국형 응급환자 분류도구입니다.
          </Text>
        </View>

        <View style={styles.levelsSection}>
          <View style={[styles.levelCard, styles.level1]}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelNumber}>KTAS 1등급</Text>
              <Text style={styles.levelTime}>즉시</Text>
            </View>
            <Text style={styles.levelDescription}>
              즉각적인 처치가 필요하며 생명이나 사지에 위험이 되는 상태. 심정지, 중증 외상, 무호흡 등이 해당.
            </Text>
          </View>

          <View style={[styles.levelCard, styles.level2]}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelNumber}>KTAS 2등급</Text>
              <Text style={styles.levelTime}>10분 이내</Text>
            </View>
            <Text style={styles.levelDescription}>
              응급 처치가 필요하며 치료 지연 시 심각한 상태로 발전할 가능성이 있는 중증 응급환자. 심근경색, 뇌출혈, 뇌경색, 심한 호흡곤란 등이 해당.
            </Text>
          </View>

          <View style={[styles.levelCard, styles.level3]}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelNumber}>KTAS 3등급</Text>
              <Text style={styles.levelTime}>30분 이내</Text>
            </View>
            <Text style={styles.levelDescription}>
              응급처치가 필요하며 심각한 문제로 진행될 수 있는 중증 응급 의심환자. 흉통, 중등도 복통, 설사 등이 포함될 수 있음.
            </Text>
          </View>

          <View style={[styles.levelCard, styles.level4]}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelNumber}>KTAS 4등급</Text>
              <Text style={styles.levelTime}>1시간 이내</Text>
            </View>
            <Text style={styles.levelDescription}>
              한두 시간 안에 치료나 재평가가 가능한 경증 환자. 발열을 동반한 장염, 요로감염, 두드러기 등이 해당.
            </Text>
          </View>

          <View style={[styles.levelCard, styles.level5]}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelNumber}>KTAS 5등급</Text>
              <Text style={styles.levelTime}>2시간 이내</Text>
            </View>
            <Text style={styles.levelDescription}>
              응급은 아니지만 진료가 필요한 비응급 환자. 감기, 탈수, 심하지 않은 열상, 근육통 등이 해당.
            </Text>
          </View>
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>KTAS 분류의 목적</Text>
          <Text style={styles.noteText}>
            KTAS 분류는 환자의 첫인상 중증도 평가, 주 증상 파악, 활력징후 측정 등 다단계의 정차에 따라 진행됩니다.
            이 분류를 통해 의료진은 환자의 위급도를 신속하게 판단하고, 가장 안전하고 효율적인 진료 순서를 결정하게 됩니다.
          </Text>
        </View>

        <View style={styles.sourceSection}>
          <Text style={styles.sourceText}>출처: 한국응급의학회</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    ...Platform.select({
      web: {
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
        minHeight: '100vh'
      }
    })
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 8,
    paddingHorizontal: 20
  },
  backButton: {
    padding: 8,
    marginLeft: -8
  },
  backButtonText: {
    fontSize: 24,
    color: '#447794',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a73e8'
  },
  placeholder: {
    width: 40
  },
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: -20,
    marginTop: -5
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#061222',
    marginBottom: 8,
    fontFamily: 'serif'
  },
  subtitle: {
    fontSize: 16,
    color: '#061222',
    fontWeight: '600',
    fontFamily: 'serif'
  },
  descriptionSection: {
    paddingVertical: 8,
    marginBottom: 20
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3c4043',
    textAlign: 'center'
  },
  levelsSection: {
    paddingBottom: 24
  },
  levelCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  level1: {
    backgroundColor: '#123249',
    borderLeftWidth: 0
  },
  level2: {
    backgroundColor: '#123249',
    borderLeftWidth: 0
  },
  level3: {
    backgroundColor: '#2D5B75',
    borderLeftWidth: 0
  },
  level4: {
    backgroundColor: '#447794',
    borderLeftWidth: 0
  },
  level5: {
    backgroundColor: '#447794',
    borderLeftWidth: 0
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  levelNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff'
  },
  levelTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff'
  },
  levelDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#ffffff'
  },
  noteSection: {
    backgroundColor: '#b0d4f1',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#061222',
    marginBottom: 12
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#061222'
  },
  sourceSection: {
    alignItems: 'flex-end',
    paddingVertical: 20,
    paddingBottom: 30
  },
  sourceText: {
    fontSize: 12,
    color: '#5f6368',
    fontStyle: 'italic'
  }
});

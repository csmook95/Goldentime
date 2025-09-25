import { Text as GluestackText } from "@/components/ui/text";
import * as Location from "expo-location";
import { XMLParser } from "fast-xml-parser";
import { useEffect, useRef, useState } from "react";
import { Platform, Text as RNText, StyleSheet, View } from "react-native";


const EXPO_PUBLIC_SERVICE_KEY =
  process.env.EXPO_PUBLIC_SERVICE_KEY ||
  "KmDI1pvHgdqiDNQ6qzLEA2QUcrkGoVq5mTtJJPF%2FbEiIRDTkUvG3NURsSfNxr5uBqhRtdEQFDmjWP0S1s8cAwg%3D%3D";

const EXPO_PUBLIC_GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_API_KEY ||
  "AIzaSyAiO0AHB6a-2N4aHczh6_YNvlUsmVRZytQ";

type Diagnosis = {
  /**
   * 진단명
   */
  name: string;
  /**
   * 입력된 증상이 해당 진단일 확률 또는 연관성(퍼센트 정수)
   */
  percentage: number;
  /**
   * 증상에 대한 간단한 설명
   */
  description: string;
  /**
   * 응급처치
   */
  firstAid: string[];
  /**
   * 해당 증상을 진료할 수 있는 진료과 목록
   */
  specialty: specialty[];
  /**
   * KTAS 기준 응급 중증도 (1: 최중증 ~ 5: 최경증)
   */
  severity: severity;
};

type specialty =
  | "내과"
  | "소아청소년과"
  | "신경과"
  | "정신건강의학과"
  | "피부과"
  | "외과"
  | "흉부외과"
  | "정형외과"
  | "신경외과"
  | "성형외과"
  | "산부인과"
  | "안과"
  | "이비인후과"
  | "비뇨기과"
  | "재활의학과"
  | "마취통증의학과"
  | "영상의학과"
  | "치료방사선과"
  | "임상병리과"
  | "해부병리과"
  | "가정의학과"
  | "핵의학과"
  | "응급의학과"
  | "치과"
  | "구강악안면외과";

type severity = 1 | 2 | 3 | 4 | 5;

type hospital = {
  name: string;
  tel: string;
  addr: string;
  hvec: number;
  lat: number;
  lon: number;
  description?: string;
  distance?: string;
  type?: "emergency" | "regional" | "general";
};


// 웹에서만 마진 문제를 해결하는 Text 컴포넌트
const Text =
  Platform.OS === "web"
    ? ({ style, ...props }: any) => {
      // 웹에서는 기본 마진을 0으로 설정하되, 사용자가 지정한 마진은 유지
      const webStyle = Array.isArray(style) ? style : [style];
      return <RNText style={[{ margin: 0 }, ...webStyle]} {...props} />;
    }
    : GluestackText;

// KTAS 중증도에 따른 설명 텍스트 반환
const getSeverityText = (severity: severity): string => {
  switch (severity) {
    case 1:
      return "최중증 - 즉시 치료";
    case 2:
      return "중증 - 10분 이내";
    case 3:
      return "준중증 - 30분 이내";
    case 4:
      return "준경증 - 1시간 이내";
    case 5:
      return "경증 - 2시간 이내";
    default:
      return "미분류";
  }
};
const specialtyMap: { [key: string]: string } = {
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
  구강악안면외과: "D034",
};

export default function Diagnosis1({ diagnosis }: { diagnosis: Diagnosis }) {
  const [hospitals, setHospitals] = useState<hospital[]>([])
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);

  const coords = useRef<{ latitude: number, longitude: number }>(null);

  useEffect(() => {

    const parser = new XMLParser();

    const init = async () => {
      setIsLoadingHospitals(true)

      const location = await Location.getCurrentPositionAsync();

      coords.current = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }

      // Google Maps API를 사용하여 주소 정보 가져오기
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.current.latitude},${coords.current.longitude}&key=${EXPO_PUBLIC_GOOGLE_API_KEY}&result_type=sublocality_level_1&language=ko`
      );

      const data = await response.json();

      const sidoName = data.results[0].address_components[1].long_name;
      const sigunguName = data.results[0].address_components[0].long_name;

      const hpids: string[] = []

      for (let i = 0; i < diagnosis.specialty.length; i++) {
        const specialtyCode = specialtyMap[diagnosis.specialty[i]]

        let range = "지역";

        switch (diagnosis.severity) {
          case 1:
          case 2:
            range = "권역"
            break;
        }

        const response1 = await fetch(`http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytListInfoInqire?serviceKey=${EXPO_PUBLIC_SERVICE_KEY}&Q0=${sidoName}&Q1=${sigunguName}&QD=${specialtyCode}&QZ=A&pageNo=1&numOfRows=500`)

        const text = await response1.text();
        const xmlDoc = parser.parse(text);

        const item = xmlDoc.response.body.items.item;

        let tempHpids = [];

        if (Object.hasOwn(item, "dutyEmclsName")) {
          if (item.dutyEmclsName.includes(range) && !hpids.includes(item.hpid)) tempHpids.push(item.hpid)
        }
        else {
          tempHpids = (item as { dutyEmclsName: string, hpid: string }[])
            .filter(item => item.dutyEmclsName.includes(range))
            .map(item => item.hpid)
            .filter(hpid => !hpids.includes(hpid))
        }


        if (tempHpids.length === 0) {
          const response = await fetch(`http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytListInfoInqire?serviceKey=${EXPO_PUBLIC_SERVICE_KEY}&Q0=${sidoName}&QD=${specialtyCode}&QZ=A&pageNo=1&numOfRows=500`)

          const text = await response.text();
          const xmlDoc = parser.parse(text);
          const item = xmlDoc.response.body.items.item;

          let tempHpids = [];

          if (Object.hasOwn(item, "dutyEmclsName")) {
            if (item.dutyEmclsName.includes(range) && !hpids.includes(item.hpid)) tempHpids.push(item.hpid)
          }
          else {
            tempHpids = (item as { dutyEmclsName: string, hpid: string }[])
              .filter(item => item.dutyEmclsName.includes(range))
              .map(item => item.hpid)
              .filter(hpid => !hpids.includes(hpid))
          }
        }

        hpids.push(...tempHpids);
      }

      for (let i = 0; i < hpids.length; i++) {
        const response = await fetch(`http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytBassInfoInqire?serviceKey=${EXPO_PUBLIC_SERVICE_KEY}&HPID=${hpids[i]}&pageNo=1&nomOfRows=500`)
        const text = await response.text()
        const xmlDoc = parser.parse(text);
        const item = xmlDoc.response.body.items.item
        const textHvec = item.hvec
        const hvec = Number(textHvec)

        if (hvec > 0) setHospitals(prev => [...prev, {
          name: item.dutyName,
          addr: item.dutyAddr,
          tel: item.dutyTel1,
          lat: Number(item.wgs84Lat),
          lon: Number(item.wgs84Lon),
          hvec
        }])
      }

      setIsLoadingHospitals(false)
    }

    init()
  }, [diagnosis])

  const validHospitals = hospitals.map(value => ({ ...value, distance: getDistanceFromLatLonInKm(value.lat, value.lon) }))
    .sort((a, b) => a.distance > b.distance ? 1 : a.distance < b.distance ? -1 : 0)
    .slice(0, 2)

  // 위도, 경도 두 점 간 거리 계산 (단위: km)
  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2 = coords.current!.latitude, lon2 = coords.current!.longitude) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // 거리 (km)

    return Math.round(distance * 100) / 100;
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  // 텍스트 간 불필요 개행/공백을 정리하는 헬퍼
  const tidy = (s?: string) =>
    (s ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/\u00A0/g, " ") // nbsp → space
      .replace(/^[\s\n]+/, "") // 선행 공백/개행 제거
      .replace(/[\s\n]+$/, "") // 후행 공백/개행 제거
      .replace(/\n{2,}/g, "\n"); // 과다 개행 1줄로

  return <View style={styles.diagnosisCard}>
    <Text style={styles.diagnosisName}>
      {diagnosis.name} ({diagnosis.percentage}%)
    </Text>
    <Text style={styles.description}>
      {tidy(diagnosis.description)}
    </Text>
    <Text style={styles.severity}>
      KTAS 중증도: {diagnosis.severity} (
      {getSeverityText(diagnosis.severity)})
    </Text>
    <Text style={styles.specialty}>
      진료과: {diagnosis.specialty.join(", ")}
    </Text>
    <View style={styles.firstAidContainer}>
      <Text style={styles.firstAidTitle}>응급처치:</Text>
      {diagnosis.firstAid && diagnosis.firstAid.length > 0 ? (
        diagnosis.firstAid.map((aid, aidIndex) => (
          <Text key={aidIndex} style={styles.firstAidItem}>
            {aidIndex + 1}. {tidy(aid)}
          </Text>
        ))
      ) : (
        <Text style={styles.firstAidItem}>
          응급처치 정보가 없습니다.
        </Text>
      )}
    </View>
    <View style={styles.hospitalSection}>
      {isLoadingHospitals
        ? <Text style={styles.hospitalTitle}>의료기관 검색 중...</Text>
        : validHospitals.length === 0
          ? null
          : <>
            <Text style={styles.hospitalTitle}>응급 의료 기관 안내</Text>
            {validHospitals.map(hospital => (
              <View key={hospital.name} style={styles.hospitalCard}>
                <Text style={styles.hospitalName}>{hospital.name}</Text>
                <Text style={styles.hospitalAddr}>{hospital.addr}</Text>
                <Text style={styles.hospitalTel}>TEL: {hospital.tel}</Text>
                <Text style={styles.hospitalDistance}>거리: {hospital.distance}km</Text>
              </View>
            ))}
          </>
      }
    </View>
  </View>;
}

const styles = StyleSheet.create({
  diagnosisCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 32,
    marginBottom: 40,
    minHeight: 400,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  diagnosisName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 32,
    lineHeight: 34,
    includeFontPadding: false,
    marginVertical: 0,
  },
  description: {
    fontSize: 18,
    color: "#555",
    marginBottom: 36,
    lineHeight: 32,
    includeFontPadding: false,
    marginVertical: 0,
  },
  severity: {
    fontSize: 20,
    color: "#000000",
    fontWeight: "600",
    marginBottom: 32,
    marginTop: 24,
    lineHeight: 32,
    includeFontPadding: false,
    marginVertical: 0,
  },
  specialty: {
    fontSize: 20,
    color: "#000000",
    marginBottom: 32,
    marginTop: 56,
    lineHeight: 32,
    includeFontPadding: false,
    marginVertical: 0,
  },
  firstAidContainer: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 0,
    marginTop: 48,
  },
  firstAidTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginVertical: 0,
    marginBottom: 16,
    lineHeight: 30,
    includeFontPadding: false,
  },
  firstAidItem: {
    fontSize: 16,
    color: "#333",
    marginVertical: 0,
    marginBottom: 16,
    lineHeight: 30,
    includeFontPadding: false,
  },
  // 병원 추천 관련 스타일
  hospitalSection: {
    marginTop: 8,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  hospitalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    marginTop: 24,
    textAlign: "center",
    lineHeight: 26,
    includeFontPadding: false,
    marginVertical: 0,
  },
  hospitalCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 0,
    minHeight: 120,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    lineHeight: 24,
    includeFontPadding: false,
    marginVertical: 0,
  },
  hospitalAddr: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    lineHeight: 22,
    includeFontPadding: false,
    marginVertical: 0,
  },
  hospitalTel: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    lineHeight: 22,
    marginBottom: 4,
    includeFontPadding: false,
    marginVertical: 0,
  },
  hospitalDistance: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    lineHeight: 20,
    includeFontPadding: false,
    marginVertical: 0,
    marginTop: 4,
  },
});

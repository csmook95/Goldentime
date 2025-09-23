import { Text as GluestackText } from "@/components/ui/text";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AzureOpenAI } from "openai";
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

// 웹에서만 마진 문제를 해결하는 Text 컴포넌트
const Text =
  Platform.OS === "web"
    ? ({ style, ...props }: any) => {
        // 웹에서는 기본 마진을 0으로 설정하되, 사용자가 지정한 마진은 유지
        const webStyle = Array.isArray(style) ? style : [style];
        return <RNText style={[{ margin: 0 }, ...webStyle]} {...props} />;
      }
    : GluestackText;

// 웹에서 환경변수 문제 해결을 위한 직접 설정
const EXPO_PUBLIC_ENDPOINT =
  process.env.EXPO_PUBLIC_ENDPOINT ||
  "https://7aifinal-team5openai5.openai.azure.com/";
const EXPO_PUBLIC_API_KEY =
  process.env.EXPO_PUBLIC_API_KEY ||
  "AWzh5HZRPeKtv0qCr5FPptQiVAKoxGWCPpLHLacsY2DdC9Tu4pZaJQQJ99BIACYeBjFXJ3w3AAABACOGfx4G";
const EXPO_PUBLIC_AZURE_SEARCH_ENDPOINT =
  process.env.EXPO_PUBLIC_AZURE_SEARCH_ENDPOINT ||
  "https://7aifinalteam5aisearch.search.windows.net";
const EXPO_PUBLIC_AZURE_SEARCH_KEY =
  process.env.EXPO_PUBLIC_AZURE_SEARCH_KEY ||
  "NIchObVtcyYpLdQvxHPsRTsAPfLXiD4RQvkWFBKsJFAzSeCDiGNb";
const EXPO_PUBLIC_AZURE_SEARCH_INDEX =
  process.env.EXPO_PUBLIC_AZURE_SEARCH_INDEX || "rawdata-largeembedding-rag";
const EXPO_PUBLIC_SEMENTIC_CONFIGURATION =
  process.env.EXPO_PUBLIC_SEMENTIC_CONFIGURATION ||
  "rawdata-largeembedding-rag-semantic-configuration";
const EXPO_PUBLIC_GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_API_KEY ||
  "AIzaSyAiO0AHB6a-2N4aHczh6_YNvlUsmVRZytQ";
const EXPO_PUBLIC_SERVICE_KEY =
  process.env.EXPO_PUBLIC_SERVICE_KEY ||
  "KmDI1pvHgdqiDNQ6qzLEA2QUcrkGoVq5mTtJJPF%2FbEiIRDTkUvG3NURsSfNxr5uBqhRtdEQFDmjWP0S1s8cAwg%3D%3D";

type hospital = {
  name: string;
  tel: string;
  description: string;
  addr?: string;
  distance?: string;
  type?: "emergency" | "regional" | "general";
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

export default function Result() {
  const router = useRouter();
  const parser = Platform.OS === "web" ? new DOMParser() : null;

  // 텍스트 간 불필요 개행/공백을 정리하는 헬퍼
  const tidy = (s?: string) =>
    (s ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/\u00A0/g, " ") // nbsp → space
      .replace(/^[\s\n]+/, "") // 선행 공백/개행 제거
      .replace(/[\s\n]+$/, "") // 후행 공백/개행 제거
      .replace(/\n{2,}/g, "\n"); // 과다 개행 1줄로

  // Azure OpenAI 클라이언트 초기화
  const client = new AzureOpenAI({
    endpoint: EXPO_PUBLIC_ENDPOINT,
    apiKey: EXPO_PUBLIC_API_KEY,
    apiVersion: "2025-01-01-preview",
    dangerouslyAllowBrowser: true,
  });

  // 디버깅: API 키 확인
  console.log("환경변수 확인:", {
    endpoint: EXPO_PUBLIC_ENDPOINT,
    apiKey: EXPO_PUBLIC_API_KEY ? "설정됨" : "누락",
    hasKey: !!EXPO_PUBLIC_API_KEY,
  });

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [hospitals, setHospitals] = useState<hospital[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const { content } = useLocalSearchParams<{ content: string }>();

  // 디버깅용 로그
  console.log("Result 컴포넌트 렌더링:", {
    contentParam: content,
    diagnosesLength: diagnoses.length,
    hospitalsLength: hospitals.length,
    isLoadingHospitals,
  });

  // content가 없으면 홈으로 리다이렉트
  useEffect(() => {
    if (!content || content.trim() === "") {
      console.log("증상 내용이 없어서 홈으로 리다이렉트");
      router.replace("/");
    }
  }, [content]);

  useEffect(() => {
    initSearch();
  }, []);

  // 웹에서만 진단 결과가 로드되면 스크롤 다운
  useEffect(() => {
    if (Platform.OS === "web" && diagnoses.length > 0) {
      // 여러 방법으로 스크롤 시도
      setTimeout(() => {
        try {
          // 방법 1: window.scrollTo
          window.scrollTo({
            top: Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight
            ),
            behavior: "smooth",
          });

          // 방법 2: scrollIntoView (backup)
          const resultContainer = document.querySelector(
            '[data-testid="result-container"]'
          );
          if (resultContainer) {
            resultContainer.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }

          console.log("스크롤 시도됨 - diagnoses length:", diagnoses.length);
        } catch (error) {
          console.log("스크롤 에러:", error);
        }
      }, 800);
    }
  }, [diagnoses]);

  const initSearch = async () => {
    try {
      // URL 디코딩과 정리
      const cleanContent = content ? decodeURIComponent(content).trim() : "";
      console.log("받은 증상 내용 (원본):", content);
      console.log("받은 증상 내용 (정리됨):", cleanContent);
      console.log("cleanContent 길이:", cleanContent.length);

      // API 키 확인
      if (!EXPO_PUBLIC_ENDPOINT || !EXPO_PUBLIC_API_KEY) {
        console.error("API 키가 설정되지 않았습니다.");
        console.log("Azure OpenAI API 키를 .env 파일에 설정해주세요:");
        console.log(
          "EXPO_PUBLIC_ENDPOINT=https://your-resource.openai.azure.com/"
        );
        console.log("EXPO_PUBLIC_API_KEY=your-api-key-here");
        setDiagnoses([]);
        return;
      }
      // content가 없으면 진단하지 않음
      if (!cleanContent || cleanContent.length === 0) {
        console.error("증상 내용이 비어있습니다. 정리된 내용:", cleanContent);
        setDiagnoses([]);
        return;
      }

      // 위치 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("위치 권한이 거부되었습니다.");
        // 위치 없이도 진단은 가능하도록 계속 진행
      }

      // 현재 위치 정보 가져오기 (선택사항)
      let location = null;
      try {
        location = await Location.getCurrentPositionAsync({});
      } catch (error) {
        console.log("위치 정보를 가져올 수 없습니다:", error);
      }

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
        },
        {
          role: "user",
          content: cleanContent,
        },
      ];

      // AI 모델 호출
      console.log("AI 모델 호출 시작...");
      const completion = await azureOpenAI(newMessages);

      console.log("AI 응답:", completion.choices[0].message.content);

      if (!completion.choices[0].message.content) {
        console.error("AI 응답이 비어있습니다.");
        setDiagnoses([]);
        return;
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(completion.choices[0].message.content);
        console.log("JSON 파싱 성공:", parsedResponse);
      } catch (parseError) {
        console.error("JSON 파싱 오류:", parseError);
        console.error("파싱할 내용:", completion.choices[0].message.content);
        setDiagnoses([]);
        return;
      }

      const diagnoses: Diagnosis[] =
        parsedResponse.diagnoses || parsedResponse.diagnosis || [];

      console.log("파싱된 진단 결과:", diagnoses);
      console.log(
        "diagnoses 타입:",
        typeof diagnoses,
        Array.isArray(diagnoses)
      );

      if (Array.isArray(diagnoses) && diagnoses.length > 0) {
        setDiagnoses(diagnoses);
        console.log("진단 결과 상태 업데이트 완료:", diagnoses.length, "개");
      } else {
        console.log("진단 결과가 비어있거나 유효하지 않습니다.");
        setDiagnoses([]);
      }

      // 위치가 있고 Google API 키가 있을 때만 병원 검색
      if (
        location &&
        EXPO_PUBLIC_GOOGLE_API_KEY &&
        EXPO_PUBLIC_SERVICE_KEY &&
        diagnoses.length > 0
      ) {
        setIsLoadingHospitals(true);
        // 가장 높은 중증도(가장 낮은 숫자)를 찾아서 병원 검색
        const highestSeverityDiagnosis = diagnoses.reduce((prev, current) =>
          prev.severity < current.severity ? prev : current
        );
        console.log(
          "병원 검색에 사용할 진단:",
          highestSeverityDiagnosis.name,
          "중증도:",
          highestSeverityDiagnosis.severity
        );
        await searchNearbyHospitals(location, highestSeverityDiagnosis);
        setIsLoadingHospitals(false);
      }
    } catch (error) {
      console.error("진단 과정에서 오류 발생:", error);
      setDiagnoses([]);
    }
  };

  const searchNearbyHospitals = async (location: any, diagnosis: Diagnosis) => {
    try {
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

      // Google Maps API를 사용하여 주소 정보 가져오기
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${EXPO_PUBLIC_GOOGLE_API_KEY}&result_type=sublocality_level_1`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const sidoName = data.results[0].address_components[1].long_name;
        const sigunguName = data.results[0].address_components[0].long_name;
        const specialtyCode = specialtyMap[diagnosis.specialty[0]];
        const hospitalList = [];

        if (diagnosis.severity >= 5) {
          // 중증도 5 (경증): 일반 의료기관만 조회
          console.log(`중증도 ${diagnosis.severity} - 일반 의료기관 검색`);
          const apiUrl = `http://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire?serviceKey=${EXPO_PUBLIC_SERVICE_KEY}&Q0=${sidoName}&Q1=${sigunguName}&QD=${specialtyCode}&pageNo=1&numOfRows=500`;

          console.log("일반 의료기관 API 호출 URL:", apiUrl);
          const response1 = await fetch(apiUrl);
          const text = await response1.text();
          const xmlDoc = parser?.parseFromString(text, "application/xml");

          const items = xmlDoc?.getElementsByTagName("item");
          if (items) {
            for (let i = 0; i < Math.min(items.length, 50); i++) {
              const item = items[i];
              
              // 여러 태그명을 시도해서 병원 이름 찾기
              const possibleNameTags = ["yadmNm", "dutyName", "hpid", "phpid", "name"];
              let hospitalName = "";
              for (const tag of possibleNameTags) {
                const nameElement = item.getElementsByTagName(tag)[0];
                if (nameElement && nameElement.textContent && nameElement.textContent.trim()) {
                  hospitalName = nameElement.textContent.trim();
                  break;
                }
              }
              
              // 주소와 전화번호도 여러 태그명 시도
              const possibleAddrTags = ["addr", "dutyAddr", "address"];
              let hospitalAddr = "";
              for (const tag of possibleAddrTags) {
                const addrElement = item.getElementsByTagName(tag)[0];
                if (addrElement && addrElement.textContent && addrElement.textContent.trim()) {
                  hospitalAddr = addrElement.textContent.trim();
                  break;
                }
              }
              
              const possibleTelTags = ["telno", "dutyTel1", "tel", "phone"];
              let hospitalTel = "";
              for (const tag of possibleTelTags) {
                const telElement = item.getElementsByTagName(tag)[0];
                if (telElement && telElement.textContent && telElement.textContent.trim()) {
                  hospitalTel = telElement.textContent.trim();
                  break;
                }
              }
              
              const hospital = {
                name: hospitalName,
                addr: hospitalAddr,
                tel: hospitalTel,
                description: "",
                distance: "",
                type: "general",
              };
              console.log("일반 의료기관 추가:", hospital.name, "주소:", hospital.addr, "전화:", hospital.tel);
              hospitalList.push(hospital);
            }
          }
        } else if (diagnosis.severity === 4) {
          // 중증도 4 (준경증): 권역 의료기관만 조회
          console.log(`중증도 ${diagnosis.severity} - 권역 의료기관만 검색`);
          console.log("검색 조건:", { sidoName, sigunguName, specialtyCode });

          const regionalApiUrl = `http://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire?serviceKey=${EXPO_PUBLIC_SERVICE_KEY}&Q0=${sidoName}&Q1=${sigunguName}&QD=${specialtyCode}&pageNo=1&numOfRows=50`;
          console.log("권역 의료기관 API 호출 URL:", regionalApiUrl);

          try {
            const regionalResponse = await fetch(regionalApiUrl);
            const regionalText = await regionalResponse.text();
            const regionalXmlDoc = parser?.parseFromString(
              regionalText,
              "application/xml"
            );

            const regionalItems = regionalXmlDoc?.getElementsByTagName("item");
            console.log(
              "권역 의료기관 검색 결과 개수:",
              regionalItems?.length || 0
            );
            if (regionalItems) {
              for (let i = 0; i < Math.min(regionalItems.length, 50); i++) {
                const item = regionalItems[i];
                
                // 여러 태그명을 시도해서 병원 이름 찾기
                const possibleNameTags = ["yadmNm", "dutyName", "hpid", "phpid", "name"];
                let hospitalName = "";
                for (const tag of possibleNameTags) {
                  const nameElement = item.getElementsByTagName(tag)[0];
                  if (nameElement && nameElement.textContent && nameElement.textContent.trim()) {
                    hospitalName = nameElement.textContent.trim();
                    break;
                  }
                }
                
                // 주소와 전화번호도 여러 태그명 시도
                const possibleAddrTags = ["addr", "dutyAddr", "address"];
                let hospitalAddr = "";
                for (const tag of possibleAddrTags) {
                  const addrElement = item.getElementsByTagName(tag)[0];
                  if (addrElement && addrElement.textContent && addrElement.textContent.trim()) {
                    hospitalAddr = addrElement.textContent.trim();
                    break;
                  }
                }
                
                const possibleTelTags = ["telno", "dutyTel1", "tel", "phone"];
                let hospitalTel = "";
                for (const tag of possibleTelTags) {
                  const telElement = item.getElementsByTagName(tag)[0];
                  if (telElement && telElement.textContent && telElement.textContent.trim()) {
                    hospitalTel = telElement.textContent.trim();
                    break;
                  }
                }
                
                const hospital = {
                  name: hospitalName,
                  addr: hospitalAddr,
                  tel: hospitalTel,
                  description: "",
                  distance: "",
                  type: "regional",
                };
                console.log("권역 의료기관 추가:", hospital.name, "주소:", hospital.addr, "전화:", hospital.tel);
                hospitalList.push(hospital);
              }
            }
          } catch (error) {
            console.error("권역 의료기관 검색 오류:", error);
          }
        } else {
          // 중증도 1-3: 응급의료기관과 권역 의료기관 모두 조회
          console.log(
            `중증도 ${diagnosis.severity} - 응급의료기관 및 권역 의료기관 검색`
          );
          console.log("검색 조건:", { sidoName, sigunguName, specialtyCode });

          // 1. 응급의료기관 조회
          const emergencyApiUrl = `http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytListInfoInqire?serviceKey=${EXPO_PUBLIC_SERVICE_KEY}&Q0=${sidoName}&Q1=${sigunguName}&QD=${specialtyCode}&pageNo=1&numOfRows=5000`;
          console.log("응급의료기관 API 호출 URL:", emergencyApiUrl);

          try {
            const emergencyResponse = await fetch(emergencyApiUrl);
            const emergencyText = await emergencyResponse.text();
            const emergencyXmlDoc = parser?.parseFromString(
              emergencyText,
              "application/xml"
            );

            const emergencyItems =
              emergencyXmlDoc?.getElementsByTagName("item");
            console.log(
              "응급의료기관 검색 결과 개수:",
              emergencyItems?.length || 0
            );
            console.log("응급의료기관 API 전체 응답:", emergencyText);
            if (emergencyItems) {
              console.log("응급의료기관 실제 처리할 개수:", Math.min(emergencyItems.length, 50));
              for (let i = 0; i < Math.min(emergencyItems.length, 50); i++) {
                const item = emergencyItems[i];
                // 여러 태그명을 시도해서 병원 이름 찾기
                const possibleNameTags = ["dutyName", "yadmNm", "hpid", "phpid", "name"];
                let hospitalName = "";
                for (const tag of possibleNameTags) {
                  const nameElement = item.getElementsByTagName(tag)[0];
                  if (nameElement && nameElement.textContent && nameElement.textContent.trim()) {
                    hospitalName = nameElement.textContent.trim();
                    break;
                  }
                }
                
                // 주소와 전화번호도 여러 태그명 시도
                const possibleAddrTags = ["dutyAddr", "addr", "address"];
                let hospitalAddr = "";
                for (const tag of possibleAddrTags) {
                  const addrElement = item.getElementsByTagName(tag)[0];
                  if (addrElement && addrElement.textContent && addrElement.textContent.trim()) {
                    hospitalAddr = addrElement.textContent.trim();
                    break;
                  }
                }
                
                const possibleTelTags = ["dutyTel1", "telno", "tel", "phone"];
                let hospitalTel = "";
                for (const tag of possibleTelTags) {
                  const telElement = item.getElementsByTagName(tag)[0];
                  if (telElement && telElement.textContent && telElement.textContent.trim()) {
                    hospitalTel = telElement.textContent.trim();
                    break;
                  }
                }
                
                const hospital = {
                  name: hospitalName,
                  addr: hospitalAddr,
                  tel: hospitalTel,
                  description: "",
                  distance: item.getElementsByTagName("distance")[0]?.textContent || "",
                  type: "emergency",
                };
                console.log("응급의료기관 추가:", hospital.name, "주소:", hospital.addr, "전화:", hospital.tel);
                hospitalList.push(hospital);
              }
            }
          } catch (error) {
            console.error("응급의료기관 검색 오류:", error);
          }

          // 2. 권역 의료기관 조회 (일반 의료기관 API 사용)
          const regionalApiUrl = `http://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire?serviceKey=${EXPO_PUBLIC_SERVICE_KEY}&Q0=${sidoName}&Q1=${sigunguName}&QD=${specialtyCode}&pageNo=1&numOfRows=50`;
          console.log("권역 의료기관 API 호출 URL:", regionalApiUrl);

          try {
            const regionalResponse = await fetch(regionalApiUrl);
            const regionalText = await regionalResponse.text();
            const regionalXmlDoc = parser?.parseFromString(
              regionalText,
              "application/xml"
            );

            const regionalItems = regionalXmlDoc?.getElementsByTagName("item");
            console.log(
              "권역 의료기관 검색 결과 개수:",
              regionalItems?.length || 0
            );
            console.log("권역 의료기관 API 전체 응답:", regionalText);
            if (regionalItems) {
              console.log("권역 의료기관 실제 처리할 개수:", Math.min(regionalItems.length, 50));
              for (let i = 0; i < Math.min(regionalItems.length, 50); i++) {
                const item = regionalItems[i];
                
                // 여러 태그명을 시도해서 병원 이름 찾기
                const possibleNameTags = ["yadmNm", "dutyName", "hpid", "phpid", "name"];
                let hospitalName = "";
                for (const tag of possibleNameTags) {
                  const nameElement = item.getElementsByTagName(tag)[0];
                  if (nameElement && nameElement.textContent && nameElement.textContent.trim()) {
                    hospitalName = nameElement.textContent.trim();
                    break;
                  }
                }
                
                // 주소와 전화번호도 여러 태그명 시도
                const possibleAddrTags = ["addr", "dutyAddr", "address"];
                let hospitalAddr = "";
                for (const tag of possibleAddrTags) {
                  const addrElement = item.getElementsByTagName(tag)[0];
                  if (addrElement && addrElement.textContent && addrElement.textContent.trim()) {
                    hospitalAddr = addrElement.textContent.trim();
                    break;
                  }
                }
                
                const possibleTelTags = ["telno", "dutyTel1", "tel", "phone"];
                let hospitalTel = "";
                for (const tag of possibleTelTags) {
                  const telElement = item.getElementsByTagName(tag)[0];
                  if (telElement && telElement.textContent && telElement.textContent.trim()) {
                    hospitalTel = telElement.textContent.trim();
                    break;
                  }
                }
                
                const hospital = {
                  name: hospitalName,
                  addr: hospitalAddr,
                  tel: hospitalTel,
                  description: "",
                  distance: "",
                  type: "regional",
                };
                console.log("권역 의료기관 추가:", hospital.name, "주소:", hospital.addr, "전화:", hospital.tel);
                hospitalList.push(hospital);
              }
            }
          } catch (error) {
            console.error("권역 의료기관 검색 오류:", error);
          }
        }

        setHospitals(hospitalList);
        console.log("최종 병원 목록:", hospitalList);
        console.log("병원 타입별 개수:", {
          emergency: hospitalList.filter((h) => h.type === "emergency").length,
          regional: hospitalList.filter((h) => h.type === "regional").length,
          general: hospitalList.filter((h) => h.type === "general").length,
        });
      }
    } catch (error) {
      console.error("병원 검색 중 오류 발생:", error);
    }
  };

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
                description:
                  "가능한 진단 목록이다. 각 목록에는 오직 하나의 진단에 대한 내용만 입력한다.",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "진단명",
                    },
                    percentage: {
                      type: "integer",
                      description:
                        "입력된 증상이 해당 진단일 확률 또는 연관성(퍼센트 정수)",
                    },
                    description: {
                      type: "string",
                      description: "증상에 대한 간단한 설명",
                    },
                    firstAid: {
                      type: "array",
                      description: "단계별 응급처치",
                      items: {
                        type: "string",
                        description: "응급처치 상세 내용",
                      },
                    },
                    specialty: {
                      type: "array",
                      description: "해당 증상을 진료할 수 있는 진료과 목록.",
                      items: {
                        type: "string",
                        enum: [
                          "내과",
                          "소아청소년과",
                          "신경과",
                          "정신건강의학과",
                          "피부과",
                          "외과",
                          "흉부외과",
                          "정형외과",
                          "신경외과",
                          "성형외과",
                          "산부인과",
                          "안과",
                          "이비인후과",
                          "비뇨기과",
                          "재활의학과",
                          "마취통증의학과",
                          "영상의학과",
                          "치료방사선과",
                          "임상병리과",
                          "해부병리과",
                          "가정의학과",
                          "핵의학과",
                          "응급의학과",
                          "치과",
                          "구강악안면외과",
                        ],
                      },
                    },
                    severity: {
                      type: "integer",
                      description:
                        "KTAS 기준 응급 중증도 (1: 최중증 ~ 5: 최경증)",
                      enum: [1, 2, 3, 4, 5],
                    },
                  },
                  required: [
                    "name",
                    "percentage",
                    "description",
                    "firstAid",
                    "specialty",
                    "severity",
                  ],
                },
              },
            },
          },
        },
      },
    };

    // AI 모델 호출
    const completion = await client.chat.completions.create(body);

    return completion;
  };

  const renderDiagnoses = () => {
    if (diagnoses.length === 0) {
      return <Text style={styles.loading}>AI 진단 중...</Text>;
    }

    // 유효한 진단만 필터링 (이름과 설명이 있는 진단만)
    const validDiagnoses = diagnoses.filter(
      (diagnosis) =>
        diagnosis.name &&
        diagnosis.name.trim() !== "" &&
        diagnosis.description &&
        diagnosis.description.trim() !== ""
    );

    if (validDiagnoses.length === 0) {
      return <Text style={styles.noResult}>진단 결과를 찾을 수 없습니다.</Text>;
    }

    return (
      <View
        style={styles.resultContainer}
        {...(Platform.OS === "web" && { "data-testid": "result-container" })}
      >
        {validDiagnoses.map((diagnosis, index) => (
          <View key={index} style={styles.diagnosisCard}>
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
          </View>
        ))}
      </View>
    );
  };

  const renderHospitals = () => {
    if (isLoadingHospitals) {
      return (
        <View style={styles.hospitalSection}>
          <Text style={styles.hospitalTitle}>지역 의료기관 검색 중...</Text>
        </View>
      );
    }

    if (hospitals.length > 0) {
      // 병원을 타입별로 분류
      const emergencyHospitals = hospitals.filter(
        (h) => h.type === "emergency"
      );
      const regionalHospitals = hospitals.filter((h) => h.type === "regional");
      const generalHospitals = hospitals.filter((h) => h.type === "general");

      console.log("렌더링할 병원 분류:", {
        total: hospitals.length,
        emergency: emergencyHospitals.length,
        regional: regionalHospitals.length,
        general: generalHospitals.length,
      });

      // 중증도에 따른 병원 섹션 제목 결정
      const getHospitalTitle = () => {
        if (diagnoses.length > 0) {
          // 가장 높은 중증도(가장 낮은 숫자)를 찾기
          const highestSeverityDiagnosis = diagnoses.reduce((prev, current) =>
            prev.severity < current.severity ? prev : current
          );
          const severity = highestSeverityDiagnosis.severity;
          if (severity >= 4) {
            return "가까운 지역 의료기관";
          } else {
            return "응급 의료 기관 안내";
          }
        }
        return "지역 의료기관";
      };

      // 유효한 병원만 필터링 (이름이 있는 병원만)
      const validHospitals = hospitals.filter(
        (hospital) => hospital.name && hospital.name.trim() !== ""
      );

      console.log("전체 병원 개수:", hospitals.length);
      console.log("유효한 병원 개수:", validHospitals.length);
      console.log("필터링된 병원들:", hospitals.map(h => ({ name: h.name, hasName: !!h.name })));

      if (validHospitals.length === 0) {
        return null; // 유효한 병원이 없으면 아무것도 표시하지 않음
      }

      return (
        <View style={styles.hospitalSection}>
          <Text style={styles.hospitalTitle}>{getHospitalTitle()}</Text>
          {validHospitals.map((hospital, index) => (
            <View key={index} style={styles.hospitalCard}>
              <Text style={styles.hospitalName}>{hospital.name}</Text>
              {hospital.addr && hospital.addr.trim() !== "" && (
                <Text style={styles.hospitalAddr}>{hospital.addr}</Text>
              )}
              {hospital.tel && hospital.tel.trim() !== "" && (
                <Text style={styles.hospitalTel}>TEL: {hospital.tel}</Text>
              )}
              {hospital.distance && hospital.distance.trim() !== "" && (
                <Text style={styles.hospitalDistance}>
                  거리: {hospital.distance}m
                </Text>
              )}
            </View>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
      }}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              try {
                console.log("뒤로가기 버튼 클릭");
                router.replace("/");
              } catch (error) {
                console.error("뒤로가기 에러:", error);
                // 에러 발생시 강제로 홈으로 이동
                if (Platform.OS === "web") {
                  window.location.href = "/";
                } else {
                  router.replace("/");
                }
              }
            }}
          >
            <Text style={styles.backButtonText}>&lt;</Text>
          </TouchableOpacity>
          <Text style={styles.title}>진단 결과</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.symptom}>증상: {content ? decodeURIComponent(content) : "증상 정보 없음"}</Text>
        {renderDiagnoses()}
        {renderHospitals()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    ...Platform.select({
      web: {
        maxWidth: 400,
        alignSelf: "center" as const,
        width: "100%",
        minHeight: "100vh" as any,
      },
    }),
  },
  content: {
    paddingVertical: 0,
    alignItems: "stretch",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 24,
    color: "#447794",
    fontWeight: "bold",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    lineHeight: 32,
    includeFontPadding: false,
    marginVertical: 0,
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  symptom: {
    fontSize: 14,
    marginBottom: 100,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    includeFontPadding: false,
    marginVertical: 0,
  },
  loading: {
    fontSize: 16,
    color: "#007AFF",
    marginTop: 20,
  },
  noResult: {
    fontSize: 14,
    color: "#999",
    marginTop: 20,
    textAlign: "center",
  },
  resultContainer: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
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

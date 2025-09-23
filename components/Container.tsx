// components/Container.tsx
import { View, type PropsWithChildren } from 'react-native';

/**
 * 공통 레이아웃 컨테이너
 * - 모바일: 가득 채움
 * - 데스크톱/큰 화면: 최대 720px로 중앙 정렬
 * - 기본 좌우/상하 패딩 포함
 */
export default function Container({ children }: PropsWithChildren) {
  return (
    <View className="mx-auto w-full max-w-[720px] px-4 py-4">
      {children}
    </View>
  );
}


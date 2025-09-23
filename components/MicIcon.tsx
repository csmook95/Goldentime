import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface MicIconProps {
  size?: number;
  color?: string;
}

const MicIcon: React.FC<MicIconProps> = ({ size = 20, color = '#1a73e8' }) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 마이크 캡슐 헤드 - 윈도우 스타일 */}
        <Rect
          x="9"
          y="3"
          width="6"
          height="10"
          rx="3"
          ry="3"
          fill={color}
        />
        {/* 마이크 스탠드 곡선 */}
        <Path
          d="M6 11c0 3.31 2.69 6 6 6s6-2.69 6-6"
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* 마이크 스탠드 세로선 */}
        <Path
          d="M12 17v3"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* 마이크 베이스 라인 */}
        <Path
          d="M9 20h6"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

export default MicIcon;

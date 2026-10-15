import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

export interface PodNode {
  id: string;
  name: string;
  en: string;
  count: number;
  icon: string;
  color: string;
  cx: number;
  cy: number;
}

interface NeuralCanvasEngineProps {
  viewMode: 'overview' | 'expanded';
  activePodId: string;
  pods: PodNode[];
  branchCount: number;
  onPodClick?: (podId: string) => void;
  width?: number;
  height?: number;
}

export const NeuralCanvasEngine: React.FC<NeuralCanvasEngineProps> = ({
  viewMode,
  activePodId,
  pods,
}) => {
  return (
    <View style={styles.container}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 1000 600">
        <Defs>
          <RadialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#000" stopOpacity="1" />
            <Stop offset="70%" stopColor="#F59E0B" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="500" cy="300" r="50" fill="url(#coreGlow)" />
        {pods.map((p) => (
          <Line
            key={p.id}
            x1="500"
            y1="300"
            x2={p.cx}
            y2={p.cy}
            stroke={p.color}
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    zIndex: 1,
  },
});

import React from 'react';
import { Platform } from 'react-native';

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

export interface NeuralCanvasEngineProps {
  viewMode: 'overview' | 'expanded';
  activePodId: string;
  pods: PodNode[];
  branchCount: number;
  onPodClick?: (podId: string) => void;
  width?: number;
  height?: number;
}

export const NeuralCanvasEngine: React.FC<NeuralCanvasEngineProps> = (props) => {
  if (Platform.OS === 'web') {
    const WebEngine = require('./NeuralCanvasEngine.web').NeuralCanvasEngine;
    return <WebEngine {...props} />;
  }
  const NativeEngine = require('./NeuralCanvasEngine.native').NeuralCanvasEngine;
  return <NativeEngine {...props} />;
};

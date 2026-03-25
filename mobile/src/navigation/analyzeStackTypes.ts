import type { PredictionResponse } from '../types/api';

/** Analyze tab stack + same routes duplicated on root stack (sidebar legacy). */
export type AnalyzeStackParamList = {
  Home: undefined;
  Result: { imageUri: string; result: PredictionResponse };
  Feedback: {
    predicted_label: string;
    correct_label: string;
    confidence: number;
    imageUri?: string;
  };
  History: undefined;
};

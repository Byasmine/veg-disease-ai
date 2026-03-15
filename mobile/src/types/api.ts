/** Backend prediction response (POST /predict-with-reasoning) */
export interface PredictionResponse {
  status: 'Success' | 'Uncertain' | 'Failure';
  prediction: string;
  confidence: number;
  top_k: Array<{ label: string; confidence: number }>;
  diagnostic_report: {
    summary: string;
    recommended_treatment: string;
  };
  agent_decision: {
    review_needed: boolean;
    reason: string;
    next_action: string;
  };
  model_version: string;
  inference_time_ms: number;
  llm_reasoning: {
    reasoning: string;
    recommendation: string;
    verdict: string;
    error?: string;
  } | null;
}

/** Payload for POST /feedback */
export interface FeedbackPayload {
  predicted_label: string;
  correct_label: string;
  confidence: number;
  user_comment?: string;
}

export interface FeedbackResponse {
  status: string;
  case_id: string;
  message: string;
  image_url?: string | null;
  image_uploaded?: boolean;
}

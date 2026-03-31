/** Backend prediction response (POST /predict-with-reasoning) */
export interface RecommendedProductHint {
  name: string;
  reason: string;
  shop_query: string;
}

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
  recommended_products?: RecommendedProductHint[];
  model_version: string;
  model_file?: string;
  inference_time_ms: number;
  uncertainty?: {
    top2_margin: number;
    entropy_norm: number;
  };
  decision?: {
    engine: string;
    weights: { model: number; rule: number; llm: number };
    scores: {
      model_confidence: number;
      rule_score: number;
      llm_score: number;
      fused_score: number;
      top2_margin?: number;
      entropy_norm?: number;
    };
    final_status: 'Success' | 'Uncertain' | 'Failure';
    workflow_decision?: 'ACCEPTED' | 'REVIEW' | 'REJECTED';
  };
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

import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config';
import type { FeedbackPayload, FeedbackResponse, PredictionResponse } from '../types/api';

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { Accept: 'application/json' },
});

/**
 * Build FormData for image upload (handles web blob vs native URI).
 * @param fileFieldName - form field name for the file ('file' for predict, 'image' for feedback/with-image)
 */
async function buildImageFormData(uri: string, fileFieldName: 'file' | 'image' = 'file'): Promise<FormData> {
  const formData = new FormData();
  if (Platform.OS === 'web' && (uri.startsWith('blob:') || uri.startsWith('http'))) {
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append(fileFieldName, blob, 'image.jpg');
  } else {
    const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
    formData.append(fileFieldName, {
      uri: fileUri,
      name: 'image.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
  }
  return formData;
}

/**
 * POST /predict-with-reasoning — send image, get diagnosis + AI reasoning.
 */
export async function predictWithReasoning(imageUri: string): Promise<PredictionResponse> {
  const formData = await buildImageFormData(imageUri);
  const { data } = await client.post<PredictionResponse>('/predict-with-reasoning', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/**
 * GET /labels — list of disease labels for feedback form dropdown.
 */
export async function getLabels(): Promise<string[]> {
  const { data } = await client.get<string[]>('/labels');
  return Array.isArray(data) ? data : [];
}

/**
 * POST /feedback — submit correct label and optional comment (no image).
 */
export async function sendFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
  const { data } = await client.post<FeedbackResponse>('/feedback', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

/**
 * POST /admin/clear-all — clear all feedback cases, retraining candidates, and Cloudinary feedback images.
 */
export async function clearAllStoredData(): Promise<{ feedback_deleted: number; retraining_deleted: number; cloudinary_deleted: boolean }> {
  const { data } = await client.post<{
    status: string;
    feedback_deleted: number;
    retraining_deleted: number;
    cloudinary_deleted: boolean;
  }>('/admin/clear-all');
  return {
    feedback_deleted: data.feedback_deleted ?? 0,
    retraining_deleted: data.retraining_deleted ?? 0,
    cloudinary_deleted: data.cloudinary_deleted ?? false,
  };
}

/**
 * POST /feedback/with-image — submit feedback with image; image is uploaded to Cloudinary when configured.
 */
export async function sendFeedbackWithImage(
  payload: FeedbackPayload,
  imageUri: string
): Promise<FeedbackResponse> {
  const formData = await buildImageFormData(imageUri, 'image');
  formData.append('predicted_label', payload.predicted_label);
  formData.append('correct_label', payload.correct_label);
  formData.append('confidence', String(payload.confidence));
  if (payload.user_comment) formData.append('user_comment', payload.user_comment);

  const { data } = await client.post<FeedbackResponse>('/feedback/with-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

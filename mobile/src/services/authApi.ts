import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { SHOP_API_BASE_URL } from '../config';
import { getAccessToken } from './authSession';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
};

export type RegisterProfilePayload = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country?: string;
};

const authClient = axios.create({
  baseURL: `${SHOP_API_BASE_URL}/api/auth`,
  timeout: 30000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

authClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const userClient = axios.create({
  baseURL: `${SHOP_API_BASE_URL}/api/user`,
  timeout: 60000,
  headers: { Accept: 'application/json' },
});

userClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Multipart boundary must be set by the runtime; a preset Content-Type breaks multer (req.file missing).
  if (config.data instanceof FormData) {
    const h = config.headers;
    if (h && typeof (h as { delete?: (k: string) => void }).delete === 'function') {
      (h as { delete: (k: string) => void }).delete('Content-Type');
    } else {
      delete (config.headers as Record<string, unknown>)['Content-Type'];
    }
  }
  return config;
});

function messageFromError(e: unknown, fallback: string): string {
  if (isAxiosError(e)) {
    const m = e.response?.data;
    if (m && typeof m === 'object' && 'message' in m && typeof (m as { message: unknown }).message === 'string') {
      return (m as { message: string }).message;
    }
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export async function registerStart(payload: RegisterProfilePayload): Promise<{ email: string; message: string }> {
  try {
    const { data } = await authClient.post<{ email: string; message: string }>('/register', {
      email: payload.email.trim(),
      password: payload.password,
      fullName: payload.fullName,
      phone: payload.phone,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2 || '',
      city: payload.city,
      postalCode: payload.postalCode,
      country: payload.country || 'US',
    });
    return data;
  } catch (e) {
    throw new Error(messageFromError(e, 'Could not start registration'));
  }
}

export async function verifySignupRequest(
  email: string,
  code: string
): Promise<{ user: AuthUser; token: string }> {
  try {
    const { data } = await authClient.post<{ user: AuthUser; token: string }>('/verify-signup', {
      email: email.trim(),
      code: code.trim(),
    });
    return data;
  } catch (e) {
    throw new Error(messageFromError(e, 'Verification failed'));
  }
}

export async function resendSignupOtpRequest(email: string): Promise<{ message: string }> {
  try {
    const { data } = await authClient.post<{ message: string }>('/resend-signup-otp', { email: email.trim() });
    return data;
  } catch (e) {
    throw new Error(messageFromError(e, 'Could not resend code'));
  }
}

export async function loginRequest(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  try {
    const { data } = await authClient.post<{ user: AuthUser; token: string }>('/login', {
      email: email.trim(),
      password,
    });
    return data;
  } catch (e) {
    throw new Error(messageFromError(e, 'Could not sign in'));
  }
}

export async function forgotPasswordRequest(email: string): Promise<{ message: string }> {
  try {
    const { data } = await authClient.post<{ message: string }>('/forgot-password', { email: email.trim() });
    return data;
  } catch (e) {
    throw new Error(messageFromError(e, 'Could not send reset email'));
  }
}

export async function resetPasswordRequest(
  email: string,
  code: string,
  newPassword: string
): Promise<{ message: string }> {
  try {
    const { data } = await authClient.post<{ message: string }>('/reset-password', {
      email: email.trim(),
      code: code.trim(),
      newPassword,
    });
    return data;
  } catch (e) {
    throw new Error(messageFromError(e, 'Could not reset password'));
  }
}

export async function changePasswordRequest(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  try {
    const { data } = await authClient.post<{ message: string }>('/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  } catch (e) {
    throw new Error(messageFromError(e, 'Could not change password'));
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const { data } = await authClient.get<{ user: AuthUser }>('/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function patchProfileRequest(patch: Partial<{
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
}>): Promise<{ user: AuthUser }> {
  try {
    const { data } = await userClient.patch<{ user: AuthUser }>('/profile', patch);
    return data;
  } catch (e) {
    throw new Error(messageFromError(e, 'Could not update profile'));
  }
}

async function buildAvatarFormData(localUri: string): Promise<FormData> {
  const formData = new FormData();
  const baseName =
    localUri.split('/').pop()?.split('?')[0]?.replace(/[^a-zA-Z0-9._-]/g, '') || 'avatar.jpg';
  const ext = baseName.includes('.') ? baseName.split('.').pop()?.toLowerCase() : undefined;
  const type =
    ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'gif'
          ? 'image/gif'
          : 'image/jpeg';
  const filename = baseName.includes('.') ? baseName : `avatar.${ext === 'png' ? 'png' : 'jpg'}`;

  if (Platform.OS === 'web' && (localUri.startsWith('blob:') || localUri.startsWith('http'))) {
    const res = await fetch(localUri);
    const blob = await res.blob();
    formData.append('photo', blob, filename);
    return formData;
  }

  // Native: keep content:// and file:// as returned by ImagePicker (do not prefix file:// onto content://).
  let uri = localUri;
  if (Platform.OS !== 'web' && !uri.includes('://')) {
    uri = `file://${uri}`;
  }

  formData.append('photo', {
    uri,
    name: filename,
    type,
  } as unknown as Blob);
  return formData;
}

export async function uploadAvatarRequest(localUri: string): Promise<{ user: AuthUser }> {
  if (!getAccessToken()) throw new Error('Not signed in');

  const form = await buildAvatarFormData(localUri);

  try {
    const { data } = await userClient.post<{ user: AuthUser }>('/avatar', form, {
      timeout: 120000,
    });
    return data;
  } catch (e) {
    throw new Error(messageFromError(e, 'Could not upload photo'));
  }
}

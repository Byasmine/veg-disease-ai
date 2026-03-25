import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
  fetchMe,
  loginRequest,
  registerStart,
  verifySignupRequest,
  resendSignupOtpRequest,
  changePasswordRequest,
  patchProfileRequest,
  uploadAvatarRequest,
  type AuthUser,
  type RegisterProfilePayload,
} from '../services/authApi';
import { loadStoredToken, saveStoredToken } from '../services/authStorage';
import { setAccessToken } from '../services/authSession';

type AuthContextValue = {
  user: AuthUser | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Starts registration; returns server message. Caller should navigate to email verification. */
  startRegistration: (payload: RegisterProfilePayload) => Promise<{ email: string; message: string }>;
  completeVerification: (email: string, code: string) => Promise<void>;
  resendSignupOtp: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (patch: Parameters<typeof patchProfileRequest>[0]) => Promise<void>;
  uploadAvatar: (localUri: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refreshUser = useCallback(async () => {
    const me = await fetchMe();
    if (me) setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await loadStoredToken();
      if (cancelled) return;
      setAccessToken(token);
      if (!token) {
        setUser(null);
        setInitializing(false);
        return;
      }
      const me = await fetchMe();
      if (cancelled) return;
      if (me) {
        setUser(me);
      } else {
        setAccessToken(null);
        await saveStoredToken(null);
        setUser(null);
      }
      setInitializing(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: nextUser, token } = await loginRequest(email, password);
    setAccessToken(token);
    await saveStoredToken(token);
    setUser(nextUser);
  }, []);

  const startRegistration = useCallback(async (payload: RegisterProfilePayload) => {
    return registerStart(payload);
  }, []);

  const completeVerification = useCallback(async (email: string, code: string) => {
    const { user: nextUser, token } = await verifySignupRequest(email, code);
    setAccessToken(token);
    await saveStoredToken(token);
    setUser(nextUser);
  }, []);

  const resendSignupOtp = useCallback(async (email: string) => {
    await resendSignupOtpRequest(email);
  }, []);

  const signOutUser = useCallback(async () => {
    setAccessToken(null);
    await saveStoredToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch: Parameters<typeof patchProfileRequest>[0]) => {
    const { user: next } = await patchProfileRequest(patch);
    setUser(next);
  }, []);

  const uploadAvatar = useCallback(async (localUri: string) => {
    const { user: next } = await uploadAvatarRequest(localUri);
    setUser(next);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await changePasswordRequest(currentPassword, newPassword);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      signIn,
      startRegistration,
      completeVerification,
      resendSignupOtp,
      signOutUser,
      refreshUser,
      updateProfile,
      uploadAvatar,
      changePassword,
    }),
    [
      user,
      initializing,
      signIn,
      startRegistration,
      completeVerification,
      resendSignupOtp,
      signOutUser,
      refreshUser,
      updateProfile,
      uploadAvatar,
      changePassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { AuthUser };

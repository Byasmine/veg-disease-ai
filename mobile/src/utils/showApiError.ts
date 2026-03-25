import Toast from 'react-native-toast-message';

function messageFromUnknown(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  const maybeAny = e as any;
  const m = maybeAny?.response?.data?.message;
  if (typeof m === 'string' && m.trim().length > 0) return m;
  return fallback;
}

export function showErrorToast(e: unknown, opts?: { title?: string; fallback?: string }) {
  const title = opts?.title ?? 'Something went wrong';
  const fallback = opts?.fallback ?? 'Request failed. Please try again.';
  const message = messageFromUnknown(e, fallback);
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
  });
}


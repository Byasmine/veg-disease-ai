import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigateRoot(name: string, params?: object) {
  if (navigationRef.isReady()) {
    (navigationRef as { navigate: (n: string, p?: object) => void }).navigate(name, params);
  }
}

type NavLike = {
  getParent?: () => NavLike | undefined;
  navigate?: (name: string) => void;
};

/** From a screen inside MainTabs (tab → root stack = two parents). */
export function goToAuth(navigation: NavLike | undefined) {
  const root = navigation?.getParent?.()?.getParent?.();
  if (root?.navigate) {
    root.navigate('Auth');
  } else {
    navigateRoot('Auth');
  }
}

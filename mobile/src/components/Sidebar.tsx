import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSidebar } from '../context/SidebarContext';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const SIDEBAR_WIDTH = 280;
const OVERLAY_OPACITY = 0.5;

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface SidebarItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: keyof RootStackParamList;
  params?: object;
}

const ITEMS: SidebarItem[] = [
  { icon: 'home-outline', label: 'Welcome', route: 'Welcome' },
  { icon: 'scan-outline', label: 'Analyze', route: 'Home' },
  { icon: 'storefront-outline', label: 'Shop', route: 'Shop' },
  { icon: 'cart-outline', label: 'Cart', route: 'Cart' },
  { icon: 'receipt-outline', label: 'Orders', route: 'Orders' },
  { icon: 'time-outline', label: 'History', route: 'History' },
  { icon: 'help-circle-outline', label: 'Help', route: 'Help' },
  { icon: 'information-circle-outline', label: 'About', route: 'About' },
];

export function Sidebar() {
  const navigation = useNavigation<Nav>();
  const { isOpen, closeSidebar } = useSidebar();
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withTiming(0, { duration: 250 });
      overlayOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 220 });
      overlayOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [isOpen]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value * OVERLAY_OPACITY,
  }));

  const handleNavigate = (item: SidebarItem) => {
    closeSidebar();
    const nav = navigation as any;
    if (item.route === 'Home') {
      nav.replace('Home');
    } else if (item.route === 'Welcome') {
      nav.navigate('Welcome');
    } else {
      nav.navigate(item.route, item.params);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={closeSidebar} disabled={!isOpen}>
        <Animated.View
          style={[styles.overlay, overlayStyle]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.sidebar, sidebarStyle]} pointerEvents={isOpen ? 'auto' : 'none'}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Menu</Text>
          <TouchableOpacity onPress={closeSidebar} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={colors.textOnOlive} />
          </TouchableOpacity>
        </View>
        <View style={styles.menu}>
          {ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.menuItem}
              onPress={() => handleNavigate(item)}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={24} color={colors.textOnOlive} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.olive,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 16 },
      web: { boxShadow: '4px 0 20px rgba(0,0,0,0.25)' },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 56 : 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textOnOlive },
  closeBtn: { padding: 4 },
  menu: { paddingVertical: 12, paddingHorizontal: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.textOnOlive, marginLeft: 14 },
});

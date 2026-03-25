import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useSidebar } from '../context/SidebarContext';
import { HomeScreen } from '../screens/HomeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { HomeHubScreen } from '../screens/HomeHubScreen';
import { ShopHomeScreen } from '../screens/shop/ShopHomeScreen';
import { CategoriesScreen } from '../screens/shop/CategoriesScreen';
import { ProductListScreen } from '../screens/shop/ProductListScreen';
import { ProductDetailsScreen } from '../screens/shop/ProductDetailsScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrderPaidScreen } from '../screens/shop/OrderPaidScreen';
import { ProfileScreen } from '../screens/tabs/ProfileScreen';
import { AuthRequiredPrompt } from '../components/AuthRequiredPrompt';
import { useAuth } from '../context/AuthContext';
import { goToAuth } from './navigationRef';
import type { ShopProduct } from '../types/shop';
import type { AnalyzeStackParamList } from './analyzeStackTypes';

export type MainTabParamList = {
  Shop: undefined;
  Analyze: undefined;
  HomeHub: undefined;
  OrdersHistory: undefined;
  ProfileSettings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const AnalyzeStack = createNativeStackNavigator<AnalyzeStackParamList>();
const ShopStack = createNativeStackNavigator<ShopStackParamList>();
type OrdersStackParamList = { OrdersHome: undefined };
type ProfileStackParamList = { ProfileHome: undefined };
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

export type { AnalyzeStackParamList } from './analyzeStackTypes';

export type ShopStackParamList = {
  ShopHome: undefined;
  Categories: undefined;
  ProductList: { categoryId?: string; categoryName?: string } | undefined;
  ProductDetails: { product: ShopProduct };
  Cart: undefined;
  Checkout: undefined;
  OrderPaid: { orderId: string };
};

function AnalyzeHomeGate(props: NativeStackScreenProps<AnalyzeStackParamList, 'Home'>) {
  const { user } = useAuth();
  const navigation = useNavigation();
  if (!user) {
    return (
      <AuthRequiredPrompt
        title="Sign in to analyze"
        subtitle="Create a free account to scan leaves and get AI disease diagnosis."
        onSignIn={() => goToAuth(navigation)}
      />
    );
  }
  return <HomeScreen {...props} />;
}

function AnalyzeHistoryGate(_props: NativeStackScreenProps<AnalyzeStackParamList, 'History'>) {
  const { user } = useAuth();
  const navigation = useNavigation();
  if (!user) {
    return (
      <AuthRequiredPrompt
        title="Sign in for history"
        subtitle="Your past scans are saved when you are signed in."
        onSignIn={() => goToAuth(navigation)}
      />
    );
  }
  return <HistoryScreen />;
}

function OrdersTabGate() {
  const { user } = useAuth();
  const navigation = useNavigation();
  if (!user) {
    return (
      <AuthRequiredPrompt
        title="Sign in for orders"
        subtitle="View and track your shop orders after you sign in."
        onSignIn={() => goToAuth(navigation)}
      />
    );
  }
  return <OrdersScreen />;
}

function HeaderMenuButton() {
  const { openSidebar } = useSidebar();
  return (
    <TouchableOpacity
      onPress={openSidebar}
      style={{ paddingHorizontal: 12 }}
      hitSlop={12}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
      <Ionicons name="menu-outline" size={24} color={colors.textOnOlive} />
    </TouchableOpacity>
  );
}

function HeaderTitleWithIcon({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={22} color={colors.textOnOlive} />
      <Text style={{ color: colors.textOnOlive, fontWeight: '600', fontSize: 18 }}>{title}</Text>
    </View>
  );
}

function AnalyzeStackNavigator() {
  return (
    <AnalyzeStack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: colors.olive },
        headerTintColor: colors.textOnOlive,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        contentStyle: { backgroundColor: colors.cream },
        headerRight: () => <HeaderMenuButton />,
      }}
    >
      <AnalyzeStack.Screen
        name="Home"
        component={AnalyzeHomeGate}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitleWithIcon icon="scan-outline" title="Plant Health Scanner" />,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('History')}
                hitSlop={10}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel="Open scan history"
                style={{ paddingHorizontal: 2 }}
              >
                <Ionicons name="time-outline" size={22} color={colors.textOnOlive} />
              </TouchableOpacity>
              <HeaderMenuButton />
            </View>
          ),
        })}
      />
      <AnalyzeStack.Screen
        name="Result"
        component={ResultScreen}
        options={{ headerTitle: () => <HeaderTitleWithIcon icon="flask" title="Diagnosis" /> }}
      />
      <AnalyzeStack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{ headerTitle: () => <HeaderTitleWithIcon icon="heart" title="Improve the AI" /> }}
      />
      <AnalyzeStack.Screen
        name="History"
        component={AnalyzeHistoryGate}
        options={{ headerTitle: () => <HeaderTitleWithIcon icon="time-outline" title="Scan history" /> }}
      />
    </AnalyzeStack.Navigator>
  );
}

function ShopStackNavigator() {
  return (
    <ShopStack.Navigator
      initialRouteName="ShopHome"
      screenOptions={{
        headerStyle: { backgroundColor: colors.olive },
        headerTintColor: colors.textOnOlive,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        contentStyle: { backgroundColor: colors.cream },
        headerRight: () => <HeaderMenuButton />,
      }}
    >
      <ShopStack.Screen name="ShopHome" component={ShopHomeScreen} options={{ headerShown: false }} />
      <ShopStack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ headerTitle: () => <HeaderTitleWithIcon icon="grid-outline" title="Categories" /> }}
      />
      <ShopStack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ headerTitle: () => <HeaderTitleWithIcon icon="storefront-outline" title="Products" /> }}
      />
      <ShopStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ headerTitle: () => <HeaderTitleWithIcon icon="leaf-outline" title="Product details" /> }}
      />
      <ShopStack.Screen name="Cart" component={CartScreen} options={{ headerTitle: () => <HeaderTitleWithIcon icon="cart" title="Cart" /> }} />
      <ShopStack.Screen name="Checkout" component={CheckoutScreen} options={{ headerTitle: () => <HeaderTitleWithIcon icon="card" title="Checkout" /> }} />
      <ShopStack.Screen
        name="OrderPaid"
        component={OrderPaidScreen}
        options={{ headerTitle: () => <HeaderTitleWithIcon icon="receipt-outline" title="Order paid" /> }}
      />
    </ShopStack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator
      initialRouteName="OrdersHome"
      screenOptions={{
        headerStyle: { backgroundColor: colors.olive },
        headerTintColor: colors.textOnOlive,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        contentStyle: { backgroundColor: colors.cream },
        headerRight: () => <HeaderMenuButton />,
      }}
    >
      <OrdersStack.Screen
        name="OrdersHome"
        component={OrdersTabGate}
        options={{ headerTitle: () => <HeaderTitleWithIcon icon="receipt-outline" title="Orders" /> }}
      />
    </OrdersStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      initialRouteName="ProfileHome"
      screenOptions={{
        headerStyle: { backgroundColor: colors.olive },
        headerTintColor: colors.textOnOlive,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        contentStyle: { backgroundColor: colors.cream },
        headerRight: () => <HeaderMenuButton />,
      }}
    >
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ headerTitle: () => <HeaderTitleWithIcon icon="person-circle-outline" title="Profile" /> }}
      />
    </ProfileStack.Navigator>
  );
}

const tabIconMap: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Shop: 'storefront-outline',
  Analyze: 'scan-outline',
  HomeHub: 'home',
  OrdersHistory: 'receipt-outline',
  ProfileSettings: 'person-circle-outline',
};

/**
 * Primary app shell: modern bottom-tab navigation.
 * This is the first screen users land on after opening the app.
 */
export function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Shop"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.olive,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', paddingBottom: 2 },
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icon = tabIconMap[route.name as keyof MainTabParamList];
          if (route.name === 'HomeHub') {
            return (
              <View
                style={{
                  width: focused ? 46 : 42,
                  height: focused ? 46 : 42,
                  borderRadius: 23,
                  backgroundColor: colors.olive,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -8,
                }}
              >
                <Ionicons name={icon} size={focused ? 22 : 20} color={colors.textOnOlive} />
              </View>
            );
          }
          return <Ionicons name={icon} size={focused ? size + 1 : size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Shop" component={ShopStackNavigator} options={{ tabBarLabel: 'Shop' }} />
      <Tab.Screen name="Analyze" component={AnalyzeStackNavigator} options={{ tabBarLabel: 'Analyze' }} />
      <Tab.Screen name="HomeHub" component={HomeHubScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="OrdersHistory" component={OrdersStackNavigator} options={{ tabBarLabel: 'Orders' }} />
      <Tab.Screen name="ProfileSettings" component={ProfileStackNavigator} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

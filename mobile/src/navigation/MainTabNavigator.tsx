import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
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
import { ProfileSettingsStarterScreen } from '../screens/tabs/ProfileSettingsStarterScreen';
import type { ShopProduct } from '../types/shop';
import type { PredictionResponse } from '../types/api';

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

type AnalyzeStackParamList = {
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

export type ShopStackParamList = {
  ShopHome: undefined;
  Categories: undefined;
  ProductList: { categoryId?: string; categoryName?: string } | undefined;
  ProductDetails: { product: ShopProduct };
  Cart: undefined;
  Checkout: undefined;
};

function AnalyzeStackNavigator() {
  return (
    <AnalyzeStack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: colors.olive },
        headerTintColor: colors.textOnOlive,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <AnalyzeStack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Plant Health Scanner',
          headerRight: () => (
            <Ionicons
              name="time-outline"
              size={22}
              color={colors.textOnOlive}
              onPress={() => navigation.navigate('History')}
            />
          ),
        })}
      />
      <AnalyzeStack.Screen name="Result" component={ResultScreen} options={{ title: 'Diagnosis' }} />
      <AnalyzeStack.Screen name="Feedback" component={FeedbackScreen} options={{ title: 'Improve the AI' }} />
      <AnalyzeStack.Screen name="History" component={HistoryScreen} options={{ title: 'Scan history' }} />
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
      }}
    >
      <ShopStack.Screen name="ShopHome" component={ShopHomeScreen} options={{ title: 'Shop' }} />
      <ShopStack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Categories' }} />
      <ShopStack.Screen name="ProductList" component={ProductListScreen} options={{ title: 'Products' }} />
      <ShopStack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product Details' }} />
      <ShopStack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <ShopStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
    </ShopStack.Navigator>
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
      <Tab.Screen
        name="OrdersHistory"
        component={OrdersScreen}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="ProfileSettings"
        component={ProfileSettingsStarterScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

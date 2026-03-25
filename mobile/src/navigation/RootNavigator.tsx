import React, { type ComponentType } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSidebar } from '../context/SidebarContext';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HistoryDetailScreen } from '../screens/HistoryDetailScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { MainTabNavigator } from './MainTabNavigator';
import type { PredictionResponse } from '../types/api';
import { colors } from '../theme/colors';
import { OrderDetailsScreen } from '../screens/OrderDetailsScreen';

function HeaderTitle({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={headerStyles.wrap}>
      <Ionicons name={icon} size={22} color={colors.textOnOlive} />
      <Text style={headerStyles.title}>{title}</Text>
    </View>
  );
}
const headerStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.textOnOlive, fontWeight: '600', fontSize: 18 },
  headerRight: { marginRight: 16 },
  headerLeft: { marginLeft: 8 },
});

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
  Welcome: undefined;
  Home: undefined;
  Result: { imageUri: string; result: PredictionResponse };
  Feedback: {
    predicted_label: string;
    correct_label: string;
    confidence: number;
    imageUri?: string;
  };
  History: undefined;
  HistoryDetail: { scanId: string };
  Help: undefined;
  About: undefined;
  Shop: undefined;
  Cart: undefined;
  Checkout: undefined;
  Orders: undefined;
  OrderDetails: { orderId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

function MenuButton() {
  const { openSidebar } = useSidebar();
  return (
    <TouchableOpacity onPress={openSidebar} style={headerStyles.headerRight} hitSlop={12}>
      <Ionicons name="menu-outline" size={24} color={colors.textOnOlive} />
    </TouchableOpacity>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: { backgroundColor: colors.olive },
        headerTintColor: colors.textOnOlive,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Home"
        component={HomeScreen as ComponentType<RootProps<'Home'>>}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle icon="leaf" title="Plant Health Scanner" />,
          headerLeft: () => <MenuButton />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('History')}
              style={headerStyles.headerRight}
              hitSlop={12}
            >
              <Ionicons name="time-outline" size={24} color={colors.textOnOlive} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen as ComponentType<RootProps<'Result'>>}
        options={{ headerTitle: () => <HeaderTitle icon="flask" title="Diagnosis" /> }}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen as ComponentType<RootProps<'Feedback'>>}
        options={{ headerTitle: () => <HeaderTitle icon="heart" title="Improve the AI" /> }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle icon="list" title="Scan history" />,
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={headerStyles.headerLeft} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={colors.textOnOlive} />
            </TouchableOpacity>
          ),
          headerRight: () => <MenuButton />,
        })}
      />
      <Stack.Screen
        name="HistoryDetail"
        component={HistoryDetailScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle icon="scan-outline" title="Scan details" />,
          headerLeft: () =>
            navigation.canGoBack() ? (
              <TouchableOpacity onPress={() => navigation.goBack()} style={headerStyles.headerLeft} hitSlop={12}>
                <Ionicons name="arrow-back" size={24} color={colors.textOnOlive} />
              </TouchableOpacity>
            ) : null,
          headerRight: () => <MenuButton />,
        })}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle icon="help-circle" title="Help" />,
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={headerStyles.headerLeft} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={colors.textOnOlive} />
            </TouchableOpacity>
          ),
          headerRight: () => <MenuButton />,
        })}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle icon="information-circle" title="About" />,
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={headerStyles.headerLeft} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={colors.textOnOlive} />
            </TouchableOpacity>
          ),
          headerRight: () => <MenuButton />,
        })}
      />
      <Stack.Screen
        name="Shop"
        component={ShopScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle icon="storefront" title="Shop" />,
          headerLeft: () =>
            navigation.canGoBack() ? (
              <TouchableOpacity onPress={() => navigation.goBack()} style={headerStyles.headerLeft} hitSlop={12}>
                <Ionicons name="arrow-back" size={24} color={colors.textOnOlive} />
              </TouchableOpacity>
            ) : null,
          headerRight: () => <MenuButton />,
        })}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle icon="cart" title="Cart" />,
          headerLeft: () =>
            navigation.canGoBack() ? (
              <TouchableOpacity onPress={() => navigation.goBack()} style={headerStyles.headerLeft} hitSlop={12}>
                <Ionicons name="arrow-back" size={24} color={colors.textOnOlive} />
              </TouchableOpacity>
            ) : null,
          headerRight: () => <MenuButton />,
        })}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle icon="card" title="Checkout" />,
          headerLeft: () =>
            navigation.canGoBack() ? (
              <TouchableOpacity onPress={() => navigation.goBack()} style={headerStyles.headerLeft} hitSlop={12}>
                <Ionicons name="arrow-back" size={24} color={colors.textOnOlive} />
              </TouchableOpacity>
            ) : null,
          headerRight: () => <MenuButton />,
        })}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle icon="receipt-outline" title="Orders" />,
          headerLeft: () =>
            navigation.canGoBack() ? (
              <TouchableOpacity onPress={() => navigation.goBack()} style={headerStyles.headerLeft} hitSlop={12}>
                <Ionicons name="arrow-back" size={24} color={colors.textOnOlive} />
              </TouchableOpacity>
            ) : null,
          headerRight: () => <MenuButton />,
        })}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle icon="receipt-outline" title="Order details" />,
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={headerStyles.headerLeft} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={colors.textOnOlive} />
            </TouchableOpacity>
          ),
          headerRight: () => <MenuButton />,
        })}
      />
    </Stack.Navigator>
  );
}

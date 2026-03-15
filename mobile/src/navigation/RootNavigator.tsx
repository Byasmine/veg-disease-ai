import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSidebar } from '../context/SidebarContext';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { AboutScreen } from '../screens/AboutScreen';
import type { PredictionResponse } from '../types/api';
import { colors } from '../theme/colors';

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
  Help: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
      initialRouteName="Welcome"
      screenOptions={{
        headerStyle: { backgroundColor: colors.olive },
        headerTintColor: colors.textOnOlive,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
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
        component={ResultScreen}
        options={{ headerTitle: () => <HeaderTitle icon="flask" title="Diagnosis" /> }}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{ headerTitle: () => <HeaderTitle icon="heart" title="Improve the AI" /> }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle icon="list" title="Scan history" />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={headerStyles.headerLeft}
              hitSlop={12}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textOnOlive} />
            </TouchableOpacity>
          ),
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
    </Stack.Navigator>
  );
}

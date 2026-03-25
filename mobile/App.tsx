import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { SidebarProvider } from './src/context/SidebarContext';
import { AuthProvider } from './src/context/AuthContext';
import { Sidebar } from './src/components/Sidebar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';

export default function App() {
  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <AuthProvider>
          <SidebarProvider>
            <View style={styles.container}>
              <StatusBar style="dark" />
              <RootNavigator />
              <Sidebar />
            </View>
          </SidebarProvider>
        </AuthProvider>
      </NavigationContainer>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

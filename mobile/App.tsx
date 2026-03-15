import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { SidebarProvider } from './src/context/SidebarContext';
import { Sidebar } from './src/components/Sidebar';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <>
      <NavigationContainer>
        <SidebarProvider>
          <View style={styles.container}>
            <StatusBar style="dark" />
            <RootNavigator />
            <Sidebar />
          </View>
        </SidebarProvider>
      </NavigationContainer>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

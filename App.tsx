import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { I18nProvider } from './src/context/i18n-context';
import { AuthProvider } from './src/context/AuthContext';
import { MobilePosProvider } from './src/context/MobilePosContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <MobilePosProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <AppNavigator />
            </NavigationContainer>
          </MobilePosProvider>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

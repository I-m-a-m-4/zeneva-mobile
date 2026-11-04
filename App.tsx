import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { registerRootComponent } from 'expo';
import { I18nProvider } from './src/context/i18n-context';
import { AuthProvider } from './src/context/AuthContext';
import { MobilePosProvider } from './src/context/MobilePosContext';
import { AppNavigator } from './src/navigation/AppNavigator';

enableScreens();

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics} style={styles.root}>
      <View style={styles.root}>
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
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: '#F9F8F6',
  },
});

registerRootComponent(App);

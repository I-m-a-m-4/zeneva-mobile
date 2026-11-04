import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { registerRootComponent } from 'expo';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { FirebaseClientProvider } from './src/firebase/client-provider';
import { I18nProvider } from './src/context/i18n-context';
import { AuthProvider } from './src/context/AuthContext';
import { BranchProvider } from './src/context/branch-context';
import { MobilePosProvider } from './src/context/MobilePosContext';
import { AppNavigator } from './src/navigation/AppNavigator';

enableScreens();

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    'Nexa-Bold': require('./public/fonts/Nexa-Trial-Bold.otf'),
    'Nexa-Heavy': require('./public/fonts/Nexa-Heavy.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.root, styles.loaderContainer]}>
        <ActivityIndicator size="large" color="#F47125" />
      </View>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics} style={styles.root}>
      <View style={styles.root}>
        <FirebaseClientProvider>
          <I18nProvider>
            <AuthProvider>
              <BranchProvider>
                <MobilePosProvider>
                  <NavigationContainer>
                    <StatusBar style="dark" />
                    <AppNavigator />
                  </NavigationContainer>
                </MobilePosProvider>
              </BranchProvider>
            </AuthProvider>
          </I18nProvider>
        </FirebaseClientProvider>
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
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

registerRootComponent(App);


/**
 * GroceNest Mobile App
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { SocketProvider } from './src/context/SocketContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark'; // Keep this for now, though the provided snippet hardcodes StatusBar

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider publishableKey="pk_test_placeholder">
          <AuthProvider>
            <NotificationProvider>
              <SocketProvider>
                <CartProvider>
                  <NavigationContainer>
                    <StatusBar barStyle="dark-content" />
                    <RootNavigator />
                  </NavigationContainer>
                </CartProvider>
              </SocketProvider>
            </NotificationProvider>
          </AuthProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;

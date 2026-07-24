
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { StoreListScreen } from '../screens/StoreListScreen';
import { StoreDetailsScreen } from '../screens/StoreDetailsScreen';
import { StoreReviewsScreen } from '../screens/StoreReviewsScreen';
import { ProductDetailsScreen } from '../screens/ProductDetailsScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { OrderHistoryScreen } from '../screens/OrderHistoryScreen';
import { AddressListScreen } from '../screens/AddressListScreen';
import { AddAddressScreen } from '../screens/AddAddressScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { NotificationPreferencesScreen } from '../screens/NotificationPreferencesScreen';
import { DriverDashboardScreen } from '../screens/DriverDashboardScreen';
import { DriverActiveOrdersScreen } from '../screens/DriverActiveOrdersScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { RoleSelectionScreen } from '../screens/RoleSelectionScreen';
import { OrderSuccessScreen } from '../screens/OrderSuccessScreen';
import { OrderTrackingScreen } from '../screens/OrderTrackingScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { HelpCenterScreen } from '../screens/HelpCenterScreen';
import { MerchantAnalyticsScreen } from '../screens/MerchantAnalyticsScreen';
import { MerchantPayoutsScreen } from '../screens/MerchantPayoutsScreen';
import { ActivityIndicator, View, Text } from 'react-native';
import { COLORS } from '../theme/colors';

import SupportChatScreen from '../screens/SupportChatScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
);

const DiscoveryStack = () => (
    <Stack.Navigator>
        <Stack.Screen name="ExploreHome" component={StoreListScreen} options={{ title: 'Explore Stores' }} />
        <Stack.Screen name="StoreDetails" component={StoreDetailsScreen} options={({ route }: any) => ({ title: 'Store' })} />
        <Stack.Screen name="StoreReviews" component={StoreReviewsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product' }} />
    </Stack.Navigator>
);

const SearchStack = () => (
    <Stack.Navigator>
        <Stack.Screen name="SearchHome" component={SearchScreen} options={{ title: 'Search' }} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product' }} />
    </Stack.Navigator>
);

const AppTabs = () => (
    <Tab.Navigator
        screenOptions={{
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textSecondary,
            headerShown: false,
        }}
    >
        <Tab.Screen
            name="HomeTab"
            component={HomeScreen}
            options={{ title: 'Home', tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text> }}
        />
        <Tab.Screen
            name="SearchTab"
            component={SearchStack}
            options={{ title: 'Search', tabBarIcon: ({ color }) => <Text style={{ color }}>🔍</Text> }}
        />
        <Tab.Screen
            name="ExploreTab"
            component={DiscoveryStack}
            options={{ title: 'Explore', tabBarIcon: ({ color }) => <Text style={{ color }}>🏪</Text> }}
        />
        <Tab.Screen
            name="CartTab"
            component={CartScreen}
            options={{ title: 'Cart', tabBarIcon: ({ color }) => <Text style={{ color }}>🛒</Text> }}
        />
        <Tab.Screen
            name="ProfileTab"
            component={ProfileScreen}
            options={{ title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ color }}>👤</Text> }}
        />
    </Tab.Navigator>
);

const AppStack = () => (
    <Stack.Navigator>
        <Stack.Screen name="Main" component={AppTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
        <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'My Orders' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddressList" component={AddressListScreen} options={{ title: 'Saved Addresses' }} />
        <Stack.Screen name="AddAddress" component={AddAddressScreen} options={{ title: 'Add New Address' }} />
        <Stack.Screen name="DriverDashboard" component={DriverDashboardScreen} options={{ title: 'Driver Jobs' }} />
        <Stack.Screen name="DriverActive" component={DriverActiveOrdersScreen} options={{ title: 'Active Deliveries' }} />
        <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Rate Order' }} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MerchantAnalytics" component={MerchantAnalyticsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MerchantPayouts" component={MerchantPayoutsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SupportChat" component={SupportChatScreen} options={{ title: 'Live Support' }} />
    </Stack.Navigator>
);

export const RootNavigator = () => {
    const { isAuthenticated, loading, hasSeenOnboarding } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!hasSeenOnboarding ? (
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : isAuthenticated ? (
                <Stack.Screen name="App" component={AppStack} />
            ) : (
                <Stack.Screen name="Auth" component={AuthStack} />
            )}
        </Stack.Navigator>
    );
};

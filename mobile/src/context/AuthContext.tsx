
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { User, AuthResponse } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (data: any) => Promise<void>;
    signUp: (data: any) => Promise<void>;
    googleLogin: (data: any) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    isAuthenticated: boolean;
    hasSeenOnboarding: boolean;
    completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

    useEffect(() => {
        loadStorageData();
    }, []);

    async function loadStorageData() {
        try {
            const authDataSerialized = await AsyncStorage.getItem('user');
            const token = await AsyncStorage.getItem('token');
            const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');

            if (onboardingStatus === 'true') {
                setHasSeenOnboarding(true);
            }

            if (authDataSerialized && token) {
                setUser(JSON.parse(authDataSerialized));
            }
        } catch (error) {
            console.error('Failed to load auth data', error);
        } finally {
            setLoading(false);
        }
    }

    const signIn = async (credentials: any) => {
        const { data } = await api.post<AuthResponse>('/auth/login', credentials);
        setUser(data.user);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('token', data.token);
    };

    const signUp = async (userData: any) => {
        const { data } = await api.post<AuthResponse>('/auth/register', userData);
        setUser(data.user);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('token', data.token);
    };

    const googleLogin = async (googleData: any) => {
        const { data } = await api.post<AuthResponse>('/auth/google', googleData);
        setUser(data.user);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('token', data.token);
    };

    const signOut = async () => {
        await AsyncStorage.clear();
        setUser(null);
    };

    const refreshProfile = async () => {
        try {
            const { data } = await api.get('/user/profile');
            setUser(data);
            await AsyncStorage.setItem('user', JSON.stringify(data));
        } catch (error) {
            console.error('Refresh profile error:', error);
        }
    };

    const completeOnboarding = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        setHasSeenOnboarding(true);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signIn,
                signUp,
                googleLogin,
                signOut,
                refreshProfile,
                isAuthenticated: !!user,
                hasSeenOnboarding,
                completeOnboarding,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}


import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';
import { User, AuthResponse } from '../types';

interface SignInCredentials {
    email: string;
    password: string;
}

interface SignUpPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
}

interface GooglePayload {
    googleId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
}

/** Returned when the backend requires MFA before granting a token */
export interface MFAChallenge {
    mfaRequired: true;
    mfaToken: string;
    userId: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    hasSeenOnboarding: boolean;
    /** Returns undefined on success, MFAChallenge when 2FA is required */
    signIn: (credentials: SignInCredentials) => Promise<MFAChallenge | undefined>;
    signUp: (payload: SignUpPayload) => Promise<void>;
    googleLogin: (payload: GooglePayload) => Promise<void>;
    /** Complete MFA step after signIn returns an MFAChallenge */
    verifyMFA: (mfaToken: string, otpToken: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Storage helpers ───────────────────────────────────────────────
const STORAGE_KEYS = {
    user: 'user',
    token: 'token',
    refreshToken: 'refreshToken',
    onboarding: 'hasSeenOnboarding',
};

async function persistSession(data: AuthResponse & { refreshToken?: string }) {
    await AsyncStorage.multiSet([
        [STORAGE_KEYS.user, JSON.stringify(data.user)],
        [STORAGE_KEYS.token, data.token],
        ...(data.refreshToken
            ? [[STORAGE_KEYS.refreshToken, data.refreshToken] as [string, string]]
            : []),
    ]);
}

async function clearSession() {
    await AsyncStorage.multiRemove([
        STORAGE_KEYS.user,
        STORAGE_KEYS.token,
        STORAGE_KEYS.refreshToken,
    ]);
}

// ─── Provider ─────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

    useEffect(() => {
        loadStorageData();
    }, []);

    async function loadStorageData() {
        try {
            const [userJson, token, onboarding] = await AsyncStorage.multiGet([
                STORAGE_KEYS.user,
                STORAGE_KEYS.token,
                STORAGE_KEYS.onboarding,
            ]);

            if (onboarding[1] === 'true') setHasSeenOnboarding(true);

            if (userJson[1] && token[1]) {
                setUser(JSON.parse(userJson[1]));
            }
        } catch (error) {
            console.error('[Auth] Failed to load stored session:', error);
        } finally {
            setLoading(false);
        }
    }

    // ── Sign In ────────────────────────────────────────────────────
    const signIn = async (credentials: SignInCredentials): Promise<MFAChallenge | undefined> => {
        const { data } = await authApi.login(credentials.email, credentials.password);

        // Backend returns mfaRequired:true when 2FA is enabled
        if (data.mfaRequired) {
            return data as MFAChallenge;
        }

        await persistSession(data);
        setUser(data.user);
        return undefined;
    };

    // ── Verify MFA ─────────────────────────────────────────────────
    const verifyMFA = async (mfaToken: string, otpToken: string): Promise<void> => {
        const { data } = await authApi.verifyMFA(mfaToken, otpToken);
        await persistSession(data);
        setUser(data.user);
    };

    // ── Sign Up ────────────────────────────────────────────────────
    const signUp = async (payload: SignUpPayload): Promise<void> => {
        const { data } = await authApi.register({
            email: payload.email,
            password: payload.password,
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone,
            role: payload.role,
        });
        await persistSession(data);
        setUser(data.user);
    };

    // ── Google Login ───────────────────────────────────────────────
    const googleLogin = async (payload: GooglePayload): Promise<void> => {
        const { data } = await authApi.googleLogin(payload);
        await persistSession(data);
        setUser(data.user);
    };

    // ── Sign Out ───────────────────────────────────────────────────
    const signOut = async (): Promise<void> => {
        try {
            const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.refreshToken);
            await authApi.logout(refreshToken ?? undefined);
        } catch {
            // best-effort: revoke server-side token
        } finally {
            await clearSession();
            setUser(null);
        }
    };

    // ── Refresh Profile ────────────────────────────────────────────
    const refreshProfile = async (): Promise<void> => {
        try {
            const { default: api } = await import('../services/api');
            const { data } = await api.get('/user/profile');
            setUser(data);
            await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data));
        } catch (error) {
            console.error('[Auth] Refresh profile error:', error);
        }
    };

    // ── Onboarding ─────────────────────────────────────────────────
    const completeOnboarding = async (): Promise<void> => {
        await AsyncStorage.setItem(STORAGE_KEYS.onboarding, 'true');
        setHasSeenOnboarding(true);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                hasSeenOnboarding,
                signIn,
                signUp,
                googleLogin,
                verifyMFA,
                signOut,
                refreshProfile,
                completeOnboarding,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}


import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    Modal,
} from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth, MFAChallenge } from '../context/AuthContext';
import { authApi } from '../services/api';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ShieldCheck,
} from 'lucide-react-native';

// ── Brand palette ──────────────────────────────────────────────────
const C = {
    bg: '#F0EDE6',
    card: '#FFFFFF',
    primary: '#2D4A1E',
    primaryBtn: '#2D4A1E',
    accent: '#C47B1A',
    text: '#1A1A1A',
    textMuted: '#6B6B6B',
    border: '#E0DBCF',
    inputBg: '#FAFAF8',
    iconClr: '#9A9A8A',
    divider: '#C8C3B8',
    socialBorder: '#D6D1C8',
    white: '#FFFFFF',
    error: '#D93025',
};

// ── Logo ───────────────────────────────────────────────────────────
const AppLogo = () => (
    <View style={styles.logoWrapper}>
        <Text style={styles.logoEmoji}>🧺</Text>
    </View>
);

// ── MFA Modal ─────────────────────────────────────────────────────
interface MFAModalProps {
    visible: boolean;
    onSubmit: (code: string) => Promise<void>;
    onCancel: () => void;
}
const MFAModal = ({ visible, onSubmit, onCancel }: MFAModalProps) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (code.length !== 6) {
            Alert.alert('Invalid Code', 'Please enter your 6-digit authenticator code.');
            return;
        }
        setLoading(true);
        try {
            await onSubmit(code);
        } catch (e: any) {
            Alert.alert('Verification Failed', e.response?.data?.error || 'Invalid or expired code.');
        } finally {
            setLoading(false);
            setCode('');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.mfaOverlay}>
                <View style={styles.mfaCard}>
                    <ShieldCheck size={36} color={C.primary} style={{ marginBottom: 12 }} />
                    <Text style={styles.mfaTitle}>Two-Factor Authentication</Text>
                    <Text style={styles.mfaSubtitle}>
                        Enter the 6-digit code from your authenticator app.
                    </Text>
                    <TextInput
                        style={styles.mfaInput}
                        placeholder="000000"
                        placeholderTextColor={C.iconClr}
                        value={code}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        textAlign="center"
                    />
                    <TouchableOpacity
                        style={[styles.signInBtn, { marginTop: 12 }, loading && styles.signInBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={C.white} />
                        ) : (
                            <Text style={styles.signInBtnText}>Verify</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onCancel} style={{ marginTop: 14 }}>
                        <Text style={[styles.accentLink, { color: C.textMuted }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ── Forgot Password Modal ──────────────────────────────────────────
interface ForgotModalProps {
    visible: boolean;
    onClose: () => void;
}
const ForgotPasswordModal = ({ visible, onClose }: ForgotModalProps) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = async () => {
        if (!email) {
            Alert.alert('Email Required', 'Please enter your email address.');
            return;
        }
        setLoading(true);
        try {
            await authApi.forgotPassword(email);
            setSent(true);
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSent(false);
        setEmail('');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.mfaOverlay}>
                <View style={styles.mfaCard}>
                    <Mail size={36} color={C.primary} style={{ marginBottom: 12 }} />
                    <Text style={styles.mfaTitle}>
                        {sent ? 'Check your email' : 'Reset Password'}
                    </Text>
                    <Text style={styles.mfaSubtitle}>
                        {sent
                            ? `A password reset link has been sent to ${email} if an account exists.`
                            : "Enter your email and we'll send you a reset link."}
                    </Text>
                    {!sent && (
                        <>
                            <View style={[styles.inputRow, { marginTop: 16 }]}>
                                <Mail size={18} color={C.iconClr} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="you@example.com"
                                    placeholderTextColor={C.iconClr}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.signInBtn, { marginTop: 16 }, loading && styles.signInBtnDisabled]}
                                onPress={handleSend}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={C.white} />
                                ) : (
                                    <Text style={styles.signInBtnText}>Send Reset Link</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                    <TouchableOpacity onPress={handleClose} style={{ marginTop: 14 }}>
                        <Text style={[styles.accentLink, { color: C.textMuted }]}>
                            {sent ? 'Close' : 'Cancel'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ── Login Screen ───────────────────────────────────────────────────
export const LoginScreen = ({ route, navigation }: any) => {
    const role = route.params?.role || 'CUSTOMER';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // MFA state
    const [mfaChallenge, setMfaChallenge] = useState<MFAChallenge | null>(null);

    // Forgot password modal
    const [forgotVisible, setForgotVisible] = useState(false);

    // Inline field errors
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const passwordRef = useRef<TextInput>(null);

    const { signIn, googleLogin, verifyMFA } = useAuth();

    React.useEffect(() => {
        GoogleSignin.configure({
            webClientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
        });
    }, []);

    // ── Validation ───────────────────────────────────────────────
    const validate = (): boolean => {
        let valid = true;
        setEmailError('');
        setPasswordError('');

        if (!email.trim()) {
            setEmailError('Email or phone is required.');
            valid = false;
        }
        if (!password) {
            setPasswordError('Password is required.');
            valid = false;
        }
        return valid;
    };

    // ── Handle Login ─────────────────────────────────────────────
    const handleLogin = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const challenge = await signIn({ email: email.trim(), password });

            if (challenge?.mfaRequired) {
                setMfaChallenge(challenge);
            }
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.error || error.response?.data?.message;

            if (status === 423) {
                Alert.alert('Account Locked', message || 'Too many failed attempts. Please try again later.');
            } else if (status === 403) {
                Alert.alert('Account Deactivated', message || 'Your account has been deactivated. Contact support.');
            } else if (status === 401) {
                setPasswordError('Incorrect email or password.');
            } else if (!error.response) {
                Alert.alert('Network Error', 'Could not reach the server. Please check your connection.');
            } else {
                Alert.alert('Login Failed', message || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── MFA verification ─────────────────────────────────────────
    const handleMFAVerify = async (code: string) => {
        if (!mfaChallenge) return;
        await verifyMFA(mfaChallenge.mfaToken, code);
        setMfaChallenge(null);
    };

    // ── Google Sign-In ───────────────────────────────────────────
    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            await googleLogin({
                googleId: userInfo.data?.user.id,
                email: userInfo.data?.user.email,
                firstName: userInfo.data?.user.givenName || 'Google',
                lastName: userInfo.data?.user.familyName || 'User',
                role,
            });
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user dismissed
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // already signing in
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Google Sign-In', 'Google Play Services are not available on this device.');
            } else {
                Alert.alert('Google Sign-In Failed', error.response?.data?.error || error.message || 'Unknown error.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Facebook Sign-In ─────────────────────────────────────────
    const handleFacebookSignIn = () => {
        Alert.alert('Coming Soon', 'Facebook Sign-In will be available in a future update.');
    };

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* MFA Modal */}
            <MFAModal
                visible={!!mfaChallenge}
                onSubmit={handleMFAVerify}
                onCancel={() => setMfaChallenge(null)}
            />

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                visible={forgotVisible}
                onClose={() => setForgotVisible(false)}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Header ──────────────────────────────────── */}
                    <View style={styles.header}>
                        <AppLogo />
                        <Text style={styles.appName}>GroceNest</Text>
                        <Text style={styles.tagline}>
                            Freshness from every corner of the world.
                        </Text>
                    </View>

                    {/* ── Card ────────────────────────────────────── */}
                    <View style={styles.card}>

                        {/* Email / Phone */}
                        <Text style={styles.fieldLabel}>Email or Phone</Text>
                        <View style={[styles.inputRow, emailError ? styles.inputRowError : null]}>
                            <Mail size={18} color={emailError ? C.error : C.iconClr} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="hello@example.com"
                                placeholderTextColor={C.iconClr}
                                value={email}
                                onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                            />
                        </View>
                        {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}

                        {/* Password */}
                        <View style={[styles.labelRow, { marginTop: 16 }]}>
                            <Text style={styles.fieldLabel}>Password</Text>
                            <TouchableOpacity onPress={() => setForgotVisible(true)}>
                                <Text style={styles.forgotText}>Forgot?</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.inputRow, passwordError ? styles.inputRowError : null]}>
                            <Lock size={18} color={passwordError ? C.error : C.iconClr} style={styles.inputIcon} />
                            <TextInput
                                ref={passwordRef}
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={C.iconClr}
                                value={password}
                                onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                                secureTextEntry={!showPassword}
                                returnKeyType="go"
                                onSubmitEditing={handleLogin}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(p => !p)}
                                style={styles.eyeBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                {showPassword
                                    ? <EyeOff size={18} color={C.iconClr} />
                                    : <Eye size={18} color={C.iconClr} />
                                }
                            </TouchableOpacity>
                        </View>
                        {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}

                        {/* Sign-In Button */}
                        <TouchableOpacity
                            style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color={C.white} />
                            ) : (
                                <View style={styles.signInBtnInner}>
                                    <Text style={styles.signInBtnText}>Sign In</Text>
                                    <ArrowRight size={18} color={C.white} style={{ marginLeft: 8 }} />
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity
                                style={styles.socialBtn}
                                onPress={handleGoogleSignIn}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.socialIcon}>🟢</Text>
                                <Text style={styles.socialBtnText}>Google</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.socialBtn}
                                onPress={handleFacebookSignIn}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.socialIcon}>🔵</Text>
                                <Text style={styles.socialBtnText}>Facebook</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer Links */}
                        <View style={styles.footerLinks}>
                            <View style={styles.newUserRow}>
                                <Text style={styles.newUserText}>New to GroceNest?</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register', { role })}>
                                    <Text style={styles.accentLink}> Create Account</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('Register', { role: 'MERCHANT' })}>
                                <Text style={styles.accentLink}>Join as Merchant</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ marginTop: 6 }} onPress={() => navigation.navigate('Register', { role: 'DRIVER' })}>
                                <Text style={styles.accentLink}>Join as Driver</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Legal footer ─────────────────────────────── */}
                    <View style={styles.legalRow}>
                        <TouchableOpacity>
                            <Text style={styles.legalText}>Privacy Policy</Text>
                        </TouchableOpacity>
                        <Text style={styles.legalDot}>·</Text>
                        <TouchableOpacity>
                            <Text style={styles.legalText}>Terms of Service</Text>
                        </TouchableOpacity>
                        <Text style={styles.legalDot}>·</Text>
                        <TouchableOpacity>
                            <Text style={styles.legalText}>Help Center</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 32,
        alignItems: 'center',
    },

    // Header
    header: { alignItems: 'center', marginBottom: 28 },
    logoWrapper: {
        width: 80, height: 80, borderRadius: 20,
        backgroundColor: C.white,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 14,
        shadowColor: '#000', shadowOpacity: 0.08,
        shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    logoEmoji: { fontSize: 38 },
    appName: {
        fontSize: 28, fontWeight: '800', color: C.primary,
        letterSpacing: -0.5, marginBottom: 6,
    },
    tagline: {
        fontSize: 14, color: C.textMuted,
        textAlign: 'center', lineHeight: 20, maxWidth: 220,
    },

    // Card
    card: {
        width: '100%', backgroundColor: C.card,
        borderRadius: 20, paddingHorizontal: 22, paddingVertical: 28,
        shadowColor: '#000', shadowOpacity: 0.06,
        shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },

    // Inputs
    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    forgotText: { fontSize: 13, fontWeight: '600', color: C.accent },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.inputBg,
        borderWidth: 1, borderColor: C.border,
        borderRadius: 12, paddingHorizontal: 14, height: 50,
    },
    inputRowError: { borderColor: C.error },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: C.text, height: '100%' },
    eyeBtn: { padding: 2 },
    fieldError: { fontSize: 12, color: C.error, marginTop: 5, marginLeft: 2 },

    // Sign-In button
    signInBtn: {
        marginTop: 24, backgroundColor: C.primaryBtn,
        borderRadius: 30, height: 52,
        justifyContent: 'center', alignItems: 'center',
    },
    signInBtnDisabled: { opacity: 0.7 },
    signInBtnInner: { flexDirection: 'row', alignItems: 'center' },
    signInBtnText: { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

    // Divider
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22, gap: 10 },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.divider },
    dividerText: { fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 0.8 },

    // Social
    socialRow: { flexDirection: 'row', gap: 12 },
    socialBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', borderWidth: 1.5,
        borderColor: C.socialBorder, borderRadius: 30, height: 48,
        gap: 8, backgroundColor: C.white,
    },
    socialIcon: { fontSize: 16 },
    socialBtnText: { fontSize: 14, fontWeight: '600', color: C.text },

    // Footer links (card)
    footerLinks: { marginTop: 24, alignItems: 'center', gap: 6 },
    newUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    newUserText: { fontSize: 14, color: C.text },
    accentLink: { fontSize: 14, fontWeight: '700', color: C.accent, textAlign: 'center' },

    // Legal
    legalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 8 },
    legalText: { fontSize: 11, color: C.textMuted },
    legalDot: { fontSize: 11, color: C.divider },

    // MFA / Forgot modal
    mfaOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    mfaCard: {
        width: '100%', backgroundColor: C.white,
        borderRadius: 20, padding: 28, alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.15,
        shadowRadius: 20, elevation: 10,
    },
    mfaTitle: { fontSize: 18, fontWeight: '700', color: C.primary, marginBottom: 8, textAlign: 'center' },
    mfaSubtitle: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
    mfaInput: {
        width: '100%', height: 54, borderRadius: 12,
        borderWidth: 1, borderColor: C.border,
        backgroundColor: C.inputBg, fontSize: 24,
        fontWeight: '700', color: C.text,
        letterSpacing: 10, marginTop: 16, paddingHorizontal: 16,
    },
});

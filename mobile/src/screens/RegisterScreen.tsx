
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
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import {
    User,
    Mail,
    Phone,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    SmartphoneNfc,
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
    checkBorder: '#C8C3B8',
};

// ── Logo ───────────────────────────────────────────────────────────
const AppLogo = () => (
    <View style={styles.logoWrapper}>
        <Text style={styles.logoEmoji}>🧺</Text>
    </View>
);

// ── Phone OTP Verification Modal ───────────────────────────────────
interface OTPModalProps {
    visible: boolean;
    onVerify: (code: string) => Promise<void>;
    onSkip: () => void;
}
const PhoneOTPModal = ({ visible, onVerify, onSkip }: OTPModalProps) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (code.length !== 6) {
            Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your phone.');
            return;
        }
        setLoading(true);
        try {
            await onVerify(code);
        } catch (e: any) {
            Alert.alert('Verification Failed', e.response?.data?.error || 'Invalid or expired code.');
        } finally {
            setLoading(false);
            setCode('');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <SmartphoneNfc size={36} color={C.primary} style={{ marginBottom: 12 }} />
                    <Text style={styles.modalTitle}>Verify Your Phone</Text>
                    <Text style={styles.modalSubtitle}>
                        Enter the 6-digit code sent to your phone number.
                    </Text>
                    <TextInput
                        style={styles.otpInput}
                        placeholder="000000"
                        placeholderTextColor={C.iconClr}
                        value={code}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        textAlign="center"
                    />
                    <TouchableOpacity
                        style={[styles.createBtn, { marginTop: 14 }, loading && styles.createBtnDisabled]}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color={C.white} />
                            : <Text style={styles.createBtnText}>Verify</Text>
                        }
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onSkip} style={{ marginTop: 14 }}>
                        <Text style={[styles.accentLink, { color: C.textMuted }]}>Skip for now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ── Register Screen ────────────────────────────────────────────────
export const RegisterScreen = ({ route, navigation }: any) => {
    const role = route.params?.role || 'CUSTOMER';

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);

    // OTP verification after registration
    const [otpVisible, setOtpVisible] = useState(false);

    // Inline field errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    const lastNameRef = useRef<TextInput>(null);
    const emailRef    = useRef<TextInput>(null);
    const phoneRef    = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);

    const { signUp, googleLogin } = useAuth();

    React.useEffect(() => {
        GoogleSignin.configure({
            webClientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
        });
    }, []);

    // ── Field validation ─────────────────────────────────────────
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!firstName.trim()) newErrors.firstName = 'First name is required.';
        if (!lastName.trim())  newErrors.lastName  = 'Last name is required.';

        if (!email.trim()) {
            newErrors.email = 'Email address is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address.';
        }

        if (!password) {
            newErrors.password = 'Password is required.';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters.';
        }

        if (!agreed) newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const clearError = (field: string) =>
        setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });

    // ── Register ─────────────────────────────────────────────────
    const handleRegister = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await signUp({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                password,
                phone: phone.trim() || undefined,
                role,
            });

            // If user provided a phone, show OTP modal
            if (phone.trim()) {
                setOtpVisible(true);
            }
        } catch (error: any) {
            const status  = error.response?.status;
            const message = error.response?.data?.error || error.response?.data?.message;

            if (status === 409) {
                setErrors(prev => ({ ...prev, email: 'An account with this email already exists.' }));
            } else if (status === 400 && message?.includes('password')) {
                setErrors(prev => ({ ...prev, password: message }));
            } else if (status === 400) {
                Alert.alert('Validation Error', message || 'Please check your details and try again.');
            } else if (!error.response) {
                Alert.alert('Network Error', 'Could not reach the server. Please check your connection.');
            } else {
                Alert.alert('Registration Failed', message || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Phone OTP verify ─────────────────────────────────────────
    const handleOTPVerify = async (code: string) => {
        await authApi.verifyPhone(code);
        setOtpVisible(false);
        Alert.alert('Phone Verified ✓', 'Your phone number has been verified successfully.');
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
                // dismissed
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // already in progress
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Google Sign-In', 'Google Play Services are not available on this device.');
            } else {
                Alert.alert('Google Sign-In Failed', error.response?.data?.error || error.message || 'Unknown error.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookSignIn = () => {
        Alert.alert('Coming Soon', 'Facebook Sign-In will be available in a future update.');
    };

    // ── Helper: labelled field ───────────────────────────────────
    const renderField = (
        label: string,
        value: string,
        onChange: (t: string) => void,
        icon: React.ReactNode,
        opts: {
            placeholder: string;
            field: string;
            ref?: React.RefObject<TextInput>;
            nextRef?: React.RefObject<TextInput>;
            keyboardType?: any;
            autoCapitalize?: any;
            secureTextEntry?: boolean;
            rightElement?: React.ReactNode;
            returnKeyType?: any;
            onSubmitEditing?: () => void;
        }
    ) => {
        const hasError = !!errors[opts.field];
        return (
            <View style={{ marginTop: 16 }}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <View style={[styles.inputRow, hasError && styles.inputRowError]}>
                    <View style={styles.inputIcon}>{icon}</View>
                    <TextInput
                        ref={opts.ref}
                        style={styles.input}
                        placeholder={opts.placeholder}
                        placeholderTextColor={C.iconClr}
                        value={value}
                        onChangeText={(t) => { onChange(t); clearError(opts.field); }}
                        keyboardType={opts.keyboardType ?? 'default'}
                        autoCapitalize={opts.autoCapitalize ?? 'words'}
                        autoCorrect={false}
                        secureTextEntry={opts.secureTextEntry ?? false}
                        returnKeyType={opts.returnKeyType ?? (opts.nextRef ? 'next' : 'done')}
                        onSubmitEditing={opts.onSubmitEditing ?? (() => opts.nextRef?.current?.focus())}
                    />
                    {opts.rightElement}
                </View>
                {hasError && <Text style={styles.fieldError}>{errors[opts.field]}</Text>}
            </View>
        );
    };

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* Phone OTP Modal */}
            <PhoneOTPModal
                visible={otpVisible}
                onVerify={handleOTPVerify}
                onSkip={() => setOtpVisible(false)}
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
                        <Text style={styles.pageTitle}>Create your Account</Text>
                        <Text style={styles.tagline}>
                            Join our community and enjoy the freshest flavors from every corner of the world.
                        </Text>
                    </View>

                    {/* ── Card ────────────────────────────────────── */}
                    <View style={styles.card}>

                        {/* First Name — no marginTop on first field */}
                        <View style={{ marginTop: 0 }}>
                            <Text style={styles.fieldLabel}>First Name</Text>
                            <View style={[styles.inputRow, errors.firstName && styles.inputRowError]}>
                                <View style={styles.inputIcon}>
                                    <User size={18} color={errors.firstName ? C.error : C.iconClr} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your first name"
                                    placeholderTextColor={C.iconClr}
                                    value={firstName}
                                    onChangeText={(t) => { setFirstName(t); clearError('firstName'); }}
                                    returnKeyType="next"
                                    onSubmitEditing={() => lastNameRef.current?.focus()}
                                />
                            </View>
                            {!!errors.firstName && <Text style={styles.fieldError}>{errors.firstName}</Text>}
                        </View>

                        {renderField('Last Name', lastName, setLastName,
                            <User size={18} color={errors.lastName ? C.error : C.iconClr} />,
                            { placeholder: 'Enter your last name', field: 'lastName', ref: lastNameRef, nextRef: emailRef }
                        )}

                        {renderField('Email Address', email, setEmail,
                            <Mail size={18} color={errors.email ? C.error : C.iconClr} />,
                            { placeholder: 'hello@example.com', field: 'email', ref: emailRef, nextRef: phoneRef, keyboardType: 'email-address', autoCapitalize: 'none' }
                        )}

                        {renderField('Phone Number', phone, setPhone,
                            <Phone size={18} color={C.iconClr} />,
                            { placeholder: '+1 (555) 000-0000', field: 'phone', ref: phoneRef, nextRef: passwordRef, keyboardType: 'phone-pad', autoCapitalize: 'none' }
                        )}

                        {renderField('Password', password, setPassword,
                            <Lock size={18} color={errors.password ? C.error : C.iconClr} />,
                            {
                                placeholder: '••••••••',
                                field: 'password',
                                ref: passwordRef,
                                autoCapitalize: 'none',
                                secureTextEntry: !showPassword,
                                returnKeyType: 'go',
                                onSubmitEditing: handleRegister,
                                rightElement: (
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(p => !p)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        style={styles.eyeBtn}
                                    >
                                        {showPassword
                                            ? <EyeOff size={18} color={C.iconClr} />
                                            : <Eye size={18} color={C.iconClr} />
                                        }
                                    </TouchableOpacity>
                                ),
                            }
                        )}

                        {/* Terms checkbox */}
                        <TouchableOpacity
                            style={styles.termsRow}
                            onPress={() => { setAgreed(a => !a); clearError('terms'); }}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.checkbox,
                                agreed && styles.checkboxChecked,
                                errors.terms && styles.checkboxError,
                            ]}>
                                {agreed && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.termsText}>
                                By creating an account, I agree to GroceNest's{' '}
                                <Text style={styles.termsLink}>Terms of Service</Text>
                                {' '}and{' '}
                                <Text style={styles.termsLink}>Privacy Policy</Text>.
                            </Text>
                        </TouchableOpacity>
                        {!!errors.terms && <Text style={[styles.fieldError, { marginLeft: 30 }]}>{errors.terms}</Text>}

                        {/* Create Account Button */}
                        <TouchableOpacity
                            style={[styles.createBtn, loading && styles.createBtnDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color={C.white} />
                            ) : (
                                <View style={styles.createBtnInner}>
                                    <Text style={styles.createBtnText}>Create Account</Text>
                                    <ArrowRight size={18} color={C.white} style={{ marginLeft: 8 }} />
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR JOIN WITH</Text>
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
                            <View style={styles.signInRow}>
                                <Text style={styles.signInText}>Already have an account?</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login', { role })}>
                                    <Text style={styles.accentLink}> Sign In</Text>
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
        paddingTop: 52,
        paddingBottom: 32,
        alignItems: 'center',
    },

    // Header
    header: { alignItems: 'center', marginBottom: 24 },
    logoWrapper: {
        width: 76, height: 76, borderRadius: 18,
        backgroundColor: C.white,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 14,
        shadowColor: '#000', shadowOpacity: 0.08,
        shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    logoEmoji: { fontSize: 36 },
    pageTitle: {
        fontSize: 26, fontWeight: '800', color: C.primary,
        letterSpacing: -0.5, marginBottom: 8, textAlign: 'center',
    },
    tagline: {
        fontSize: 14, color: C.textMuted,
        textAlign: 'center', lineHeight: 20, maxWidth: 250,
    },

    // Card
    card: {
        width: '100%', backgroundColor: C.card,
        borderRadius: 20, paddingHorizontal: 22, paddingVertical: 26,
        shadowColor: '#000', shadowOpacity: 0.06,
        shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },

    // Inputs
    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
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

    // Terms
    termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 18, gap: 10 },
    checkbox: {
        width: 20, height: 20, borderRadius: 4,
        borderWidth: 1.5, borderColor: C.checkBorder,
        backgroundColor: C.white,
        justifyContent: 'center', alignItems: 'center',
        marginTop: 1, flexShrink: 0,
    },
    checkboxChecked: { backgroundColor: C.primary, borderColor: C.primary },
    checkboxError: { borderColor: C.error },
    checkmark: { color: C.white, fontSize: 12, fontWeight: '700', lineHeight: 14 },
    termsText: { flex: 1, fontSize: 12, color: C.textMuted, lineHeight: 18 },
    termsLink: { color: C.accent, fontWeight: '600' },

    // Create Account button
    createBtn: {
        marginTop: 20, backgroundColor: C.primaryBtn,
        borderRadius: 30, height: 52,
        justifyContent: 'center', alignItems: 'center',
    },
    createBtnDisabled: { opacity: 0.7 },
    createBtnInner: { flexDirection: 'row', alignItems: 'center' },
    createBtnText: { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

    // Divider
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
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
    footerLinks: { marginTop: 22, alignItems: 'center', gap: 6 },
    signInRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    signInText: { fontSize: 14, color: C.text },
    accentLink: { fontSize: 14, fontWeight: '700', color: C.accent, textAlign: 'center' },

    // Legal
    legalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 8 },
    legalText: { fontSize: 11, color: C.textMuted },
    legalDot: { fontSize: 11, color: C.divider },

    // OTP modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    modalCard: {
        width: '100%', backgroundColor: C.white,
        borderRadius: 20, padding: 28, alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.15,
        shadowRadius: 20, elevation: 10,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.primary, marginBottom: 8, textAlign: 'center' },
    modalSubtitle: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
    otpInput: {
        width: '100%', height: 54, borderRadius: 12,
        borderWidth: 1, borderColor: C.border,
        backgroundColor: C.inputBg, fontSize: 24,
        fontWeight: '700', color: C.text,
        letterSpacing: 10, marginTop: 16, paddingHorizontal: 16,
    },
});

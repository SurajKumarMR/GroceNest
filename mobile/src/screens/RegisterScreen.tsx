
import React, { useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

export const RegisterScreen = ({ route, navigation }: any) => {
    const role = route.params?.role || 'CUSTOMER';
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();

    const handleRegister = async () => {
        if (!firstName || !lastName || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await signUp({ firstName, lastName, email, password, role });
        } catch (error: any) {
            Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Join as a {role.charAt(0) + role.slice(1).toLowerCase()}</Text>
                <Text style={styles.subtitle}>Create an account to start shopping</Text>

                <View style={styles.row}>
                    <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="First Name"
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                    </View>
                    <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Last Name"
                            value={lastName}
                            onChangeText={setLastName}
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>



                <TouchableOpacity
                    style={styles.button}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.buttonText}>Register</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContainer: {
        padding: 32,
        paddingTop: 64,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    row: {
        flexDirection: 'row',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    roleButton: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    roleButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    roleButtonTextActive: {
        color: COLORS.white,
    },
    button: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
        marginBottom: 32,
    },
    footerText: {
        color: COLORS.textSecondary,
    },
    linkText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});

import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    Switch,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import { ChevronLeft, Bell, MessageSquare, Mail, ShieldAlert } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import api from '../services/api';

export const NotificationPreferencesScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [push, setPush] = useState(true);
    const [sms, setSms] = useState(true);
    const [email, setEmail] = useState(true);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/notifications/preferences');
            setPush(data.push ?? data.pushEnabled ?? true);
            setSms(data.sms ?? data.smsEnabled ?? true);
            setEmail(data.email ?? data.emailEnabled ?? true);
        } catch (error) {
            console.error('Failed to fetch notification preferences:', error);
            Alert.alert('Error', 'Could not load notification preferences.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (channel: 'push' | 'sms' | 'email', value: boolean) => {
        const nextPush = channel === 'push' ? value : push;
        const nextSms = channel === 'sms' ? value : sms;
        const nextEmail = channel === 'email' ? value : email;

        // Optimistic UI update
        if (channel === 'push') setPush(value);
        if (channel === 'sms') setSms(value);
        if (channel === 'email') setEmail(value);

        try {
            setUpdating(true);
            await api.put('/notifications/preferences', {
                push: nextPush,
                sms: nextSms,
                email: nextEmail
            });
        } catch (error) {
            console.error('Failed to update notification preferences:', error);
            // Revert state on error
            if (channel === 'push') setPush(!value);
            if (channel === 'sms') setSms(!value);
            if (channel === 'email') setEmail(!value);
            Alert.alert('Error', 'Failed to update preferences. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.canGoBack() && navigation.goBack()}
                >
                    <ChevronLeft size={24} color="#84cc16" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notification Preferences</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.infoBox}>
                        <ShieldAlert size={20} color="#65a30d" style={{ marginRight: 10 }} />
                        <Text style={styles.infoText}>
                            Choose how GroceNest communicates order updates, promotions, and delivery receipts with you.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        {/* Push Notifications */}
                        <View style={styles.row}>
                            <View style={[styles.iconBox, { backgroundColor: '#f4fce3' }]}>
                                <Bell size={20} color="#65a30d" />
                            </View>
                            <View style={styles.labelWrapper}>
                                <Text style={styles.rowTitle}>Push Notifications</Text>
                                <Text style={styles.rowSubtitle}>Instant app notifications on your device</Text>
                            </View>
                            <Switch
                                value={push}
                                onValueChange={(val) => handleToggle('push', val)}
                                trackColor={{ false: '#e2e8f0', true: '#84cc16' }}
                                thumbColor={COLORS.white}
                                disabled={updating}
                            />
                        </View>

                        <View style={styles.divider} />

                        {/* SMS Notifications */}
                        <View style={styles.row}>
                            <View style={[styles.iconBox, { backgroundColor: '#ffedd5' }]}>
                                <MessageSquare size={20} color="#ea580c" />
                            </View>
                            <View style={styles.labelWrapper}>
                                <Text style={styles.rowTitle}>SMS Notifications</Text>
                                <Text style={styles.rowSubtitle}>Text messages for order status & delivery</Text>
                            </View>
                            <Switch
                                value={sms}
                                onValueChange={(val) => handleToggle('sms', val)}
                                trackColor={{ false: '#e2e8f0', true: '#84cc16' }}
                                thumbColor={COLORS.white}
                                disabled={updating}
                            />
                        </View>

                        <View style={styles.divider} />

                        {/* Email Notifications */}
                        <View style={styles.row}>
                            <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                                <Mail size={20} color="#0284c7" />
                            </View>
                            <View style={styles.labelWrapper}>
                                <Text style={styles.rowTitle}>Email Notifications</Text>
                                <Text style={styles.rowSubtitle}>Receipts, order confirmations & newsletter</Text>
                            </View>
                            <Switch
                                value={email}
                                onValueChange={(val) => handleToggle('email', val)}
                                trackColor={{ false: '#e2e8f0', true: '#84cc16' }}
                                thumbColor={COLORS.white}
                                disabled={updating}
                            />
                        </View>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        backgroundColor: COLORS.white,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f4fce3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    loaderContainer: {
        flex: 1,
        justify: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7fee7',
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#d9f99d',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#3f6212',
        lineHeight: 18,
    },
    card: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    labelWrapper: {
        flex: 1,
        marginRight: 8,
    },
    rowTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 2,
    },
    rowSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 4,
    },
});

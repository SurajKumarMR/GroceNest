import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { 
    CheckCircle, 
    Copy,
    ChevronRight,
    MapPin,
    Clock,
    User
} from 'lucide-react-native';

export const OrderSuccessScreen = ({ navigation, route }: any) => {
    // In a real app, you'd get these from the route params or an API
    const orderNumber = route?.params?.orderNumber || '#GS-928472';
    
    const handleCopy = () => {
        // implement clipboard copy or just alert
        Alert.alert('Copied', 'Order number copied to clipboard.');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                
                {/* Header & Success Icon */}
                <View style={styles.successHeader}>
                    <View style={styles.iconCircle}>
                        <CheckCircle size={64} color={COLORS.white} />
                    </View>
                    <Text style={styles.successTitle}>Order Placed Successfully!</Text>
                    <Text style={styles.successSubtitle}>
                        Your order is being prepared and will be sent out for delivery soon.
                    </Text>
                </View>

                {/* Order Details Card */}
                <View style={styles.card}>
                    <View style={styles.orderNumberRow}>
                        <View>
                            <Text style={styles.cardLabel}>Order Number</Text>
                            <Text style={styles.orderNumberText}>{orderNumber}</Text>
                        </View>
                        <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                            <Copy size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Clock size={20} color={COLORS.primary} style={styles.infoIcon} />
                        <View>
                            <Text style={styles.cardLabel}>Estimated Delivery</Text>
                            <Text style={styles.infoText}>Today, 4:30 PM - 5:00 PM</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <User size={20} color={COLORS.primary} style={styles.infoIcon} />
                        <View>
                            <Text style={styles.cardLabel}>Your Shopper</Text>
                            <Text style={styles.infoText}>Sarah (will be picking your items)</Text>
                        </View>
                    </View>
                </View>

                {/* Tracking Widget */}
                {/* A mini representation to prompt the user to go to the tracking screen */}
                <TouchableOpacity 
                    style={styles.trackingWidget}
                    onPress={() => navigation.navigate('OrderTracking', { orderNumber })}
                >
                    <View style={styles.trackingLeft}>
                        <View style={styles.trackingIconBox}>
                            <MapPin size={24} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.trackingLabel}>Track Your Order</Text>
                            <Text style={styles.trackingSub}>See live updates & driver details</Text>
                        </View>
                    </View>
                    <ChevronRight size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>

            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('OrderTracking', { orderNumber })}
                >
                    <Text style={styles.primaryButtonText}>Track Your Order</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    successHeader: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 32,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#415e34',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#415e34',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: '#f6f8fb',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
    },
    orderNumberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    orderNumberText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    copyButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e6ede4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        marginRight: 16,
    },
    infoText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    trackingWidget: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 20,
        padding: 16,
        marginBottom: 32,
    },
    trackingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trackingIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f6f8fb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    trackingLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    trackingSub: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    bottomActions: {
        padding: 24,
        paddingBottom: 32,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    primaryButton: {
        backgroundColor: '#415e34',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#f6f8fb',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

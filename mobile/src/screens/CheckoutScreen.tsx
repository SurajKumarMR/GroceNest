
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import api, { orderApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { COLORS } from '../theme/colors';

export const CheckoutScreen = ({ navigation }: any) => {
    const { cartItems, total, refreshCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [fetchingAddresses, setFetchingAddresses] = useState(true);

    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    useEffect(() => {
        if (cartItems.length === 0) {
            navigation.goBack();
        }
        fetchAddresses();
    }, [cartItems]);

    const fetchAddresses = async () => {
        try {
            const res = await api.get('/user/addresses');
            setAddresses(res.data);
            const defaultAddress = res.data.find((a: any) => a.isDefault);
            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
            } else if (res.data.length > 0) {
                setSelectedAddressId(res.data[0].id);
            }
        } catch (error) {
            console.error('Fetch addresses error:', error);
        } finally {
            setFetchingAddresses(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            Alert.alert('Error', 'Please select a delivery address');
            return;
        }

        setLoading(true);
        try {
            // 1. Create the order
            const orderRes = await orderApi.placeOrder({
                paymentMethod: 'CARD', // Use CARD for Stripe
                deliveryAddressId: selectedAddressId,
            });

            // Handle both array (multiple stores) and single object responses
            const resData: any = orderRes;
            const order = Array.isArray(resData.orders) ? resData.orders[0] : (resData.order || resData);

            // 2. Initialize Payment Intent
            const paymentRes = await api.post('/payments/init', { orderId: order.id });
            const { clientSecret } = paymentRes.data;

            // 3. Initialize Payment Sheet
            const { error: initError } = await initPaymentSheet({
                paymentIntentClientSecret: clientSecret,
                merchantDisplayName: 'GroceNest',
            });

            if (initError) {
                Alert.alert('Payment Error', initError.message);
                setLoading(false);
                return;
            }

            // 4. Present Payment Sheet
            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                if (presentError.code === 'Canceled') {
                    // User cancelled, maybe keep the order in PENDING/UNPAID?
                    setLoading(false);
                    return;
                }
                Alert.alert('Payment Failed', presentError.message);
                setLoading(false);
                return;
            }

            // 5. Success
            Alert.alert(
                'Success!',
                'Your payment was successful and order is placed.',
                [{
                    text: 'OK', onPress: () => {
                        refreshCart();
                        navigation.navigate('Home');
                    }
                }]
            );
        } catch (error: any) {
            console.error('Order/Payment Error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Address</Text>
                    {fetchingAddresses ? (
                        <ActivityIndicator color={COLORS.primary} />
                    ) : addresses.length === 0 ? (
                        <TouchableOpacity
                            style={styles.addressPlaceholder}
                            onPress={() => navigation.navigate('AddressList')}
                        >
                            <Text style={styles.addressText}>No addresses found</Text>
                            <Text style={styles.subText}>Tap to add a new address</Text>
                        </TouchableOpacity>
                    ) : (
                        addresses.map((addr) => (
                            <TouchableOpacity
                                key={addr.id}
                                style={[
                                    styles.addressBox,
                                    selectedAddressId === addr.id && styles.selectedBox
                                ]}
                                onPress={() => setSelectedAddressId(addr.id)}
                            >
                                <View style={styles.radioContainer}>
                                    <View style={[styles.radio, selectedAddressId === addr.id && styles.radioSelected]} />
                                    <View>
                                        <Text style={styles.addressText}>{addr.streetAddress}</Text>
                                        <Text style={styles.subText}>{addr.city}, {addr.state} {addr.postalCode}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <View style={styles.paymentBox}>
                        <Text style={styles.paymentText}>Cash on Delivery</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery Fee</Text>
                        <Text style={styles.summaryValue}>$0.00</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.orderBtn}
                    onPress={handlePlaceOrder}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.orderBtnText}>Place Order</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
    },
    addressPlaceholder: {
        padding: 16,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    addressBox: {
        padding: 16,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 8,
    },
    selectedBox: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '05',
    },
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: COLORS.border,
        marginRight: 12,
    },
    radioSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    addressText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    subText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    paymentBox: {
        padding: 16,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    paymentText: {
        fontSize: 16,
        color: COLORS.text,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    summaryValue: {
        fontSize: 16,
        color: COLORS.text,
    },
    totalRow: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    footer: {
        padding: 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    orderBtn: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderBtnText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

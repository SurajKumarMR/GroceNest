
import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { orderApi } from '../services/api';
import { COLORS } from '../theme/colors';
import { Order } from '../types';

export const OrderHistoryScreen = ({ navigation }: any) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await orderApi.getOrders();
            setOrders(response.data);
        } catch (error) {
            console.error('Fetch orders error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderOrderItem = ({ item }: { item: Order }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.replace(/_/g, ' ')}
                    </Text>
                </View>
            </View>

            <View style={styles.details}>
                <Text style={styles.storeName}>{item.store.name}</Text>
                <Text style={styles.date}>{new Date(item.placedAt).toLocaleDateString()}</Text>
                <View style={styles.footer}>
                    <Text style={styles.total}>Total: ${item.totalAmount.toFixed(2)}</Text>
                    {item.status === 'DELIVERED' && (!item.reviews || item.reviews.length === 0) && (
                        <TouchableOpacity
                            style={styles.rateButton}
                            onPress={() => navigation.navigate('Review', {
                                orderId: item.id,
                                storeId: item.storeId,
                                productName: item.store.name
                            })}
                        >
                            <Text style={styles.rateButtonText}>Rate Order</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED': return COLORS.primary;
            case 'CANCELLED': return COLORS.error;
            case 'PENDING': return COLORS.secondary;
            default: return '#3b82f6';
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No orders yet</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 8,
    },
    orderNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    details: {
        marginTop: 4,
    },
    storeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    date: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    total: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    rateButton: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    rateButtonText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: COLORS.textSecondary,
    },
});

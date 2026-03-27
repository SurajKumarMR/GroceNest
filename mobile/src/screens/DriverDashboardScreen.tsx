
import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import api from '../services/api';
import { COLORS } from '../theme/colors';

export const DriverDashboardScreen = ({ navigation }: any) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState<string | null>(null);

    useEffect(() => {
        fetchAvailableOrders();
        const unsubscribe = navigation.addListener('focus', fetchAvailableOrders);
        return unsubscribe;
    }, [navigation]);

    const fetchAvailableOrders = async () => {
        try {
            const res = await api.get('/driver/available');
            setOrders(res.data);
        } catch (error) {
            console.error('Fetch orders error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (orderId: string) => {
        setAccepting(orderId);
        try {
            await api.post(`/driver/orders/${orderId}/accept`);
            Alert.alert('Success', 'Order accepted! Go to Active Orders to fulfill it.');
            fetchAvailableOrders();
        } catch (error) {
            Alert.alert('Error', 'Failed to accept order');
        } finally {
            setAccepting(null);
        }
    };

    const renderOrderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.storeName}>{item.store.name}</Text>
                <View style={styles.locationContainer}>
                    <Text style={styles.locationLabel}>From:</Text>
                    <Text style={styles.locationText}>{item.store.city}</Text>
                </View>
                <View style={styles.locationContainer}>
                    <Text style={styles.locationLabel}>To:</Text>
                    <Text style={styles.locationText}>{item.deliveryAddress.city}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAccept(item.id)}
                disabled={!!accepting}
            >
                {accepting === item.id ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                    <Text style={styles.acceptButtonText}>Accept Job ($5.50)</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.topNav}>
                <TouchableOpacity onPress={() => navigation.navigate('DriverActive')} style={styles.navItem}>
                    <Text style={styles.navText}>My Active Orders</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={<Text style={styles.title}>Available Orders</Text>}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No available orders right now</Text>
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
    topNav: {
        backgroundColor: COLORS.white,
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        alignItems: 'center',
    },
    navItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '10',
    },
    navText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginVertical: 16,
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
        marginBottom: 12,
    },
    orderNumber: {
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    time: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    cardContent: {
        marginBottom: 16,
    },
    storeName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    locationContainer: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    locationLabel: {
        width: 40,
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    locationText: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '500',
    },
    acceptButton: {
        backgroundColor: COLORS.primary,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptButtonText: {
        color: COLORS.white,
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
        color: COLORS.textSecondary,
    },
});

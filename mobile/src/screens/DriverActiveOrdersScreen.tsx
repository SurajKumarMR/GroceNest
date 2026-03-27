
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
import { socketService } from '../services/socket.service';
import { COLORS } from '../theme/colors';

export const DriverActiveOrdersScreen = ({ navigation }: any) => {
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState<string | null>(null);

    useEffect(() => {
        fetchDeliveries();
        const unsubscribe = navigation.addListener('focus', fetchDeliveries);
        return unsubscribe;
    }, [navigation]);

    const fetchDeliveries = async () => {
        try {
            const res = await api.get('/driver/my-deliveries');
            const active = res.data.filter((d: any) => d.status === 'OUT_FOR_DELIVERY');
            setDeliveries(active);

            // Join socket rooms for all active deliveries
            active.forEach((d: any) => socketService.joinOrder(d.id));
        } catch (error) {
            console.error('Fetch deliveries error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Simulation: Update location every 10 seconds for the first active delivery
    useEffect(() => {
        if (deliveries.length === 0) return;

        const activeOrderId = deliveries[0].id;
        let lat = deliveries[0].store.latitude || 40.7128;
        let lng = deliveries[0].store.longitude || -74.0060;

        const interval = setInterval(() => {
            // Simulate slight movement
            lat += (Math.random() - 0.5) * 0.001;
            lng += (Math.random() - 0.5) * 0.001;

            socketService.updateLocation(activeOrderId, lat, lng);
            console.log(`[Simulation] Sent location for ${activeOrderId}: ${lat}, ${lng}`);
        }, 10000);

        return () => clearInterval(interval);
    }, [deliveries]);

    const handleDeliver = async (orderId: string) => {
        setCompleting(orderId);
        try {
            await api.post(`/driver/orders/${orderId}/deliver`);
            Alert.alert('Success', 'Order marked as delivered!');
            fetchDeliveries();
        } catch (error) {
            Alert.alert('Error', 'Failed to update order');
        } finally {
            setCompleting(null);
        }
    };

    const renderDeliveryItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                <View style={styles.activeBadge}>
                    <Text style={styles.activeText}>ACTIVE</Text>
                </View>
            </View>
            <View style={styles.addressSection}>
                <View style={styles.addressRow}>
                    <Text style={[styles.dot, { color: COLORS.primary }]}>●</Text>
                    <View>
                        <Text style={styles.addressLabel}>Pick up at:</Text>
                        <Text style={styles.addressText}>{item.store.name}</Text>
                        <Text style={styles.addressSubText}>{item.store.streetAddress}</Text>
                    </View>
                </View>
                <View style={styles.line} />
                <View style={styles.addressRow}>
                    <Text style={[styles.dot, { color: COLORS.secondary }]}>●</Text>
                    <View>
                        <Text style={styles.addressLabel}>Deliver to:</Text>
                        <Text style={styles.addressText}>{item.deliveryAddress.streetAddress}</Text>
                        <Text style={styles.addressSubText}>{item.deliveryAddress.city}</Text>
                    </View>
                </View>
            </View>
            <TouchableOpacity
                style={styles.doneButton}
                onPress={() => handleDeliver(item.id)}
                disabled={!!completing}
            >
                {completing === item.id ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                    <Text style={styles.doneButtonText}>Complete Delivery</Text>
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
            <FlatList
                data={deliveries}
                renderItem={renderDeliveryItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={<Text style={styles.title}>Your Active Deliveries</Text>}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No active deliveries</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('DriverDashboard')}
                            style={styles.findJobsButton}
                        >
                            <Text style={styles.findJobsText}>Find Jobs</Text>
                        </TouchableOpacity>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginVertical: 16,
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
        marginBottom: 16,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    activeBadge: {
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    activeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    addressSection: {
        marginBottom: 20,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    dot: {
        fontSize: 20,
        marginRight: 12,
        marginTop: -4,
    },
    addressLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    addressText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    addressSubText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    line: {
        width: 1,
        height: 20,
        backgroundColor: COLORS.border,
        marginLeft: 6,
        marginVertical: 4,
    },
    doneButton: {
        backgroundColor: COLORS.primary,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
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
        marginBottom: 16,
    },
    findJobsButton: {
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    findJobsText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});

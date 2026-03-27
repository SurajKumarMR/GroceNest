import React, { useState, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    RefreshControl,
    SectionList,
    Image,
    SafeAreaView
} from 'react-native';
import { useNotifications, Notification } from '../context/NotificationContext';
import { COLORS } from '../theme/colors';
import { isToday, isYesterday, format } from 'date-fns';
import { 
    Check, 
    Truck, 
    Tag, 
    Settings,
    Package
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export const NotificationsScreen = () => {
    const navigation = useNavigation<any>();
    const { notifications, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'All' | 'Orders' | 'Offers'>('All');

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refreshNotifications();
        setRefreshing(false);
    }, [refreshNotifications]);

    const handleNotificationPress = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        if (notification.type === 'order') {
            navigation.navigate('Orders'); 
        }
    };

    // Filter and Group Logic
    const groupedData = useMemo(() => {
        let filtered = notifications;
        if (activeTab === 'Orders') {
            filtered = notifications.filter(n => n.type === 'order');
        } else if (activeTab === 'Offers') {
            filtered = notifications.filter(n => n.type === 'promotion');
        }

        const today: Notification[] = [];
        const yesterday: Notification[] = [];
        const older: Notification[] = [];

        filtered.forEach(n => {
            const date = new Date(n.createdAt);
            if (isToday(date)) today.push(n);
            else if (isYesterday(date)) yesterday.push(n);
            else older.push(n);
        });

        const sections = [];
        if (today.length > 0) sections.push({ title: 'TODAY', data: today });
        if (yesterday.length > 0) sections.push({ title: 'YESTERDAY', data: yesterday });
        if (older.length > 0) sections.push({ title: 'OLDER', data: older });

        return sections;
    }, [notifications, activeTab]);

    const renderIcon = (type: string, title: string) => {
        const titleLower = title.toLowerCase();
        if (type === 'order') {
            if (titleLower.includes('delivered')) {
                return (
                    <View style={[styles.iconContainer, { backgroundColor: '#e6ffe6' }]}>
                        <Check size={20} color="#2ecc71" />
                    </View>
                );
            }
            return (
                <View style={[styles.iconContainer, { backgroundColor: '#eef2ff' }]}>
                    <Truck size={20} color="#3b82f6" />
                </View>
            );
        }
        if (type === 'promotion') {
            return (
                <View style={[styles.iconContainer, { backgroundColor: '#fff0e6' }]}>
                    <Tag size={20} color="#f97316" />
                </View>
            );
        }
        // System or other
        return (
            <View style={[styles.iconContainer, { backgroundColor: '#f1f5f9' }]}>
                <Settings size={20} color="#64748b" />
            </View>
        );
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={styles.notificationCard}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardLeft}>
                {!item.isRead && <View style={styles.unreadDot} />}
                {renderIcon(item.type, item.title)}
            </View>
            <View style={styles.cardRight}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title}</Text>
                    <Text style={styles.timeText}>
                        {isToday(new Date(item.createdAt)) 
                            ? format(new Date(item.createdAt), 'h:mm a') 
                            : isYesterday(new Date(item.createdAt))
                                ? '1 day ago'
                                : format(new Date(item.createdAt), 'MMM d')
                        }
                    </Text>
                </View>
                <Text style={styles.messageText}>{item.message}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderBanner = () => {
        if (activeTab === 'Orders') return null;
        return (
            <TouchableOpacity style={styles.bannerCard} activeOpacity={0.8}>
                <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200' }} 
                    style={styles.bannerImage}
                />
                <View style={styles.bannerContent}>
                    <Text style={styles.bannerSubtitle}>WEEKEND BONUS</Text>
                    <Text style={styles.bannerTitle}>Free Delivery on Orders Over $50</Text>
                    <Text style={styles.bannerDesc}>Available until Sunday midnight.</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const isActive = (label: string) => activeTab === label;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.screenTitle}>Notifications</Text>
                    {notifications.some(n => !n.isRead) ? (
                        <TouchableOpacity onPress={markAllAsRead}>
                            <Text style={styles.markReadText}>Mark all as read</Text>
                        </TouchableOpacity>
                    ) : (
                        <View />
                    )}
                </View>

                {/* Filters */}
                <View style={styles.filtersContainer}>
                    <TouchableOpacity 
                        style={[styles.filterTab, isActive('All') && styles.filterTabActive]}
                        onPress={() => setActiveTab('All')}
                    >
                        <Text style={[styles.filterTabText, isActive('All') && styles.filterTabTextActive]}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.filterTab, isActive('Orders') && styles.filterTabActive]}
                        onPress={() => setActiveTab('Orders')}
                    >
                        <Text style={[styles.filterTabText, isActive('Orders') && styles.filterTabTextActive]}>Orders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.filterTab, isActive('Offers') && styles.filterTabActive]}
                        onPress={() => setActiveTab('Offers')}
                    >
                        <Text style={[styles.filterTabText, isActive('Offers') && styles.filterTabTextActive]}>Offers</Text>
                    </TouchableOpacity>
                </View>

                <SectionList
                    sections={groupedData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text style={styles.sectionHeader}>{title}</Text>
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                    }
                    ListFooterComponent={renderBanner}
                    ListEmptyComponent={
                        groupedData.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Package size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                                <Text style={styles.emptyText}>No notifications yet</Text>
                            </View>
                        ) : null
                    }
                />
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
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    markReadText: {
        fontSize: 14,
        color: '#f97316',
        fontWeight: '600',
    },
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    filterTab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        marginRight: 12,
    },
    filterTabActive: {
        backgroundColor: '#f97316',
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#475569',
    },
    filterTabTextActive: {
        color: COLORS.white,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginTop: 24,
        marginBottom: 12,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1,
    },
    cardLeft: {
        position: 'relative',
        marginRight: 16,
    },
    unreadDot: {
        position: 'absolute',
        top: 20,
        left: -12,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2ecc71',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardRight: {
        flex: 1,
        justifyContent: 'center',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
        marginRight: 8,
    },
    titleUnread: {
        fontWeight: 'bold',
        color: '#0f172a',
    },
    timeText: {
        fontSize: 11,
        color: '#94a3b8',
    },
    messageText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    bannerCard: {
        flexDirection: 'row',
        backgroundColor: '#fff7ed',
        borderRadius: 20,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#ffedd5',
    },
    bannerImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: '#fed7aa',
    },
    bannerContent: {
        flex: 1,
        justifyContent: 'center',
    },
    bannerSubtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#ea580c',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    bannerTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    bannerDesc: {
        fontSize: 12,
        color: '#64748b',
    },
    emptyContainer: {
        paddingTop: 60,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 16,
        fontWeight: '500',
    }
});

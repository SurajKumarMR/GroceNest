import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    SafeAreaView
} from 'react-native';
import { COLORS } from '../theme/colors';
import { 
    ChevronLeft, 
    Share2, 
    Star,
    MessageSquare,
    CheckCircle2,
    CornerDownRight
} from 'lucide-react-native';

const MOCK_REVIEWS = [
    {
        id: '1',
        user: { name: 'Priya Sharma', initial: 'p' },
        date: '2 days ago',
        rating: 5,
        text: 'The spices were so fresh and the delivery was ahead of schedule! The packaging for the oils was very secure, no leaks at all. Highly recommended for authentic Indian ingredients.',
        isVerified: true,
        images: [
            'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200',
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'
        ],
        storeResponse: "Thank you for the kind words Priya! We pride ourselves on sourcing the best ingredients for our community. Happy cooking!"
    },
    {
        id: '2',
        user: { name: 'Arjun V.', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200' },
        date: '1 week ago',
        rating: 4,
        text: 'Best place to find hard-to-get pulses and lentils. Everything was fresh and the app tracking was very accurate. Only giving 4 stars because my favorite mango pickle was out of stock.',
        isVerified: true,
        images: [],
        storeResponse: "Hi Arjun, we're sorry about the mango pickle! We have a fresh shipment arriving tomorrow. Hope to see you back soon."
    },
    {
        id: '3',
        user: { name: 'Anish Mehta', initial: 'AM' },
        date: '3 weeks ago',
        rating: 5,
        text: 'Packaged perfectly. The Basmati rice bag was double-wrapped to prevent any tears. This store really cares about their customers!',
        isVerified: false,
        images: [
            'https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&q=80&w=200'
        ],
        storeResponse: null
    }
];

export const StoreReviewsScreen = ({ navigation }: any) => {
    const [activeFilter, setActiveFilter] = useState('All');

    const filters = ['All', 'With Photos', '5 ★', '4 ★', '3 ★'];

    const renderStars = (rating: number) => {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        size={12} 
                        color={star <= rating ? '#f97316' : '#cbd5e1'} 
                        fill={star <= rating ? '#f97316' : 'transparent'} 
                        style={{ marginRight: 2 }} 
                    />
                ))}
            </View>
        );
    };

    const renderReviewCard = ({ item }: { item: any }) => (
        <View style={styles.reviewCard}>
            {/* Header */}
            <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                    {item.user.avatar ? (
                        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.initialAvatar}>
                            <Text style={styles.initialText}>{item.user.initial || item.user.name.charAt(0)}</Text>
                        </View>
                    )}
                    <View>
                        <Text style={styles.userName}>{item.user.name}</Text>
                        <View style={styles.ratingRow}>
                            {renderStars(item.rating)}
                            <Text style={styles.dateText}>{item.date}</Text>
                        </View>
                    </View>
                </View>

                {item.isVerified && (
                    <View style={styles.verifiedBadge}>
                        <CheckCircle2 size={10} color="#65a30d" />
                        <Text style={styles.verifiedText}>VERIFIED</Text>
                    </View>
                )}
            </View>

            {/* Text Content */}
            <Text style={styles.reviewText}>{item.text}</Text>

            {/* Images */}
            {item.images && item.images.length > 0 && (
                <View style={styles.imagesRow}>
                    {item.images.map((img: string, idx: number) => (
                        <Image key={idx} source={{ uri: img }} style={styles.reviewImage} />
                    ))}
                </View>
            )}

            {/* Store Response */}
            {item.storeResponse && (
                <View style={styles.responseContainer}>
                    <View style={styles.responseHeaderLine}>
                        <CornerDownRight size={14} color="#f97316" style={{ marginRight: 6 }} />
                        <Text style={styles.responseTextHeader}>Response from Patel's Indian Grocery</Text>
                    </View>
                    <Text style={styles.responseTextItem}>"{item.storeResponse}"</Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>Patel's Indian Grocery</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Star size={12} color="#f97316" fill="#f97316" />
                        <Text style={styles.ratingText}> 4.6 <Text style={styles.reviewsCount}>(1,250 reviews)</Text></Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.iconBtnBg}>
                    <Share2 size={20} color="#475569" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={MOCK_REVIEWS}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.scrollHeader}>
                        {/* Aspect Ratings */}
                        <View style={styles.aspectsContainer}>
                            <Text style={styles.sectionTitle}>ASPECT RATINGS</Text>
                            
                            <View style={styles.aspectRow}>
                                <Text style={styles.aspectLabel}>Product Quality</Text>
                                <Text style={styles.aspectScore}>4.7</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: '94%' }]} />
                            </View>

                            <View style={styles.aspectRow}>
                                <Text style={styles.aspectLabel}>Delivery Speed</Text>
                                <Text style={styles.aspectScore}>4.5</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: '90%' }]} />
                            </View>

                            <View style={styles.aspectRow}>
                                <Text style={styles.aspectLabel}>Packaging</Text>
                                <Text style={styles.aspectScore}>4.8</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: '96%' }]} />
                            </View>
                        </View>

                        {/* Filters */}
                        <View style={styles.filtersWrapper}>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={filters}
                                keyExtractor={(item) => item}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
                                renderItem={({ item }) => {
                                    const isActive = activeFilter === item;
                                    return (
                                        <TouchableOpacity 
                                            style={[styles.filterChip, isActive && styles.filterChipActive]}
                                            onPress={() => setActiveFilter(item)}
                                        >
                                            {item === 'With Photos' && <Image style={{width: 12, height: 12, marginRight: 6, tintColor: isActive ? '#fff' : '#64748b'}} source={{uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}}/>}
                                            <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                                                {item}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    </View>
                }
                renderItem={renderReviewCard}
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
                <MessageSquare size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.fabText}>Write a Review</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    iconBtnBg: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: 2,
    },
    reviewsCount: {
        color: '#64748b',
        fontWeight: 'normal',
    },
    scrollHeader: {
        backgroundColor: '#f8fafc',
    },
    aspectsContainer: {
        backgroundColor: COLORS.white,
        margin: 16,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748b',
        letterSpacing: 1,
        marginBottom: 20,
    },
    aspectRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    aspectLabel: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    aspectScore: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#ecfccb',
        borderRadius: 3,
        marginBottom: 16,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#84cc16',
        borderRadius: 3,
    },
    filtersWrapper: {
        marginBottom: 8,
    },
    filterChip: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    filterChipActive: {
        backgroundColor: '#84cc16',
        borderColor: '#84cc16',
    },
    filterChipText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    reviewCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    initialAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#ffedd5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f97316',
    },
    userName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 11,
        color: '#94a3b8',
        marginLeft: 6,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecfccb',
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 6,
    },
    verifiedText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#65a30d',
        marginLeft: 4,
    },
    reviewText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
        marginBottom: 16,
    },
    imagesRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    reviewImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 12,
    },
    responseContainer: {
        backgroundColor: '#fffbeb',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#f97316',
    },
    responseHeaderLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    responseTextHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    responseTextItem: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
        fontStyle: 'italic',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#84cc16',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 30,
        shadowColor: '#84cc16',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    fabText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    }
});

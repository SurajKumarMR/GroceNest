
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Image, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import { Bell, ShoppingBag, MapPin, ChevronDown, Search, Mic, Heart, Leaf } from 'lucide-react-native';

const CATEGORIES = ['All', 'Indian', 'Chinese', 'African'];

const MOCK_STORES = [
    {
        id: '1',
        name: 'Taj Mahal Grocers',
        rating: 4.5,
        reviews: '120+',
        fee: '$2.99 Fee',
        time: '20 min',
        category: 'INDIAN',
        image: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&q=80&w=400',
    },
    {
        id: '2',
        name: 'Oriental Market',
        rating: 4.8,
        reviews: '85',
        fee: 'Free',
        time: '35 min',
        category: 'CHINESE',
        image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&q=80&w=400',
    },
    {
        id: '3',
        name: 'Afro Hub',
        rating: 4.2,
        reviews: '210',
        fee: '$1.49 Fee',
        time: '25 min',
        category: 'AFRICAN',
        image: 'https://images.unsplash.com/photo-1515516089376-88db1e26e9c0?auto=format&fit=crop&q=80&w=400',
    },
    {
        id: '4',
        name: 'Petra Spices',
        rating: 4.7,
        reviews: '145',
        fee: '$3.50 Fee',
        time: '15 min',
        category: 'MIDDLE EAST',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
    },
];

export const HomeScreen = ({ navigation }: any) => {
    const { user, signOut } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('All');

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerContainer}>
                <View style={styles.topBar}>
                    <View style={styles.logoContainer}>
                        <Leaf color={COLORS.secondary} size={24} />
                        <Text style={styles.logoText}>
                            <Text style={{ color: COLORS.primary }}>Groce</Text>
                            <Text style={{ color: COLORS.secondary }}>Nest</Text>
                        </Text>
                    </View>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Bell color={COLORS.text} size={24} />
                            <View style={styles.badge} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.iconButtonBg}
                            onPress={() => navigation.navigate('Cart')}
                        >
                            <ShoppingBag color={COLORS.text} size={20} />
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>3</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.locationContainer}>
                    <MapPin color={COLORS.primary} size={16} />
                    <Text style={styles.locationText}>123 Main St, Derby</Text>
                    <ChevronDown color={COLORS.textSecondary} size={16} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.searchContainer}>
                    <Search color={COLORS.textSecondary} size={20} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for groceries or stores"
                        placeholderTextColor={COLORS.textSecondary}
                    />
                    <Mic color={COLORS.textSecondary} size={20} style={styles.micIcon} />
                </View>

                <View style={styles.promoBanner}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800' }}
                        style={styles.promoImage}
                    />
                    <View style={styles.promoOverlay}>
                        <View style={styles.promoBadge}>
                            <Text style={styles.promoBadgeText}>PROMO</Text>
                        </View>
                        <Text style={styles.promoTitle}>Free Delivery on{'\n'}First Order</Text>
                        <Text style={styles.promoSubtitle}>Use code: WELCONEST</Text>
                        <TouchableOpacity style={styles.promoButton}>
                            <Text style={styles.promoButtonText}>Shop Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Cuisines & Cultures</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                    {CATEGORIES.map((category) => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryPill,
                                selectedCategory === category && styles.categoryPillActive
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === category && styles.categoryTextActive
                            ]}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Stores Near You</Text>
                </View>

                <View style={styles.storesGrid}>
                    {MOCK_STORES.map((store) => (
                        <TouchableOpacity key={store.id} style={styles.storeCard} onPress={() => navigation.navigate('StoreDetails', { storeId: store.id })}>
                            <View style={styles.storeImageContainer}>
                                <Image source={{ uri: store.image }} style={styles.storeImage} />
                                <View style={styles.storeCategoryBadge}>
                                    <Text style={styles.storeCategoryText}>{store.category}</Text>
                                </View>
                                <TouchableOpacity style={styles.heartButton}>
                                    <Heart color={COLORS.white} size={20} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.storeInfo}>
                                <Text style={styles.storeName}>{store.name}</Text>
                                <View style={styles.storeMeta}>
                                    <Text style={styles.storeRating}>★ {store.rating}</Text>
                                    <Text style={styles.storeReviews}>({store.reviews})</Text>
                                </View>
                                <Text style={styles.storeDetails}>{store.fee} • {store.time}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: COLORS.background,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoText: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconButton: {
        position: 'relative',
    },
    iconButtonBg: {
        backgroundColor: COLORS.surface,
        padding: 8,
        borderRadius: 20,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 8,
        height: 8,
        backgroundColor: COLORS.error,
        borderRadius: 4,
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: COLORS.secondary,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    cartBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        padding: 0,
    },
    micIcon: {
        marginLeft: 10,
    },
    promoBanner: {
        width: '100%',
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
        position: 'relative',
    },
    promoImage: {
        width: '100%',
        height: '100%',
    },
    promoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 20,
    },
    promoBadge: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    promoBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    promoTitle: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    promoSubtitle: {
        color: COLORS.white,
        fontSize: 12,
        marginBottom: 16,
    },
    promoButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    promoButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    seeAllText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    categoriesContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    categoryPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 12,
        backgroundColor: COLORS.white,
    },
    categoryPillActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    categoryTextActive: {
        color: COLORS.white,
    },
    storesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    storeCard: {
        width: '48%',
        marginBottom: 20,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    storeImageContainer: {
        height: 120,
        width: '100%',
        position: 'relative',
    },
    storeImage: {
        width: '100%',
        height: '100%',
    },
    storeCategoryBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    storeCategoryText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    heartButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 6,
        borderRadius: 16,
    },
    storeInfo: {
        padding: 12,
    },
    storeName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    storeMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    storeRating: {
        color: COLORS.secondary,
        fontWeight: 'bold',
        fontSize: 12,
        marginRight: 4,
    },
    storeReviews: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    storeDetails: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
});

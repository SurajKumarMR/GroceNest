
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { productApi, storeApi } from '../services/api';
import { COLORS } from '../theme/colors';
import { Product } from '../types';

export const SearchScreen = ({ navigation }: any) => {
    const [query, setQuery] = useState('');
    const [productResults, setProductResults] = useState<Product[]>([]);
    const [storeResults, setStoreResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'products' | 'stores'>('products');

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (query.trim()) {
                handleSearch();
            } else {
                setProductResults([]);
                setStoreResults([]);
            }
        }, 500);

        return () => clearTimeout(delaySearch);
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const [prodRes, storeRes] = await Promise.all([
                productApi.getProducts(query),
                storeApi.getStores(query)
            ]);
            setProductResults(prodRes.data);
            setStoreResults(storeRes.data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderProduct = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetails', { slug: item.slug })}
        >
            <Image
                source={{ uri: item.images[0]?.url || 'https://via.placeholder.com/100' }}
                style={styles.image}
            />
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.storeName}>Found in {item.store?.name || 'Local Store'}</Text>
                <Text style={styles.price}>${item.regularPrice.toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderStore = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('StoreDetails', { slug: item.slug })}
        >
            <View style={styles.storeLogoContainer}>
                {item.logoUrl ? (
                    <Image source={{ uri: item.logoUrl }} style={styles.image} />
                ) : (
                    <View style={[styles.image, { backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 24 }}>🏪</Text>
                    </View>
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.storeDescription} numberOfLines={2}>{item.description}</Text>
                <View style={styles.cuisineTag}>
                    <Text style={styles.cuisineText}>{item.cuisineTypes?.[0] || 'Grocery'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchHeader}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products, stores..."
                    value={query}
                    onChangeText={setQuery}
                    autoFocus
                />

                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'products' && styles.activeTab]}
                        onPress={() => setActiveTab('products')}
                    >
                        <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
                            Products ({productResults.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'stores' && styles.activeTab]}
                        onPress={() => setActiveTab('stores')}
                    >
                        <Text style={[styles.tabText, activeTab === 'stores' && styles.activeTabText]}>
                            Stores ({storeResults.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'products' ? productResults : storeResults}
                    renderItem={activeTab === 'products' ? renderProduct : renderStore}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        query.trim() ? (
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>No {activeTab} found for "{query}"</Text>
                            </View>
                        ) : (
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>Find your favorite items & stores</Text>
                            </View>
                        )
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    searchHeader: {
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    searchInput: {
        height: 48,
        backgroundColor: COLORS.background,
        borderRadius: 24,
        paddingHorizontal: 20,
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 12,
    },
    tabBar: {
        flexDirection: 'row',
        gap: 8,
    },
    tab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: COLORS.background,
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
    },
    activeTabText: {
        color: COLORS.white,
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    storeLogoContainer: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: COLORS.background,
        overflow: 'hidden',
    },
    info: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    storeName: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    storeDescription: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    cuisineTag: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    cuisineText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 4,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
});

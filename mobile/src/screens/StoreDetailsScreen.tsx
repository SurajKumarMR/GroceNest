
import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { storeApi, productApi } from '../services/api';
import { COLORS } from '../theme/colors';
import { Store, Product } from '../types';

export const StoreDetailsScreen = ({ route, navigation }: any) => {
    const { slug } = route.params;
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                const storeRes = await storeApi.getStoreBySlug(slug);
                setStore(storeRes.data);

                const productsRes = await productApi.getProductsByStore(storeRes.data.id);
                setProducts(productsRes.data);
            } catch (error) {
                console.error('Fetch store data error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStoreData();
    }, [slug]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderProductItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetails', { slug: item.slug })}
        >
            <Image
                source={{ uri: item.images[0]?.url || 'https://via.placeholder.com/150' }}
                style={styles.productImage}
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productUnit}>{item.unit}</Text>
                <Text style={styles.productPrice}>${item.regularPrice.toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
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
            <View style={styles.header}>
                <Text style={styles.storeName}>{store?.name}</Text>
                <Text style={styles.storeDesc}>{store?.description}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('StoreReviews')} style={{ marginTop: 8 }}>
                    <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Read 1,250 Reviews →</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No products found</Text>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    storeName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    storeDesc: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    searchContainer: {
        padding: 16,
    },
    searchInput: {
        height: 45,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    listContainer: {
        padding: 8,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    productCard: {
        backgroundColor: COLORS.white,
        width: '48%',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    productImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        backgroundColor: COLORS.border,
    },
    productInfo: {
        marginTop: 8,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        height: 40,
    },
    productUnit: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: COLORS.textSecondary,
        fontSize: 16,
    },
});

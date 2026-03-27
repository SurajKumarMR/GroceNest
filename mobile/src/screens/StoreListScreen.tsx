
import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { storeApi } from '../services/api';
import { COLORS } from '../theme/colors';
import { Store } from '../types';

export const StoreListScreen = ({ navigation }: any) => {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const response = await storeApi.getStores();
            setStores(response.data);
        } catch (error) {
            console.error('Fetch stores error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStoreItem = ({ item }: { item: Store }) => (
        <TouchableOpacity
            style={styles.storeCard}
            onPress={() => navigation.navigate('StoreDetails', { slug: item.slug })}
        >
            <Image
                source={{ uri: item.logoUrl || 'https://via.placeholder.com/100' }}
                style={styles.logo}
            />
            <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{item.name}</Text>
                <Text style={styles.cuisineText}>{item.cuisineTypes.join(', ')}</Text>
                <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>⭐ {item.averageRating.toFixed(1)}</Text>
                    <Text style={styles.reviewsText}>({item.totalReviews} reviews)</Text>
                </View>
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
            <Text style={styles.title}>All Stores</Text>
            <FlatList
                data={stores}
                renderItem={renderStoreItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                initialNumToRender={5}
                windowSize={5}
                maxToRenderPerBatch={5}
                removeClippedSubviews={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 24,
        marginBottom: 16,
    },
    listContainer: {
        paddingBottom: 24,
    },
    storeCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: COLORS.border,
    },
    storeInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    storeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    cuisineText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    reviewsText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

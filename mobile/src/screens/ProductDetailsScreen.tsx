
import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { productApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { COLORS } from '../theme/colors';
import { Product } from '../types';

const { width } = Dimensions.get('window');

export const ProductDetailsScreen = ({ route, navigation }: any) => {
    const { slug } = route.params;
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const { addToCart } = useCart();

    useEffect(() => {
        fetchProduct();
    }, [slug]);

    const fetchProduct = async () => {
        try {
            const response = await productApi.getProductBySlug(slug);
            setProduct(response.data);
        } catch (error) {
            console.error('Fetch product error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!product) return;
        setAdding(true);
        try {
            await addToCart(product.id, product.storeId, quantity);
            Alert.alert('Success', 'Added to cart!');
        } catch (error) {
            Alert.alert('Error', 'Failed to add to cart');
        } finally {
            setAdding(false);
        }
    };

    const incrementQuantity = () => setQuantity(prev => prev + 1);
    const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.centered}>
                <Text>Product not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                    source={{ uri: product.images[0]?.url || 'https://via.placeholder.com/400' }}
                    style={styles.image}
                />

                <View style={styles.detailsContainer}>
                    <Text style={styles.name}>{product.name}</Text>
                    <Text style={styles.unit}>{product.unit}</Text>
                    <Text style={styles.price}>${product.regularPrice.toFixed(2)}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{product.description || 'No description available.'}</Text>
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity style={styles.qtyButton} onPress={decrementQuantity}>
                        <Text style={styles.qtyButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{quantity}</Text>
                    <TouchableOpacity style={styles.qtyButton} onPress={incrementQuantity}>
                        <Text style={styles.qtyButtonText}>+</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={handleAddToCart}
                    disabled={adding}
                >
                    {adding ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.addToCartText}>Add to Cart</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: 350,
        backgroundColor: COLORS.border,
    },
    detailsContainer: {
        padding: 20,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    unit: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    price: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 12,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },
    bottomBar: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 4,
        marginRight: 16,
    },
    qtyButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 6,
    },
    qtyButtonText: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
    },
    quantity: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 16,
        color: COLORS.text,
    },
    addToCartButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addToCartText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

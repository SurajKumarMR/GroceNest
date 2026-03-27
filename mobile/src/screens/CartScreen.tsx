
import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { COLORS } from '../theme/colors';
import { CartItem } from '../types';

export const CartScreen = ({ navigation }: any) => {
    const { cartItems, loading, total, updateQuantity, removeFromCart } = useCart();

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View style={styles.card}>
            <Image
                source={{ uri: item.product.images[0]?.url || 'https://via.placeholder.com/80' }}
                style={styles.image}
            />
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.price}>${item.product.regularPrice.toFixed(2)}</Text>

                <View style={styles.actions}>
                    <View style={styles.quantityContainer}>
                        <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                            <Text style={styles.qtyText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.quantity}>{item.quantity}</Text>
                        <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                            <Text style={styles.qtyText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                        <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (loading && cartItems.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (cartItems.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>Your cart is empty</Text>
                <TouchableOpacity
                    style={styles.browseBtn}
                    onPress={() => navigation.navigate('StoreList')}
                >
                    <Text style={styles.browseBtnText}>Browse Stores</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                </View>

                <TouchableOpacity
                    style={styles.checkoutBtn}
                    onPress={() => navigation.navigate('Checkout')}
                >
                    <Text style={styles.checkoutBtnText}>Go to Checkout</Text>
                </TouchableOpacity>
            </View>
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
        padding: 20,
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
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: COLORS.border,
    },
    info: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    price: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 6,
    },
    qtyBtn: {
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    qtyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    quantity: {
        fontSize: 14,
        fontWeight: 'bold',
        minWidth: 20,
        textAlign: 'center',
    },
    removeText: {
        color: COLORS.error,
        fontSize: 12,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 18,
        color: COLORS.textSecondary,
        marginBottom: 20,
    },
    browseBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    browseBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        backgroundColor: COLORS.white,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 18,
        color: COLORS.textSecondary,
    },
    totalAmount: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    checkoutBtn: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkoutBtnText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

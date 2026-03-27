
import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { COLORS } from '../theme/colors';
import api from '../services/api';

export const ReviewScreen = ({ route, navigation }: any) => {
    const { orderId, storeId, productName } = route.params;
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Please select a rating');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/reviews', {
                orderId,
                storeId,
                rating,
                reviewText,
            });
            Alert.alert('Success', 'Thank you for your review!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Review error:', error);
            Alert.alert('Error', 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const StarRating = () => (
        <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                >
                    <Text style={[
                        styles.starIcon,
                        { color: star <= rating ? COLORS.primary : COLORS.border }
                    ]}>
                        ★
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>How was your order?</Text>
            {productName && <Text style={styles.subtitle}>{productName}</Text>}

            <View style={styles.card}>
                <Text style={styles.label}>Rating</Text>
                <StarRating />

                <Text style={[styles.label, { marginTop: 24 }]}>Review (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Tell us what you liked or disliked..."
                    multiline
                    numberOfLines={4}
                    value={reviewText}
                    onChangeText={setReviewText}
                    textAlignVertical="top"
                />

                <TouchableOpacity
                    style={[styles.button, rating === 0 && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting || rating === 0}
                >
                    {submitting ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.buttonText}>Submit Review</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 8,
    },
    starButton: {
        padding: 8,
    },
    starIcon: {
        fontSize: 40,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        fontSize: 16,
        color: COLORS.text,
        marginTop: 8,
        marginBottom: 24,
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: COLORS.border,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

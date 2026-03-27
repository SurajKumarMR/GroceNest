
import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import api from '../services/api';
import { COLORS } from '../theme/colors';

export const AddAddressScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
        isDefault: false,
    });

    const handleSubmit = async () => {
        if (!formData.street || !formData.city || !formData.state || !formData.zipCode) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await api.post('/user/addresses', formData);
            Alert.alert('Success', 'Address added successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Add address error:', error);
            Alert.alert('Error', 'Failed to add address');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Street Address *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 123 Main St"
                        value={formData.street}
                        onChangeText={(text) => setFormData({ ...formData, street: text })}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 2 }]}>
                        <Text style={styles.label}>City *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. San Francisco"
                            value={formData.city}
                            onChangeText={(text) => setFormData({ ...formData, city: text })}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={styles.label}>State *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. CA"
                            value={formData.state}
                            onChangeText={(text) => setFormData({ ...formData, state: text })}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>ZIP Code *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 94103"
                            keyboardType="numeric"
                            value={formData.zipCode}
                            onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={styles.label}>Country</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. USA"
                            value={formData.country}
                            onChangeText={(text) => setFormData({ ...formData, country: text })}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.addButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.addButtonText}>Save Address</Text>
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
    form: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    row: {
        flexDirection: 'row',
    },
    addButton: {
        marginTop: 24,
        height: 50,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: COLORS.border,
    },
    addButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

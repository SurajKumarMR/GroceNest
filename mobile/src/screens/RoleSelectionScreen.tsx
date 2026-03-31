import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { COLORS } from '../theme/colors';

export const RoleSelectionScreen = ({ navigation }: any) => {
    const handleSelectRole = (role: string) => {
        navigation.navigate('Login', { role });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Welcome back! 👋</Text>
                <Text style={styles.subtitle}>How would you like to continue?</Text>
                
                <TouchableOpacity 
                    style={[styles.roleCard, { borderLeftColor: COLORS.primary }]}
                    onPress={() => handleSelectRole('CUSTOMER')}
                >
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🛒</Text>
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.roleTitle}>Customer</Text>
                        <Text style={styles.roleDescription}>Order groceries and essentials</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.roleCard, { borderLeftColor: '#f97316' }]}
                    onPress={() => handleSelectRole('MERCHANT')}
                >
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🏪</Text>
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.roleTitle}>Merchant</Text>
                        <Text style={styles.roleDescription}>Manage your store and products</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.roleCard, { borderLeftColor: '#3b82f6' }]}
                    onPress={() => handleSelectRole('DRIVER')}
                >
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🚗</Text>
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.roleTitle}>Driver</Text>
                        <Text style={styles.roleDescription}>Deliver orders and earn money</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 48,
    },
    roleCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderLeftWidth: 6,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f8f9f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    icon: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    roleDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});

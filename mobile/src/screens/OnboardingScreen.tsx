import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

export const OnboardingScreen = () => {
    const { completeOnboarding } = useAuth();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoBox}>
                        {/* Placeholder for small logo inside square */}
                        <Text style={styles.logoBoxText}>🌱</Text>
                    </View>
                    <Text style={styles.logoText}>
                        <Text style={styles.logoTextDark}>Groce</Text>
                        <Text style={styles.logoTextOrange}>Nest</Text>
                    </Text>
                </View>
                <TouchableOpacity onPress={completeOnboarding}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            {/* Main Image */}
            <View style={styles.imageContainer}>
                 <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80' }}
                    style={styles.heroImage}
                    resizeMode="cover"
                />
                
                {/* Floating Logo Appending over image like mockup */}
                <View style={[styles.logoBox, styles.floatingLogoBox]}>
                     <Text style={styles.logoBoxText}>🌱</Text>
                </View>
            </View>

            {/* Typography Section */}
            <View style={styles.textContainer}>
                <Text style={styles.title}>
                    Explore a World{'\n'}of <Text style={styles.titleHighlight}>Flavors</Text>
                </Text>
                <Text style={styles.subtitle}>
                    Access authentic ingredients from{'\n'}diverse cultures right at your fingertips.
                </Text>
            </View>

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
            </View>

            {/* CTA Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={completeOnboarding}>
                    <Text style={styles.buttonText}>Next →</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoBox: {
        backgroundColor: '#F3F4ED',
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginRight: 10,
    },
    floatingLogoBox: {
        position: 'absolute',
        top: 24,
        left: 24,
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F3F4ED',
    },
    logoBoxText: {
        fontSize: 16,
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    logoTextDark: {
        color: '#2B4A1D', 
    },
    logoTextOrange: {
        color: COLORS.secondary,
    },
    skipText: {
        fontSize: 16,
        color: '#6B7280', // Gray-500
        fontWeight: '500',
    },
    imageContainer: {
        paddingHorizontal: 16,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: width * 1.15, // Maintain aspect ratio to match design mostly
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 32,
        marginTop: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#111827', // Gray-900
        textAlign: 'center',
        lineHeight: 40,
    },
    titleHighlight: {
        color: '#4B7B2B', // Darker green matching mockup
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E7EB', // Gray-200
        marginHorizontal: 4,
    },
    dotActive: {
        width: 24,
        height: 8,
        backgroundColor: '#618442', // Olive green
    },
    footer: {
        paddingHorizontal: 24,
        marginTop: 'auto',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#4B7B2B',
        width: '100%',
        height: 56,
        borderRadius: 100, // Fully rounded
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 2,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
    },
});

import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Dimensions
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { COLORS } from '../theme/colors';
import { 
    ChevronLeft, 
    Phone, 
    MessageCircle,
    Package,
    Truck
} from 'lucide-react-native';

const { height } = Dimensions.get('window');

export const OrderTrackingScreen = ({ navigation, route: _route }: any) => {
    // Dummy coordinates for the map
    const initialRegion = {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
    };

    const driverCoord = {
        latitude: 37.7850,
        longitude: -122.4300,
    };

    const storeCoord = {
        latitude: 37.7900,
        longitude: -122.4350,
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                
                {/* Background Map */}
                <MapView
                    provider={PROVIDER_DEFAULT}
                    style={styles.map}
                    initialRegion={initialRegion}
                >
                    <Marker coordinate={driverCoord}>
                        <View style={styles.driverMarker}>
                            <Truck size={16} color={COLORS.white} />
                        </View>
                    </Marker>
                    <Marker coordinate={storeCoord}>
                        <View style={styles.storeMarker}>
                            <Package size={16} color={COLORS.white} />
                        </View>
                    </Marker>
                </MapView>

                {/* Top Action Bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ChevronLeft size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                {/* Estimated Arrival Floating Card */}
                <View style={styles.etaCard}>
                    <Text style={styles.etaLabel}>Estimated Arrival</Text>
                    <Text style={styles.etaTitle}>Arriving in 12 min</Text>
                    <View style={styles.etaBarContainer}>
                        <View style={styles.etaBarSegmentFilled} />
                        <View style={styles.etaBarSegmentFilled} />
                        <View style={styles.etaBarSegmentFilled} />
                        <View style={styles.etaBarSegmentHalf} />
                        <View style={styles.etaBarSegmentEmpty} />
                    </View>
                </View>

                {/* Bottom Sheet */}
                <View style={styles.bottomSheet}>
                    <View style={styles.dragIndicator} />
                    
                    {/* Driver Info Row */}
                    <View style={styles.driverInfoRow}>
                        <Image 
                            source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150' }}
                            style={styles.driverAvatar} 
                        />
                        <View style={styles.driverDetails}>
                            <Text style={styles.driverName}>Sarah</Text>
                            <Text style={styles.driverVehicle}>Toyota Prius • ABC 123</Text>
                            <View style={styles.driverRating}>
                                <Text style={styles.ratingText}>★ 4.9</Text>
                            </View>
                        </View>
                        <View style={styles.driverActions}>
                            <TouchableOpacity 
                                style={styles.actionCircleButton}
                                onPress={() => navigation.navigate('Chat')}
                            >
                                <MessageCircle size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionCircleButton}>
                                <Phone size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Timeline */}
                    <View style={styles.timelineContainer}>
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, styles.timelineDotActive]} />
                            <View style={[styles.timelineLine, styles.timelineLineActive]} />
                            <Text style={styles.timelineTextActive}>Order Packed</Text>
                            <Text style={styles.timelineTime}>4:05 PM</Text>
                        </View>
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, styles.timelineDotActive]} />
                            <View style={[styles.timelineLine, styles.timelineLineActive]} />
                            <Text style={styles.timelineTextActive}>Out for Delivery</Text>
                            <Text style={styles.timelineTime}>4:15 PM</Text>
                        </View>
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, styles.timelineDotActive, { backgroundColor: COLORS.primary }]} />
                            <Text style={[styles.timelineTextActive, styles.timelineTextArriving]}>Arriving Soon</Text>
                            <Text style={[styles.timelineTime, { color: COLORS.primary }]}>4:30 PM</Text>
                        </View>
                    </View>

                </View>

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
        height: height * 0.65, // map takes up top portion
    },
    driverMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#415e34',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    storeMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.text,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    topBar: {
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    etaCard: {
        position: 'absolute',
        top: 80,
        left: 24,
        right: 24,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        zIndex: 10,
        alignItems: 'center',
    },
    etaLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    etaTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.text,
        marginBottom: 16,
    },
    etaBarContainer: {
        flexDirection: 'row',
        width: '100%',
        height: 6,
        justifyContent: 'space-between',
    },
    etaBarSegmentFilled: {
        flex: 1,
        backgroundColor: '#415e34',
        borderRadius: 3,
        marginHorizontal: 2,
    },
    etaBarSegmentHalf: {
        flex: 1,
        backgroundColor: '#415e34',
        opacity: 0.5,
        borderRadius: 3,
        marginHorizontal: 2,
    },
    etaBarSegmentEmpty: {
        flex: 1,
        backgroundColor: COLORS.border,
        borderRadius: 3,
        marginHorizontal: 2,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: COLORS.border,
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    driverInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    driverAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 16,
    },
    driverDetails: {
        flex: 1,
    },
    driverName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    driverVehicle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
        marginBottom: 4,
    },
    driverRating: {
        backgroundColor: '#f6f8fb',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    ratingText: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: 'bold',
    },
    driverActions: {
        flexDirection: 'row',
    },
    actionCircleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f6f8fb',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginBottom: 24,
    },
    timelineContainer: {
        paddingLeft: 8,
    },
    timelineItem: {
        position: 'relative',
        paddingLeft: 32,
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timelineDot: {
        position: 'absolute',
        left: 0,
        top: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.border,
        zIndex: 2,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    timelineDotActive: {
        backgroundColor: '#415e34',
    },
    timelineLine: {
        position: 'absolute',
        left: 6,
        top: 14,
        width: 2,
        height: 36, // height of line connecting dots
        backgroundColor: COLORS.border,
        zIndex: 1,
    },
    timelineLineActive: {
        backgroundColor: '#415e34',
    },
    timelineTextActive: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    timelineTextArriving: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    timelineTime: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});


import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator,
    SafeAreaView,
    Switch
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';
// @ts-ignore
import { SOCKET_URL } from '@env';
import { 
    ChevronLeft,
    Camera,
    UtensilsCrossed,
    Leaf,
    CheckCircle2,
    Star,
    Moon,
    MapPin,
    CreditCard,
    Bell,
    ChevronRight,
    LogOut,
    UserCog
} from 'lucide-react-native';

export const ProfileScreen = ({ navigation }: any) => {
    const { user, signOut, refreshProfile } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const handleAvatarPress = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.didCancel || !result.assets?.[0]) return;

        const asset = result.assets[0];
        const formData = new FormData();
        // @ts-ignore
        formData.append('avatar', {
            uri: asset.uri,
            type: asset.type,
            name: asset.fileName || 'avatar.jpg',
        });

        setUploading(true);
        try {
            const { data } = await api.post('/user/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await refreshProfile();
            Alert.alert('Success', 'Profile photo updated!');
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: signOut }
            ]
        );
    };

    const DietaryChip = ({ label, icon: Icon, active }: any) => (
        <View style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
            <Icon size={14} color={active ? COLORS.white : '#475569'} style={{ marginRight: 6 }} />
            <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                {label}
            </Text>
        </View>
    );

    const SettingCard = ({ icon: Icon, label, iconBg, onPress }: any) => (
        <TouchableOpacity style={styles.settingCard} onPress={onPress}>
            <View style={[styles.settingIconBox, { backgroundColor: iconBg }]}>
                <Icon size={18} color={iconBg === '#fcebea' ? '#ea580c' : '#65a30d'} />
            </View>
            <Text style={styles.settingLabel}>{label}</Text>
            <ChevronRight size={20} color="#94a3b8" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() && navigation.goBack()}>
                    <ChevronLeft size={24} color="#84cc16" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                
                {/* Profile Avatar */}
                <View style={styles.avatarWrapper}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress} disabled={uploading}>
                        <View style={styles.avatarBorder}>
                            {uploading ? (
                                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                                    <ActivityIndicator color={COLORS.primary} />
                                </View>
                            ) : user?.profilePhotoUrl ? (
                                <Image
                                    source={{ uri: `${SOCKET_URL || 'http://localhost:8000'}${user.profilePhotoUrl}` }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <View style={[styles.avatarImage, { backgroundColor: '#e2a970', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Image 
                                        source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200' }} 
                                        style={{ width: '100%', height: '100%', opacity: 0.5 }} 
                                    />
                                </View>
                            )}
                        </View>
                        <View style={styles.cameraBadge}>
                            <Camera size={16} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.userName}>{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Elena Thorne'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'elena.thorne@example.com'}</Text>
                </View>

                {/* Dietary Preferences */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderLeft}>
                            <UtensilsCrossed size={20} color="#84cc16" style={{ marginRight: 8 }} />
                            <Text style={styles.sectionTitle}>Dietary Preferences</Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.chipsContainer}>
                        <DietaryChip label="Vegan" icon={Leaf} active={true} />
                        <DietaryChip label="Organic" icon={CheckCircle2} active={true} />
                        <DietaryChip label="Halal" icon={Moon} active={false} />
                        <DietaryChip label="Kosher" icon={Star} active={false} />
                        <DietaryChip label="Gluten-Free" icon={UtensilsCrossed} active={false} />
                    </View>
                </View>

                {/* Account Settings */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderLeft}>
                            <UserCog size={20} color="#84cc16" style={{ marginRight: 8 }} />
                            <Text style={styles.sectionTitle}>Account Settings</Text>
                        </View>
                    </View>

                    <View style={styles.cardsWrapper}>
                        <SettingCard 
                            icon={MapPin} 
                            label="Manage Addresses" 
                            iconBg="#f4fce3"
                            onPress={() => navigation.navigate('AddressList')} 
                        />
                        <View style={styles.divider} />
                        <SettingCard 
                            icon={CreditCard} 
                            label="Payment Methods" 
                            iconBg="#ffedd5"
                            onPress={() => {}} 
                        />
                        <View style={styles.divider} />
                        <SettingCard 
                            icon={Bell} 
                            label="Notification Preferences" 
                            iconBg="#f4fce3"
                            onPress={() => navigation.navigate('NotificationPreferences')} 
                        />
                        <View style={styles.divider} />
                        <SettingCard 
                            icon={Star} 
                            label="Live Support" 
                            iconBg="#e0f2fe"
                            onPress={() => navigation.navigate('SupportChat')} 
                        />
                    </View>
                </View>

                {/* App Appearance */}
                <View style={styles.appearanceCard}>
                    <View style={styles.appearanceLeft}>
                        <View style={styles.moonIconBox}>
                            <Moon size={18} color="#1e293b" />
                        </View>
                        <View>
                            <Text style={styles.appearanceTitle}>App Appearance</Text>
                            <Text style={styles.appearanceSub}>Currently in Light Mode</Text>
                        </View>
                    </View>
                    <Switch
                        value={isDarkMode}
                        onValueChange={setIsDarkMode}
                        trackColor={{ false: '#e2e8f0', true: '#84cc16' }}
                        thumbColor={COLORS.white}
                    />
                </View>

                {/* Log Out */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={20} color="#475569" style={{ marginRight: 10 }} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>GROCENEST V2.4.0</Text>
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        backgroundColor: COLORS.white,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f4fce3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    avatarWrapper: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarBorder: {
        padding: 4,
        borderRadius: 60,
        backgroundColor: '#ea580c', // an orange-isa border color like the image
        justifyContent: 'center',
        alignItems: 'center',
        width: 112,
        height: 112,
    },
    avatarImage: {
        width: 104,
        height: 104,
        borderRadius: 52,
        backgroundColor: '#f1f5f9',
        borderWidth: 4,
        borderColor: COLORS.white,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#84cc16',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#64748b',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    editText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#84cc16',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    chipActive: {
        backgroundColor: '#84cc16',
    },
    chipInactive: {
        backgroundColor: '#f1f5f9',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    chipTextActive: {
        color: COLORS.white,
    },
    chipTextInactive: {
        color: '#475569',
    },
    cardsWrapper: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    settingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    settingIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    appearanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        marginBottom: 32,
    },
    appearanceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    moonIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    appearanceTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    appearanceSub: {
        fontSize: 12,
        color: '#64748b',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#475569',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94a3b8',
        letterSpacing: 1,
        textTransform: 'uppercase',
    }
});

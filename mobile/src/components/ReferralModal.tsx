import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    Image,
    Animated,
    Dimensions
} from 'react-native';
import { COLORS } from '../theme/colors';
import { Copy, X, MessageSquare, Phone, Mail, MessageCircle } from 'lucide-react-native';

interface ReferralModalProps {
    visible: boolean;
    onClose: () => void;
    referralCode?: string;
}

const { height } = Dimensions.get('window');

export const ReferralModal: React.FC<ReferralModalProps> = ({ 
    visible, 
    onClose,
    referralCode = 'NEST50'
}) => {
    
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity 
                    style={styles.backdrop} 
                    activeOpacity={1} 
                    onPress={onClose} 
                />
                
                <View style={styles.sheetContainer}>
                    {/* Close Button & Drag Handle */}
                    <View style={styles.header}>
                        <View style={styles.dragHandle} />
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Illustration */}
                    <View style={styles.imageContainer}>
                        <View style={styles.imagePlaceholder}>
                            <Image 
                                source={{ uri: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&q=80&w=200' }} 
                                style={styles.image}
                            />
                        </View>
                    </View>

                    {/* Content */}
                    <Text style={styles.title}>Invite Friends, Earn Rewards!</Text>
                    <Text style={styles.description}>
                        Share the love for authentic flavors and get <Text style={styles.highlightText}>$10</Text> for every friend who completes their first order.
                    </Text>

                    {/* Referral Code Box */}
                    <View style={styles.codeBoxWrapper}>
                        <View style={styles.codeBox}>
                            <View>
                                <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                                <Text style={styles.codeText}>{referralCode}</Text>
                            </View>
                            <TouchableOpacity style={styles.copyButton}>
                                <Copy size={16} color={COLORS.white} />
                                <Text style={styles.copyButtonText}>Copy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Quick Share Options */}
                    <Text style={styles.shareTitle}>QUICK SHARE VIA</Text>
                    <View style={styles.shareOptionsContainer}>
                        <TouchableOpacity style={styles.shareOption}>
                            <View style={[styles.shareIconBox, { backgroundColor: '#dcfce7' }]}>
                                <MessageCircle size={24} color="#16a34a" />
                            </View>
                            <Text style={styles.shareOptionText}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shareOption}>
                            <View style={[styles.shareIconBox, { backgroundColor: '#e0e7ff' }]}>
                                <MessageSquare size={24} color="#4f46e5" />
                            </View>
                            <Text style={styles.shareOptionText}>SMS</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shareOption}>
                            <View style={[styles.shareIconBox, { backgroundColor: '#ffe4e6' }]}>
                                <Phone size={24} color="#e11d48" />
                            </View>
                            <Text style={styles.shareOptionText}>Messenger</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shareOption}>
                            <View style={[styles.shareIconBox, { backgroundColor: '#ffedd5' }]}>
                                <Mail size={24} color="#ea580c" />
                            </View>
                            <Text style={styles.shareOptionText}>Email</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Invite Button */}
                    <TouchableOpacity style={styles.inviteButton}>
                        <Text style={styles.inviteButtonText}>Invite Contacts</Text>
                    </TouchableOpacity>

                    <View style={{ height: 30 }} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheetContainer: {
        backgroundColor: '#fafaf9',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 12,
        maxHeight: height * 0.9,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    dragHandle: {
        width: 48,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#e5e7eb',
        marginBottom: 10,
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
    imagePlaceholder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#ffedd5',
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1c1917',
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: '#57534e',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    highlightText: {
        color: '#ea580c',
        fontWeight: 'bold',
    },
    codeBoxWrapper: {
        borderWidth: 1.5,
        borderColor: '#fdba74',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 4,
        marginBottom: 32,
        backgroundColor: '#fffaf5',
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    codeLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#a8a29e',
        letterSpacing: 1,
        marginBottom: 4,
    },
    codeText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ea580c',
        letterSpacing: 2,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#22c55e',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    copyButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 14,
    },
    shareTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#a8a29e',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 16,
    },
    shareOptionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    shareOption: {
        alignItems: 'center',
        flex: 1,
    },
    shareIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    shareOptionText: {
        fontSize: 12,
        color: '#57534e',
        fontWeight: '500',
    },
    inviteButton: {
        backgroundColor: '#f97316',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    inviteButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    }
});

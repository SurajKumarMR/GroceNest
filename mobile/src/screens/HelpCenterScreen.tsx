import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    TextInput
} from 'react-native';
import { COLORS } from '../theme/colors';
import { 
    Search, 
    Truck, 
    RefreshCcw, 
    CreditCard, 
    ChevronDown, 
    ChevronUp,
    MessageCircle,
    Phone,
    Headset
} from 'lucide-react-native';

const FAQItem = ({ question, answer, isExpandedInitially = false }: any) => {
    const [expanded, setExpanded] = useState(isExpandedInitially);

    return (
        <View style={styles.faqItem}>
            <TouchableOpacity 
                style={styles.faqHeader} 
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <Text style={styles.faqQuestion}>{question}</Text>
                {expanded ? (
                    <ChevronUp size={20} color={COLORS.textSecondary} />
                ) : (
                    <ChevronDown size={20} color={COLORS.textSecondary} />
                )}
            </TouchableOpacity>
            {expanded && (
                <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{answer}</Text>
                </View>
            )}
        </View>
    );
};

export const HelpCenterScreen = ({ navigation }: any) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronDown style={{ transform: [{ rotate: '90deg' }] }} size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help Center</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                
                <Text style={styles.pageTitle}>How can we help you?</Text>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={20} color={COLORS.primary} style={styles.searchIcon} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search for articles, orders..."
                        placeholderTextColor={COLORS.textSecondary}
                    />
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsContainer}>
                    <TouchableOpacity style={styles.actionCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#eef6ec' }]}>
                            <Truck size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.actionText}>Track Order</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#feeedc' }]}>
                            <RefreshCcw size={24} color={'#f97316'} />
                        </View>
                        <Text style={styles.actionText}>Request{'\n'}Refund</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#eef2ff' }]}>
                            <CreditCard size={24} color={'#3b82f6'} />
                        </View>
                        <Text style={styles.actionText}>Payment{'\n'}Issue</Text>
                    </TouchableOpacity>
                </View>

                {/* Getting Started Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>GETTING STARTED</Text>
                    <View style={styles.cardWrapper}>
                        <FAQItem 
                            question="How do I create a GroceNest account?" 
                            answer="To create an account, tap 'Sign Up' on the welcome screen. You can register using your email, Google, or Apple account."
                        />
                        <View style={styles.divider} />
                        <FAQItem 
                            question="Managing my profile details" 
                            answer="Go to the Profile tab, then tap the Edit icon on your avatar or modify your information there."
                        />
                    </View>
                </View>

                {/* Orders & Delivery Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ORDERS & DELIVERY</Text>
                    <View style={styles.cardWrapper}>
                        <FAQItem 
                            question="What if items are missing from my order?" 
                            answer="We're sorry to hear that! Please use the 'Request Refund' option or contact live support. We will resolve this quickly."
                            isExpandedInitially={true}
                        />
                    </View>
                </View>

                {/* Contact Support Buttons */}
                <View style={styles.supportButtonsContainer}>
                    <TouchableOpacity style={styles.liveChatButton}>
                        <MessageCircle size={20} color={COLORS.white} />
                        <Text style={styles.liveChatText}>Live Chat Support</Text>
                        <View style={styles.waitBadge}>
                            <Text style={styles.waitBadgeText}>5 MIN WAIT</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.callSupportButton}>
                        <Phone size={20} color={'#1e293b'} />
                        <Text style={styles.callSupportText}>Call Support</Text>
                    </TouchableOpacity>
                </View>

                {/* Rewards & Coupons */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>REWARDS & COUPONS</Text>
                    <View style={styles.cardWrapper}>
                        <FAQItem 
                            question="How to use GrocePoints?" 
                            answer="You can apply them at checkout to get discounts on your orders."
                        />
                    </View>
                </View>

                {/* Footer nested message */}
                <View style={styles.footerBox}>
                    <Headset size={36} color={'#a3e635'} style={{ marginBottom: 8 }} />
                    <Text style={styles.footerText}>"Our nest is your nest. We're here to help."</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        backgroundColor: '#f8fafc',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: 10,
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: COLORS.text,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    actionCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        letterSpacing: 1,
        marginBottom: 12,
    },
    cardWrapper: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    faqItem: {
        backgroundColor: COLORS.white,
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
    },
    faqQuestion: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1e293b',
        flex: 1,
        paddingRight: 16,
    },
    faqBody: {
        paddingHorizontal: 18,
        paddingBottom: 18,
    },
    faqAnswer: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    supportButtonsContainer: {
        marginVertical: 10,
        marginBottom: 24,
    },
    liveChatButton: {
        backgroundColor: '#84cc16',
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    liveChatText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
        flex: 1,
    },
    waitBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    waitBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    callSupportButton: {
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    callSupportText: {
        color: '#1e293b',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    footerBox: {
        backgroundColor: '#ecfccb',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    footerText: {
        color: '#65a30d',
        fontStyle: 'italic',
        fontSize: 14,
        textAlign: 'center',
    }
});

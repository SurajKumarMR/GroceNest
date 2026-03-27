import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView
} from 'react-native';
import { COLORS } from '../theme/colors';
import { 
    Store, 
    Leaf,
    Download,
    ChevronRight,
    TrendingUp,
    Clock,
    Landmark,
    ShieldCheck,
    CheckCircle2,
    RefreshCw,
    Filter,
    Lock,
    LayoutDashboard,
    Banknote,
    Receipt,
    Settings,
    Wallet
} from 'lucide-react-native';

export const MerchantPayoutsScreen = ({ navigation }: any) => {
    
    const TransactionItem = ({ amount, date, status }: any) => {
        const isCompleted = status === 'COMPLETED';
        return (
            <View style={styles.txItem}>
                <View style={styles.txLeft}>
                    <View style={[styles.txIconBox, { backgroundColor: isCompleted ? '#f4fce3' : '#fff7ed' }]}>
                        {isCompleted ? (
                            <CheckCircle2 size={16} color="#65a30d" />
                        ) : (
                            <RefreshCw size={16} color="#ea580c" />
                        )}
                    </View>
                    <View>
                        <Text style={styles.txAmount}>{amount}</Text>
                        <Text style={styles.txDate}>{date}</Text>
                    </View>
                </View>
                <View style={styles.txRight}>
                    <View style={[styles.statusPill, { backgroundColor: isCompleted ? '#ecfccb' : '#ffedd5' }]}>
                        <Text style={[styles.statusText, { color: isCompleted ? '#65a30d' : '#ea580c' }]}>
                            {status}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.downloadBtn}>
                        <Download size={18} color="#94a3b8" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.logoRow}>
                    <View style={styles.logoBox}>
                        <Store size={18} color={COLORS.white} />
                    </View>
                    <View>
                        <Text style={styles.logoTitle}>GroceNest</Text>
                        <Text style={styles.logoSubtitle}>BUSINESS</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.withdrawBtn}>
                    <Wallet size={14} color={COLORS.white} />
                    <Text style={styles.withdrawBtnText}>Withdraw</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                
                <Text style={styles.sectionTitle}>Financial Summary</Text>

                {/* Available Balance Card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceWatermark}>$</Text>
                    <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                    <Text style={styles.balanceAmount}>$2,450.00</Text>
                    <View style={styles.readyBadge}>
                        <ShieldCheck size={12} color={COLORS.white} />
                        <Text style={styles.readyBadgeText}>Ready to withdraw</Text>
                    </View>
                </View>

                {/* Split Cards */}
                <View style={styles.splitCardsRow}>
                    <View style={styles.smallCard}>
                        <View style={styles.smallCardHeader}>
                            <Clock size={16} color="#ea580c" />
                            <Text style={styles.smallCardTitle}>Pending</Text>
                        </View>
                        <Text style={styles.smallCardAmount}>$1,200.00</Text>
                        <Text style={styles.smallCardSub}>Expected in 2 days</Text>
                    </View>
                    
                    <View style={styles.smallCard}>
                        <View style={styles.smallCardHeader}>
                            <TrendingUp size={16} color="#65a30d" />
                            <Text style={styles.smallCardTitle}>This Month</Text>
                        </View>
                        <Text style={styles.smallCardAmount}>$8,642.50</Text>
                        <Text style={[styles.smallCardSub, { color: '#65a30d' }]}>+12.5% vs last month</Text>
                    </View>
                </View>

                {/* Settlement Method */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Settlement Method</Text>
                    <TouchableOpacity>
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.settlementCard} activeOpacity={0.7}>
                    <View style={styles.bankIconBox}>
                        <Landmark size={24} color="#1e293b" />
                    </View>
                    <View style={styles.bankInfo}>
                        <Text style={styles.bankName}>Barclays Bank PLC</Text>
                        <Text style={styles.bankDetails}>Checking •••• 8821</Text>
                    </View>
                    <ChevronRight size={20} color="#94a3b8" />
                </TouchableOpacity>

                {/* Payout History */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Payout History</Text>
                    <TouchableOpacity style={styles.filterBtn}>
                        <Filter size={14} color="#64748b" style={{ marginRight: 4 }} />
                        <Text style={styles.filterText}>Filter</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.historyCard}>
                    <TransactionItem amount="$450.00" date="Oct 24, 2023" status="COMPLETED" />
                    <TransactionItem amount="$1,200.00" date="Oct 22, 2023" status="PROCESSING" />
                    <TransactionItem amount="$890.50" date="Oct 15, 2023" status="COMPLETED" />
                    <TransactionItem amount="$1,420.00" date="Oct 08, 2023" status="COMPLETED" />
                    
                    <TouchableOpacity style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>View All Transactions</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.encryptionFooter}>
                    <View style={styles.encryptionRow}>
                        <Lock size={12} color="#94a3b8" style={{ marginRight: 6 }} />
                        <Text style={styles.encryptionText}>END-TO-END ENCRYPTED</Text>
                    </View>
                    <Text style={styles.companyText}>GroceNest Financial Services Ltd.</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomeTab')}>
                    <LayoutDashboard size={24} color="#94a3b8" />
                    <Text style={styles.navText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Receipt size={24} color="#94a3b8" />
                    <Text style={styles.navText}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Banknote size={24} color="#84cc16" />
                    <Text style={[styles.navText, { color: '#84cc16' }]}>Payouts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Settings size={24} color="#94a3b8" />
                    <Text style={styles.navText}>Settings</Text>
                </TouchableOpacity>
            </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: '#f8fafc',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#84cc16',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    logoSubtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#a3e635',
        letterSpacing: 1,
    },
    withdrawBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#84cc16',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#84cc16',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    withdrawBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 13,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 16,
    },
    balanceCard: {
        backgroundColor: '#84cc16',
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#84cc16',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    balanceWatermark: {
        position: 'absolute',
        right: -10,
        bottom: -30,
        fontSize: 160,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.1)',
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: '900',
        color: COLORS.white,
        marginBottom: 16,
    },
    readyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    readyBadgeText: {
        fontSize: 11,
        color: COLORS.white,
        marginLeft: 6,
        fontWeight: '600',
    },
    splitCardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    smallCard: {
        backgroundColor: COLORS.white,
        width: '48%',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    smallCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    smallCardTitle: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
        marginLeft: 6,
    },
    smallCardAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    smallCardSub: {
        fontSize: 10,
        color: '#94a3b8',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    editText: {
        color: '#65a30d',
        fontWeight: 'bold',
        fontSize: 13,
    },
    settlementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    bankIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    bankInfo: {
        flex: 1,
    },
    bankName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    bankDetails: {
        fontSize: 13,
        color: '#64748b',
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    historyCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 0,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    txItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    txLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    txIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    txDate: {
        fontSize: 12,
        color: '#94a3b8',
    },
    txRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    downloadBtn: {
        padding: 4,
    },
    viewAllBtn: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748b',
    },
    encryptionFooter: {
        alignItems: 'center',
        marginTop: 16,
    },
    encryptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    encryptionText: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    companyText: {
        fontSize: 11,
        color: '#cbd5e1',
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        justifyContent: 'space-around',
    },
    navItem: {
        alignItems: 'center',
    },
    navText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94a3b8',
        marginTop: 4,
    }
});

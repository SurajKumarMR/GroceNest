import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image
} from 'react-native';
import { COLORS } from '../theme/colors';
import { 
    Share, 
    ChevronDown, 
    TrendingUp, 
    Banknote,
    Info,
    Store,
    Receipt,
    LineChart,
    User
} from 'lucide-react-native';

export const MerchantAnalyticsScreen = ({ navigation }: any) => {
    
    const ProgressBar = ({ label, value, progress, color = '#84cc16' }: any) => (
        <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1e293b' }}>{label}</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1e293b' }}>{value}</Text>
            </View>
            <View style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3 }}>
                <View style={{ height: '100%', backgroundColor: color, borderRadius: 3, width: `${progress}%` }} />
            </View>
        </View>
    );

    const PeakHourBar = ({ height, label, active = false }: any) => (
        <View style={{ alignItems: 'center', flex: 1, marginHorizontal: 2 }}>
            <View style={{ height: 80, justifyContent: 'flex-end', width: '100%', marginBottom: 8 }}>
                <View style={{ 
                    width: '100%', 
                    height: `${height}%`, 
                    backgroundColor: active ? '#84cc16' : '#ecfccb',
                    borderRadius: 4,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {active && <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>12p</Text>}
                    {label === '6a' && <Text style={{ color: '#94a3b8', fontSize: 9 }}>6a</Text>}
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Analytics & Insights</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Share size={20} color="#475569" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dropdownBtn}>
                        <Text style={styles.dropdownText}>Last 30 Days</Text>
                        <ChevronDown size={16} color="#475569" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                
                {/* Revenue Growth */}
                <View style={styles.card}>
                    <View style={styles.revenueHeader}>
                        <View style={styles.greenIconBox}>
                            <Banknote size={20} color="#65a30d" />
                        </View>
                        <View style={styles.trendBadge}>
                            <TrendingUp size={12} color="#65a30d" />
                            <Text style={styles.trendText}>+15.3%</Text>
                        </View>
                    </View>
                    <Text style={styles.cardSubtitle}>Revenue Growth</Text>
                    <Text style={styles.largeNum}>$12,450.00</Text>
                    <View style={styles.progressBarWrapper}>
                        <View style={[styles.progressBarFill, { width: '60%' }]} />
                    </View>
                </View>

                {/* Customer Loyalty */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Customer Loyalty</Text>
                    <View style={styles.loyaltyRow}>
                        <View style={styles.donutChartContainer}>
                            {/* Simple CSS-based donut chart representation */}
                            <View style={styles.donutOuter}>
                                <View style={styles.donutInner}>
                                    <Text style={styles.donutNum}>65%</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.legendContainer}>
                            <View style={styles.legendRow}>
                                <View style={styles.legendDot} />
                                <Text style={styles.legendText}>Returning</Text>
                                <Text style={styles.legendValue}>1,240</Text>
                            </View>
                            <View style={styles.legendRow}>
                                <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
                                <Text style={styles.legendText}>New</Text>
                                <Text style={styles.legendValue}>680</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Top Categories */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Top Categories</Text>
                    <ProgressBar label="Produce" value="$5,200" progress={80} />
                    <ProgressBar label="Grains" value="$3,100" progress={50} color="#bef264" />
                    <ProgressBar label="Spices" value="$1,450" progress={25} color="#d9f99d" />
                </View>

                {/* Sales by Hour */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Sales by Hour (Peak Hours)</Text>
                        <Info size={16} color="#94a3b8" />
                    </View>
                    
                    <View style={styles.chartContainer}>
                        <PeakHourBar height={30} label="6a" />
                        <PeakHourBar height={40} />
                        <PeakHourBar height={60} />
                        <PeakHourBar height={75} />
                        <PeakHourBar height={90} />
                        <PeakHourBar height={100} active={true} />
                        <PeakHourBar height={85} />
                        <PeakHourBar height={70} />
                        <PeakHourBar height={65} />
                        <PeakHourBar height={55} />
                        <PeakHourBar height={40} />
                    </View>
                    <View style={styles.timeLabelsRow}>
                        <Text style={styles.timeLabel}>MORNING</Text>
                        <Text style={styles.timeLabel}>AFTERNOON</Text>
                        <Text style={styles.timeLabel}>EVENING</Text>
                    </View>

                    <View style={styles.insightBox}>
                        <View style={styles.insightLine} />
                        <Text style={styles.insightText}>
                            Peak sales occur between 11 AM and 1 PM. Consider increasing staffing during these hours.
                        </Text>
                    </View>
                </View>

                {/* Product Performance */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Product Performance</Text>
                        <Text style={styles.seeAllText}>SEE ALL</Text>
                    </View>

                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCol, { flex: 2 }]}>ITEM</Text>
                        <Text style={[styles.tableCol, { textAlign: 'center' }]}>SOLD</Text>
                        <Text style={[styles.tableCol, { textAlign: 'right' }]}>CONV.</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                            <Image source={{ uri: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&q=80&w=100' }} style={styles.prodImg} />
                            <Text style={styles.prodName}>Organic Bananas</Text>
                        </View>
                        <Text style={[styles.prodStat, { textAlign: 'center', flex: 1 }]}>482</Text>
                        <Text style={[styles.prodConv, { flex: 1, textAlign: 'right' }]}>18.2%</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                            <Image source={{ uri: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=100' }} style={styles.prodImg} />
                            <Text style={styles.prodName}>Fresh Spinach</Text>
                        </View>
                        <Text style={[styles.prodStat, { textAlign: 'center', flex: 1 }]}>315</Text>
                        <Text style={[styles.prodConv, { flex: 1, textAlign: 'right' }]}>14.5%</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                            <Image source={{ uri: 'https://images.unsplash.com/photo-1615486171448-4fd18c645b20?auto=format&fit=crop&q=80&w=100' }} style={styles.prodImg} />
                            <Text style={styles.prodName}>Turmeric Powder</Text>
                        </View>
                        <Text style={[styles.prodStat, { textAlign: 'center', flex: 1 }]}>189</Text>
                        <Text style={[styles.prodConv, { flex: 1, textAlign: 'right' }]}>9.1%</Text>
                    </View>

                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Store size={24} color="#94a3b8" />
                    <Text style={styles.navText}>Store</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Receipt size={24} color="#94a3b8" />
                    <Text style={styles.navText}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <LineChart size={24} color="#65a30d" />
                    <Text style={[styles.navText, { color: '#65a30d' }]}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfileTab')}>
                    <User size={24} color="#94a3b8" />
                    <Text style={styles.navText}>Profile</Text>
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
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#f8fafc',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    iconButton: {
        marginRight: 16,
    },
    dropdownBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    dropdownText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '500',
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    revenueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    greenIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f4fce3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecfccb',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trendText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#65a30d',
        marginLeft: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
        marginBottom: 4,
    },
    largeNum: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 16,
    },
    progressBarWrapper: {
        height: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 2,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#84cc16',
        borderRadius: 2,
    },
    cardTitle: {
        fontSize: 15,
        color: '#475569',
        fontWeight: '600',
        marginBottom: 16,
    },
    loyaltyRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    donutChartContainer: {
        width: 100,
        height: 100,
        marginRight: 32,
    },
    donutOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 10,
        borderColor: '#84cc16',
        borderLeftColor: '#f97316',
        borderBottomColor: '#f97316',
        transform: [{ rotate: '45deg' }],
        justifyContent: 'center',
        alignItems: 'center',
    },
    donutInner: {
        transform: [{ rotate: '-45deg' }],
        backgroundColor: COLORS.white,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    donutNum: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    legendContainer: {
        flex: 1,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#84cc16',
        marginRight: 8,
    },
    legendText: {
        fontSize: 13,
        color: '#475569',
        flex: 1,
    },
    legendValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 90,
        marginBottom: 8,
    },
    timeLabelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    timeLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#94a3b8',
        letterSpacing: 0.5,
    },
    insightBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    insightLine: {
        width: 2,
        height: '100%',
        backgroundColor: '#d9f99d',
        marginRight: 12,
    },
    insightText: {
        flex: 1,
        fontSize: 12,
        color: '#64748b',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    seeAllText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#84cc16',
    },
    tableHeader: {
        flexDirection: 'row',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    tableCol: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94a3b8',
        letterSpacing: 0.5,
        flex: 1,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    prodImg: {
        width: 36,
        height: 36,
        borderRadius: 8,
        marginRight: 12,
    },
    prodName: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    prodStat: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    prodConv: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#84cc16',
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

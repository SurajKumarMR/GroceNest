"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    TrendingUp, 
    DollarSign, 
    Users, 
    Store, 
    Package, 
    UserMinus, 
    Award, 
    Calendar,
    ArrowUpRight,
    RefreshCw,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { AdminChart } from "@/components/features/AdminChart";

interface DailyStat {
    date: string;
    orders: number;
    revenue: number;
    customerSignups: number;
}

interface MerchantPerformance {
    id: string;
    name: string;
    ownerName: string;
    ownerEmail: string;
    completedOrders: number;
    totalRevenue: number;
    rating: number;
}

interface AnalyticsOverview {
    timeframeDays: number;
    totalOrders: number;
    ordersTimeframe: number;
    totalGrossRevenue: number;
    totalNetRevenue: number;
    platformCommission: number;
    totalUsers: number;
    totalCustomers: number;
    newCustomers30Days: number;
    churnedCustomersCount: number;
    totalStores: number;
    activeStores: number;
    dailyStats: DailyStat[];
    merchantPerformance: MerchantPerformance[];
}

export default function AdminAnalyticsDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<number>(30);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== "ADMIN") {
                router.push("/");
                return;
            }
            fetchAnalytics(timeframe);
        }
    }, [user, authLoading, timeframe]);

    const fetchAnalytics = async (days: number) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/analytics/overview?days=${days}`);
            setOverview(data.overview);
        } catch (error) {
            console.error("Fetch analytics error:", error);
            toast.error("Failed to load analytics dashboard data");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || (loading && !overview)) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!overview) return null;

    return (
        <div className="container mx-auto py-10 px-4 max-w-7xl">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Executive Analytics Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Real-time overview of platform revenue, order volume, customer growth, and merchant performance.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-muted p-1 rounded-lg border text-sm font-medium">
                        {[7, 30, 90].map((days) => (
                            <button
                                key={days}
                                onClick={() => setTimeframe(days)}
                                className={`px-3 py-1.5 rounded-md transition-all ${
                                    timeframe === days
                                        ? "bg-background shadow-sm text-foreground font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {days} Days
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => fetchAnalytics(timeframe)}
                        disabled={loading}
                        className="p-2 rounded-lg border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                        title="Refresh data"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
                <Card className="border-l-4 border-l-orange-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Daily Orders & Volume</CardTitle>
                        <Package className="h-5 w-5 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview.ordersTimeframe}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                            <span>{overview.totalOrders} total all-time orders</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Gross & Net Revenue</CardTitle>
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${overview.totalGrossRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Net: <span className="font-semibold text-emerald-600">${overview.totalNetRevenue.toFixed(2)}</span> • Commission: <span className="font-semibold text-blue-600">${overview.platformCommission.toFixed(2)}</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Customer Growth</CardTitle>
                        <Users className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview.totalCustomers}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3 text-blue-500" />
                            <span>+{overview.newCustomers30Days} new (30d)</span>
                            <span className="mx-1">•</span>
                            <UserMinus className="h-3 w-3 text-amber-500" />
                            <span>{overview.churnedCustomersCount} inactive</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Merchant Performance</CardTitle>
                        <Store className="h-5 w-5 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview.activeStores} / {overview.totalStores}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Active merchant stores selling on GroceNest
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Visual Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2 mb-10">
                {/* Daily Orders Chart */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base font-semibold">
                            <span className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                                Daily Orders ({timeframe} Days)
                            </span>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                Volume Trend
                            </Badge>
                        </CardTitle>
                        <CardDescription>Frequency of customer orders completed per day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdminChart data={overview.dailyStats} type="orders" />
                    </CardContent>
                </Card>

                {/* Daily Revenue Chart */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base font-semibold">
                            <span className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                                Daily Platform Revenue ({timeframe} Days)
                            </span>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                Financial Performance
                            </Badge>
                        </CardTitle>
                        <CardDescription>Daily gross transaction volume processed across platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdminChart data={overview.dailyStats} type="revenue" />
                    </CardContent>
                </Card>
            </div>

            {/* Customer Growth & Churn Section */}
            <div className="grid gap-6 lg:grid-cols-3 mb-10">
                <Card className="lg:col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Users className="h-5 w-5 text-blue-500" />
                            Customer Growth Summary
                        </CardTitle>
                        <CardDescription>User onboarding and churn risk metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/40 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Total Registered Customers</p>
                                <p className="text-2xl font-bold text-blue-600">{overview.totalCustomers}</p>
                            </div>
                            <Badge variant="secondary">Active Base</Badge>
                        </div>

                        <div className="p-4 bg-muted/40 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">New Customers ({timeframe}d)</p>
                                <p className="text-2xl font-bold text-emerald-600">+{overview.newCustomers30Days}</p>
                            </div>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Acquisition</Badge>
                        </div>

                        <div className="p-4 bg-muted/40 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Inactive Customers (7+ days)</p>
                                <p className="text-2xl font-bold text-amber-600">{overview.churnedCustomersCount}</p>
                            </div>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">Churn Risk</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Merchant Performance Leaderboard */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base font-semibold">
                            <span className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-purple-500" />
                                Top Merchant Performance Leaderboard
                            </span>
                            <Badge variant="secondary">{overview.merchantPerformance.length} Stores Ranked</Badge>
                        </CardTitle>
                        <CardDescription>Merchant stores ranked by gross revenue and completed orders</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {overview.merchantPerformance.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground italic">No merchant performance data recorded yet.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground font-semibold">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Store Name</th>
                                            <th className="px-4 py-3">Owner</th>
                                            <th className="px-4 py-3 text-center">Orders</th>
                                            <th className="px-4 py-3 text-right">Revenue</th>
                                            <th className="px-4 py-3 text-right rounded-r-lg">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {overview.merchantPerformance.map((merchant, idx) => (
                                            <tr key={merchant.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-semibold flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    {merchant.name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-foreground">{merchant.ownerName}</p>
                                                        <p className="text-xs text-muted-foreground">{merchant.ownerEmail}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center font-medium">{merchant.completedOrders}</td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600">${merchant.totalRevenue.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                        ★ {merchant.rating.toFixed(1)}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

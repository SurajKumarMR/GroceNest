
"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Store, Package, DollarSign, TrendingUp, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { AdminChart } from "@/components/features/AdminChart";

interface AdminStats {
    totalUsers: number;
    totalStores: number;
    totalOrders: number;
    totalRevenue: number;
    newOrdersLast30Days: number;
    chartData: Array<{ date: string; orders: number; revenue: number }>;
}

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== "ADMIN") {
                router.push("/");
                return;
            }
            fetchStats();
        }
    }, [user, authLoading]);

    const fetchStats = async () => {
        try {
            const { data } = await api.get("/admin/stats");
            setStats(data.stats);
        } catch (error) {
            console.error("Fetch admin stats error:", error);
            toast.error("Failed to load dashboard statistics");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!stats) return null;

    const kpis = [
        { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
        { title: "Total Stores", value: stats.totalStores, icon: Store, color: "text-green-600" },
        { title: "Total Orders", value: stats.totalOrders, icon: Package, color: "text-orange-600" },
        { title: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-emerald-600" },
    ];

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">Super Admin Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
                {kpis.map((kpi, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Daily Orders (Last 30 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AdminChart data={stats.chartData} type="orders" />
                        <div className="mt-4 p-4 bg-muted rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{stats.newOrdersLast30Days} new orders</p>
                                <p className="text-xs text-muted-foreground">Across all stores</p>
                            </div>
                            <Badge variant="secondary">Active</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Daily Revenue (Last 30 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AdminChart data={stats.chartData} type="revenue" />
                        <div className="mt-4 p-4 bg-muted rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold">${stats.totalRevenue.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">Total platform revenue</p>
                            </div>
                            <Badge variant="secondary">Gross</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-10">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Management Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <button
                            onClick={() => router.push("/admin/users")}
                            className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all text-left group"
                        >
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="font-bold">User Access Control</div>
                                <div className="text-sm text-muted-foreground">Manage accounts and permissions</div>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push("/admin/stores")}
                            className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all text-left group"
                        >
                            <div className="p-3 bg-green-100 text-green-600 rounded-lg group-hover:scale-110 transition-transform">
                                <Store className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="font-bold">Store Moderation</div>
                                <div className="text-sm text-muted-foreground">Approve or suspend merchant shops</div>
                            </div>
                        </button>

                        <button
                            className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all text-left group opacity-60 cursor-not-allowed"
                            disabled
                        >
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                                <Settings className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="font-bold">System Settings</div>
                                <div className="text-sm text-muted-foreground">Platform configuration (Coming Soon)</div>
                            </div>
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

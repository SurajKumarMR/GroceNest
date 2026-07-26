"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Star,
    Award,
    Calendar
} from "lucide-react";

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [analyticsRes, storeRes] = await Promise.all([
                api.get("/owner/analytics/revenue?days=30").catch(() => null),
                api.get("/owner/my-store").catch(() => null),
            ]);

            setAnalytics(analyticsRes?.data || null);
            setStore(storeRes?.data || null);
        } catch (error) {
            console.error("Fetch analytics error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#415e34]" />
            </div>
        );
    }

    const grossRevenue = analytics?.totalGrossRevenue || 0;
    const netEarnings = analytics?.totalNetEarnings || grossRevenue * 0.90;
    const commissionPaid = analytics?.totalCommissionPaid || grossRevenue * 0.10;
    const completedOrders = analytics?.totalOrders || store?._count?.orders || 0;
    const avgRating = store?.averageRating || 4.8;
    const totalReviews = store?.totalReviews || 0;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 pb-24 md:pb-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#1a202c]">Performance Analytics</h1>
                    <p className="text-muted-foreground mt-1">30-day financial and store operational metrics.</p>
                </div>
                <Badge variant="outline" className="bg-[#e6ffe6] text-[#415e34] border-none font-bold px-3 py-1 text-xs w-fit flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Last 30 Days
                </Badge>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-none shadow-sm">
                    <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
                        <div className="bg-[#e6ffe6] text-[#415e34] p-2.5 rounded-xl">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-none font-semibold text-xs">
                            Gross
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Gross Revenue</div>
                        <div className="text-2xl font-extrabold text-[#1a202c]">${grossRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm">
                    <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
                        <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-xl">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-none font-semibold text-xs">
                            Net
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Net Earnings (90%)</div>
                        <div className="text-2xl font-extrabold text-[#1a202c]">${netEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm">
                    <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
                        <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Total Orders</div>
                        <div className="text-2xl font-extrabold text-[#1a202c]">{completedOrders}</div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm">
                    <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
                        <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
                            <Star className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Average Rating</div>
                        <div className="text-2xl font-extrabold text-[#1a202c] flex items-center gap-1.5">
                            {Number(avgRating).toFixed(1)}
                            <span className="text-xs font-normal text-muted-foreground">({totalReviews})</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Summary */}
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/80 border-b p-6">
                    <CardTitle className="text-lg font-bold">Financial Settlement Breakdown</CardTitle>
                    <CardDescription>Platform fee deduction and net payout distribution</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b text-sm">
                        <span className="text-muted-foreground font-medium">Total Customer Payments (Gross)</span>
                        <span className="font-bold text-[#1a202c]">${grossRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b text-sm">
                        <span className="text-muted-foreground font-medium">Platform Service Fee (10%)</span>
                        <span className="font-bold text-red-600">-${commissionPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 text-base font-extrabold text-[#415e34]">
                        <span>Net Merchant Settlement</span>
                        <span>${netEarnings.toFixed(2)}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

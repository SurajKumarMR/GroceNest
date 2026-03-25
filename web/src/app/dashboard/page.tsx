"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    RefreshCw,
    TrendingUp,
    Store,
    ShoppingCart,
    Star,
    Bell
} from "lucide-react";

export default function DashboardOverview() {
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStore();
    }, []);

    const fetchStore = async () => {
        try {
            const response = await api.get("/owner/my-store");
            setStore(response.data);
        } catch (error) {
            console.error("Fetch store error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#2ecc71]" />
            </div>
        );
    }

    // Mock data for charts
    const salesData = [
        { day: 'MON', value: 30 },
        { day: 'TUE', value: 45 },
        { day: 'WED', value: 25 },
        { day: 'THU', value: 60 },
        { day: 'FRI', value: 85 },
        { day: 'SAT', value: 75 },
        { day: 'SUN', value: 95 },
    ];

    const topSelling = [
        { name: "Premium Basmati Rice (5kg)", units: 124, progress: 85 },
        { name: "Pure Cow Ghee (500ml)", units: 98, progress: 65 },
        { name: "Organic Moong Lentils", units: 76, progress: 50 },
    ];

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24 md:pb-8">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#1a202c]">Analytics Overview</h1>
                    <p className="text-xs text-muted-foreground mt-1">Last updated: 2 mins ago</p>
                </div>
                <Badge variant="outline" className="bg-[#e6ffe6] text-[#2ecc71] border-none font-bold tracking-wider px-3 py-1 text-xs flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    LIVE
                </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-none shadow-sm shadow-gray-100">
                    <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
                        <div className="bg-[#e6ffe6] text-[#2ecc71] p-2 rounded-lg">
                            <ShoppingCart className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-[#2ecc71]">+12%</span>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-xs text-muted-foreground mb-1">Today's Orders</div>
                        <div className="text-2xl font-bold text-[#1a202c]">42</div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm shadow-gray-100">
                    <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
                        <div className="bg-[#e6ffe6] text-[#2ecc71] p-2 rounded-lg">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-[#2ecc71]">+8%</span>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-xs text-muted-foreground mb-1">Today's Revenue</div>
                        <div className="text-2xl font-bold text-[#1a202c]">$1,240</div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm shadow-gray-100">
                    <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
                        <div className="bg-transparent text-[#2ecc71] p-0">
                            <Star className="h-5 w-5 fill-[#2ecc71]" />
                        </div>
                        <span className="text-xs font-bold text-[#2ecc71]">New</span>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-xs text-muted-foreground mb-1">Store Rating</div>
                        <div className="text-2xl font-bold text-[#1a202c] flex items-center gap-1">
                            4.6 <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm shadow-gray-100">
                    <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
                        <div className="bg-transparent text-[#2ecc71] p-0 gap-1 flex items-center">
                            <div className="bg-[#e6ffe6] p-2 rounded-lg">
                                <ShoppingCart className="h-4 w-4 text-[#2ecc71]" />
                            </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-xs text-muted-foreground mb-1">Active Orders</div>
                        <div className="text-2xl font-bold text-[#1a202c]">14</div>
                    </CardContent>
                </Card>
            </div>

            {/* Sales Overview Chart Placeholder */}
            <Card className="rounded-2xl border-none shadow-sm shadow-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-[#1a202c]">Sales Overview</h3>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none font-medium">
                        This Week
                    </Badge>
                </div>
                
                {/* Mocked Bar Chart */}
                <div className="h-48 flex items-end justify-between px-2 gap-2">
                    {salesData.map((data, i) => (
                        <div key={data.day} className="flex flex-col items-center flex-1">
                            <div 
                                className="w-full max-w-[12px] md:max-w-[20px] rounded-t-md" 
                                style={{
                                    height: `${data.value}%`,
                                    background: `linear-gradient(to top, #ffe6cc 0%, #ff8c00 100%)`, // Orange gradient
                                    opacity: i === 6 ? 1 : 0.6 // Highlight last day
                                }}
                            ></div>
                            <span className="text-[10px] text-muted-foreground font-bold mt-2">{data.day}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Top Selling Products */}
            <Card className="rounded-2xl border-none shadow-sm shadow-gray-100 p-6">
                <h3 className="font-bold text-[#1a202c] mb-6">Top Selling Products</h3>
                <div className="space-y-6">
                    {topSelling.map((product) => (
                        <div key={product.name}>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-semibold text-gray-800">{product.name}</span>
                                <span className="text-muted-foreground">{product.units} units</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[#2ecc71] rounded-full"
                                    style={{ width: `${product.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Customer Insights Donut Placeholder */}
            <Card className="rounded-2xl border-none shadow-sm shadow-gray-100 p-6 mb-8">
                <h3 className="font-bold text-[#1a202c] mb-6">Customer Insights</h3>
                
                <div className="flex items-center gap-8">
                    {/* Mock Donut */}
                    <div className="relative w-24 h-24 md:w-32 md:h-32">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                                className="text-gray-100"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="text-[#2ecc71]"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray="70, 100"
                            />
                        </svg>
                        <div className="absolute top-[50%] left-[50%] transform translate-x-[-50%] translate-y-[-50%] text-center">
                            <div className="font-bold text-lg md:text-xl text-[#1a202c]">70%</div>
                            <div className="text-[10px] text-muted-foreground font-bold tracking-wider">NEW</div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex items-center text-[10px] font-bold text-muted-foreground tracking-wider mb-1">
                                <div className="w-2 h-2 rounded-full bg-[#2ecc71] mr-2"></div>
                                NEW CUSTOMERS
                            </div>
                            <div className="text-xl font-bold text-[#1a202c]">1,420</div>
                        </div>
                        <div>
                            <div className="flex items-center text-[10px] font-bold text-muted-foreground tracking-wider mb-1">
                                <div className="w-2 h-2 rounded-full bg-[#e6ffe6] mr-2"></div>
                                RETURNING
                            </div>
                            <div className="text-xl font-bold text-[#1a202c]">612</div>
                        </div>
                    </div>
                </div>
            </Card>

        </div>
    );
}

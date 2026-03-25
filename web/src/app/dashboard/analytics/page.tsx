"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Share,
    ChevronDown,
    Banknote,
    Info,
    MoreHorizontal
} from "lucide-react";

export default function AnalyticsInsightsPage() {

    const topCategories = [
        { name: "Produce", value: "$5,200", progress: 85 },
        { name: "Grains", value: "$3,100", progress: 55 },
        { name: "Spices", value: "$1,450", progress: 25 },
    ];

    const salesHours = [
        { label: "6a", value: 30, active: false },
        { label: "", value: 40, active: false },
        { label: "", value: 45, active: false },
        { label: "", value: 50, active: false },
        { label: "", value: 70, active: false },
        { label: "12p", value: 90, active: true },
        { label: "", value: 85, active: true },
        { label: "", value: 75, active: true },
        { label: "", value: 65, active: false },
        { label: "", value: 55, active: false },
    ];

    const productPerformance = [
        { 
            name: "Organic Bananas", 
            sold: 482, 
            conv: "18.2%", 
            image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=80"
        },
        { 
            name: "Fresh Spinach", 
            sold: 315, 
            conv: "14.5%", 
            image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=80"
        },
        { 
            name: "Turmeric Powder", 
            sold: 189, 
            conv: "9.1%", 
            image: "https://images.unsplash.com/photo-1615486511484-92e172fc34ea?auto=format&fit=crop&q=80&w=80"
        },
    ];

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-4 pb-24 md:pb-8 bg-gray-50 min-h-screen">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-[#1a202c]">Analytics & Insights</h1>
                    <button className="p-2 text-muted-foreground hover:bg-gray-200 rounded-full transition-colors">
                        <Share className="h-5 w-5" />
                    </button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm">
                    Last 30 Days
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {/* Revenue Growth Card */}
            <Card className="rounded-2xl border-none shadow-sm shadow-gray-100">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-[#e6ffe6] p-3 rounded-2xl">
                            <Banknote className="h-6 w-6 text-[#2ecc71]" />
                        </div>
                        <Badge variant="secondary" className="bg-[#e6ffe6] text-[#2ecc71] border-none font-bold px-3 py-1 text-sm">
                            ~ +15.3%
                        </Badge>
                    </div>
                    
                    <div className="text-sm font-semibold text-muted-foreground mb-1">Revenue Growth</div>
                    <div className="text-4xl font-black text-[#1a202c] mb-6">$12,450.00</div>
                    
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#8cc63f] w-[70%] rounded-full"></div>
                    </div>
                </CardContent>
            </Card>

            {/* Customer Loyalty Card */}
            <Card className="rounded-2xl border-none shadow-sm shadow-gray-100">
                <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">Customer Loyalty</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2 flex items-center justify-between">
                    {/* Mock Donut Chart */}
                    <div className="relative w-28 h-28">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            {/* Background Circle (New) */}
                            <path
                                className="text-orange-400"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            {/* Foreground Circle (Returning) */}
                            <path
                                className="text-[#8cc63f]"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray="65, 100"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-2xl font-black text-[#1a202c]">65%</div>
                        </div>
                    </div>

                    <div className="flex-1 ml-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs font-bold text-muted-foreground">
                                <div className="w-3 h-3 rounded-full bg-[#8cc63f] mr-2"></div>
                                Returning
                            </div>
                            <div className="font-bold text-[#1a202c]">1,240</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs font-bold text-muted-foreground">
                                <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                                New
                            </div>
                            <div className="font-bold text-[#1a202c]">680</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Top Categories Card */}
            <Card className="rounded-2xl border-none shadow-sm shadow-gray-100">
                <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">Top Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6">
                    {topCategories.map((cat, i) => (
                        <div key={cat.name}>
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-sm text-[#1a202c]">{cat.name}</span>
                                <span className="font-bold text-sm text-[#1a202c]">{cat.value}</span>
                            </div>
                            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full"
                                    style={{ 
                                        width: `${cat.progress}%`,
                                        backgroundColor: i === 0 ? '#8cc63f' : i === 1 ? '#aed581' : '#c5e1a5' 
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Sales by Hour Card */}
            <Card className="rounded-2xl border-none shadow-sm shadow-gray-100">
                <CardHeader className="p-6 pb-2 flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-semibold text-[#1a202c]">Sales by Hour (Peak Hours)</CardTitle>
                    <Info className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-6 pt-4">
                    {/* Bar Chart */}
                    <div className="h-24 flex items-end justify-between gap-1 mb-2 px-1">
                        {salesHours.map((hour, i) => (
                            <div key={i} className="flex flex-col items-center flex-1">
                                <div 
                                    className="w-full rounded-sm flex items-center justify-center relative"
                                    style={{ 
                                        height: `${hour.value}%`,
                                        backgroundColor: hour.active ? '#8cc63f' : '#e6f4d5'
                                    }}
                                >
                                    {hour.label ? (
                                        <span className={`text-[9px] font-bold absolute top-1 ${hour.active ? 'text-white' : 'text-gray-400'}`}>
                                            {hour.label}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Axis Labels */}
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground tracking-wider px-2 mb-6">
                        <span>MORNING</span>
                        <span>AFTERNOON</span>
                        <span>EVENING</span>
                    </div>

                    {/* Insight Box */}
                    <div className="border-l-2 border-[#8cc63f] pl-4 py-1">
                        <p className="text-sm text-muted-foreground italic">
                            Peak sales occur between 11 AM and 1 PM. Consider increasing staffing during these hours.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Product Performance Card */}
            <Card className="rounded-2xl border-none shadow-sm shadow-gray-100">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-[#1a202c]">Product Performance</h3>
                    <button className="text-[#8cc63f] text-sm font-bold tracking-wider">SEE ALL</button>
                </div>
                
                <div className="p-6 px-0 pt-2">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text[10px] font-bold text-muted-foreground tracking-wider">
                                <th className="px-6 py-3 font-semibold pb-4">ITEM</th>
                                <th className="px-6 py-3 font-semibold pb-4 text-right">SOLD</th>
                                <th className="px-6 py-3 font-semibold pb-4 text-right">CONV.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productPerformance.map((item, idx) => (
                                <tr key={idx} className="border-t border-gray-50">
                                    <td className="px-6 py-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="font-semibold text-sm text-[#1a202c]">{item.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-[#1a202c] text-sm">
                                        {item.sold}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-[#8cc63f] text-sm">
                                        {item.conv}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>
    );
}

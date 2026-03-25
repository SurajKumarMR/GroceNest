
"use client";

import { useMemo } from "react";

interface ChartDataPoint {
    date: string;
    orders: number;
    revenue: number;
}

interface AdminChartProps {
    data: ChartDataPoint[];
    type: "orders" | "revenue";
}

export function AdminChart({ data, type }: AdminChartProps) {
    const maxVal = useMemo(() => {
        if (!data || data.length === 0) return 1;
        return Math.max(...data.map(d => type === "orders" ? d.orders : d.revenue), 1);
    }, [data, type]);

    if (!data || data.length === 0) {
        return (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg italic">
                No data available for the period
            </div>
        );
    }

    return (
        <div className="h-[250px] w-full flex items-end gap-1 px-2 pt-8 pb-4 bg-muted/10 rounded-xl relative overflow-hidden group">
            {/* Simple Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-8 px-2 pointer-events-none">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-full border-t border-muted/30" />
                ))}
            </div>

            {data.map((point, i) => {
                const val = type === "orders" ? point.orders : point.revenue;
                const heightPercent = (val / maxVal) * 100;

                return (
                    <div
                        key={i}
                        className="flex-1 flex flex-col justify-end items-center group/bar"
                    >
                        {/* Tooltip on hover */}
                        <div className="absolute -top-4 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-black text-white text-[10px] py-1 px-2 rounded-md z-10 whitespace-nowrap">
                            {point.date}: {type === "revenue" ? `$${val.toFixed(2)}` : `${val} orders`}
                        </div>

                        <div
                            className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 ease-out sm:hover:scale-x-110 cursor-pointer ${type === "orders" ? "bg-orange-500/80 hover:bg-orange-600" : "bg-emerald-500/80 hover:bg-emerald-600"
                                }`}
                            style={{ height: `${Math.max(heightPercent, 2)}%` }}
                        />

                        <div className="mt-2 text-[8px] sm:text-[10px] font-medium text-muted-foreground -rotate-45 sm:rotate-0 origin-center translate-y-2 sm:translate-y-0">
                            {point.date.split('-').slice(1).join('/')}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

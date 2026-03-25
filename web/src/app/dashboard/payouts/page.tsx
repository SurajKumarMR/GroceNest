"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Download, 
    Landmark, 
    ChevronRight, 
    Filter, 
    ArrowDownToLine,
    Clock,
    TrendingUp,
    CheckCircle2,
    Lock,
    RefreshCw,
    Wallet
} from "lucide-react";

export default function PayoutsScreen() {
    const transactions = [
        { id: 1, amount: "$450.00", date: "Oct 24, 2023", status: "COMPLETED" },
        { id: 2, amount: "$1,200.00", date: "Oct 22, 2023", status: "PROCESSING" },
        { id: 3, amount: "$890.50", date: "Oct 15, 2023", status: "COMPLETED" },
        { id: 4, amount: "$1,420.00", date: "Oct 08, 2023", status: "COMPLETED" },
    ];

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 pb-24 md:pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-[#1a202c]">Financial Summary</h1>
                <Button className="bg-[#84cc16] hover:bg-[#65a30d] text-white rounded-full font-bold px-6 shadow-sm flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Withdraw
                </Button>
            </div>

            {/* Available Balance Card */}
            <Card className="rounded-3xl border-none shadow-sm shadow-[#84cc16]/20 relative overflow-hidden bg-gradient-to-br from-[#9de038] to-[#7fcd19] text-white">
                {/* Large Background Dollar Sign */}
                <div className="absolute -right-8 -bottom-8 text-white/20 font-bold text-[180px] leading-none pointer-events-none select-none">
                    $
                </div>
                
                <CardContent className="p-8 relative z-10">
                    <div className="text-sm font-bold tracking-wider mb-2 opacity-90">AVAILABLE BALANCE</div>
                    <div className="text-5xl font-extrabold mb-4 tracking-tight">$2,450.00</div>
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none rounded-full px-3 py-1 flex items-center gap-1.5 w-fit">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium text-xs">Ready to withdraw</span>
                    </Badge>
                </CardContent>
            </Card>

            {/* Pending & This Month Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="rounded-2xl border-none shadow-sm shadow-gray-100">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm font-medium">
                            <Clock className="h-4 w-4 text-orange-400" />
                            Pending
                        </div>
                        <div className="text-2xl font-bold text-[#1a202c] mb-1">$1,200.00</div>
                        <div className="text-xs text-muted-foreground">Expected in 2 days</div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm shadow-gray-100">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm font-medium">
                            <TrendingUp className="h-4 w-4 text-[#84cc16]" />
                            This Month
                        </div>
                        <div className="text-2xl font-bold text-[#1a202c] mb-1">$8,642.50</div>
                        <div className="text-xs text-[#84cc16] font-bold">+12.5% vs last month</div>
                    </CardContent>
                </Card>
            </div>

            {/* Settlement Method */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[#1a202c]">Settlement Method</h2>
                    <button className="text-[#84cc16] text-sm font-bold hover:underline">Edit</button>
                </div>
                
                <Card className="rounded-2xl border-none shadow-sm shadow-gray-100">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <Landmark className="h-6 w-6 text-gray-700" />
                            </div>
                            <div>
                                <div className="font-bold text-[#1a202c]">Barclays Bank PLC</div>
                                <div className="text-sm text-muted-foreground">Checking •••• 8821</div>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                    </CardContent>
                </Card>
            </div>

            {/* Payout History */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[#1a202c]">Payout History</h2>
                    <button className="text-muted-foreground text-sm flex items-center gap-1 hover:text-[#1a202c] transition-colors">
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
                </div>

                <Card className="rounded-2xl border-none shadow-sm shadow-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        {transactions.map((tx, idx) => (
                            <div key={idx} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${tx.status === 'COMPLETED' ? 'bg-[#e6ffe6] text-[#2ecc71]' : 'bg-[#fff0e6] text-[#ff8c00]'}`}>
                                        {tx.status === 'COMPLETED' ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : (
                                            <RefreshCw className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#1a202c]">{tx.amount}</div>
                                        <div className="text-xs text-muted-foreground">{tx.date}</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <Badge 
                                        variant="outline" 
                                        className={`border-none font-bold tracking-wider px-2.5 py-1 text-[10px] uppercase
                                            ${tx.status === 'COMPLETED' 
                                                ? 'bg-[#e6ffe6] text-[#2ecc71]' 
                                                : 'bg-[#fff0e6] text-[#ff8c00]'
                                            }`}
                                    >
                                        {tx.status}
                                    </Badge>
                                    <button className="text-muted-foreground hover:text-gray-700 p-2">
                                        <ArrowDownToLine className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="p-4 border-t border-gray-50 bg-gray-50/30 text-center">
                        <button className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                            View All Transactions
                        </button>
                    </div>
                </Card>
            </div>

            {/* Footer */}
            <div className="pb-8 pt-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                    <Lock className="h-3 w-3" />
                    End-to-end encrypted
                </div>
                <div className="text-xs text-muted-foreground/70">
                    GroceNest Financial Services Ltd.
                </div>
            </div>
        </div>
    );
}

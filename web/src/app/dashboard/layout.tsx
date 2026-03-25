"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Settings,
    Store,
    ArrowLeft,
    BarChart2,
    Home,
    Banknote
} from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { label: "Home", href: "/dashboard", icon: LayoutDashboard },
        { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
        { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
        { label: "Store", href: "/dashboard/products", icon: Store },
        { label: "Payouts", href: "/dashboard/payouts", icon: Banknote },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-muted/30 pb-16 md:pb-0">
            {/* Sidebar (Desktop) */}
            <aside className="w-64 border-r bg-background hidden md:block sticky top-0 h-screen">
                <div className="p-6 border-b flex items-center gap-2">
                    <Store className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">Owner Hub</span>
                </div>
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                pathname === item.href
                                    ? "bg-primary/10 text-[#415e34]" // use theme green
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-[#415e34]" : "")} />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t">
                    <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Shop
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>

            {/* Bottom Nav (Mobile) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-2 flex justify-between items-center safe-area-bottom">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center w-16 gap-1"
                        >
                            <item.icon 
                                className={cn(
                                    "h-6 w-6",
                                    isActive ? "text-[#2ecc71]" : "text-gray-400"
                                )} 
                            />
                            <span className={cn(
                                "text-[10px] font-medium tracking-wide",
                                isActive ? "text-[#2ecc71]" : "text-gray-400"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

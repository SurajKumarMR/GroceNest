
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Truck,
    ClipboardList,
    History,
    Settings,
    ArrowLeft,
    LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DriverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { logout } = useAuth();

    const navItems = [
        { label: "Available Jobs", href: "/driver", icon: ClipboardList },
        { label: "Active Orders", href: "/driver/active", icon: Truck },
        { label: "My History", href: "/driver/history", icon: History },
        { label: "Settings", href: "/driver/settings", icon: Settings },
    ];

    return (
        <div className="flex min-h-screen bg-muted/30">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-background hidden md:block sticky top-0 h-screen">
                <div className="p-6 border-b flex items-center gap-2">
                    <Truck className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">Driver Portal</span>
                </div>
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t space-y-2">
                    <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-4 py-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Shop
                    </Link>
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 text-sm text-destructive hover:bg-destructive/10 w-full px-4 py-2 rounded-md transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}

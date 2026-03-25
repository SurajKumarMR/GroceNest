
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Store,
    Settings,
    ChevronRight,
    ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Store Management", href: "/admin/stores", icon: Store },
    // { name: "System Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-muted/20">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-background hidden lg:flex flex-col sticky top-0 h-screen">
                <div className="p-6 border-b flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-lg">
                        <ShoppingBag className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">Admin Portal</h2>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">GroceNest Platform</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                    {item.name}
                                </div>
                                <ChevronRight className={cn("h-4 w-4 transition-transform", isActive ? "rotate-90" : "opacity-0 group-hover:opacity-100")} />
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t">
                    <Link
                        href="/"
                        className="flex items-center gap-3 p-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        Back to Site
                    </Link>
                </div>
            </aside>

            {/* Mobile Bottom Nav (Optional) or just Header */}
            <main className="flex-1 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}

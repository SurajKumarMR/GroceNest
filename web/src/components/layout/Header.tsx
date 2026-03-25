
"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Search, Mic, MapPin, Bell, ShoppingCart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const CartSheet = dynamic(() => import("@/components/features/CartSheet").then(m => m.CartSheet), {
    ssr: false,
    loading: () => <div className="h-10 w-10 animate-pulse bg-muted rounded-full" />
});

const NotificationBell = dynamic(() => import("@/components/features/NotificationBell").then(m => m.NotificationBell), {
    ssr: false,
    loading: () => <div className="h-10 w-10 animate-pulse bg-muted rounded-full" />
});

export function Header() {
    const { user, logout, isAuthenticated } = useAuth();

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="container flex h-16 max-w-[1400px] mx-auto items-center justify-between px-4">
                
                {/* Logo & Nav Links */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/logo.png"
                            alt="GroceNest Logo"
                            width={110}
                            height={36}
                            className="h-9 w-auto hover:opacity-90 transition-opacity"
                            priority
                        />
                    </Link>
                    
                    <nav className="hidden lg:flex items-center gap-6">
                        <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            Home
                        </Link>
                        <Link href="/stores" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            Browse
                        </Link>
                        <Link href="/cart" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            Cart
                        </Link>
                        <Link href="/checkout" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            Checkout
                        </Link>
                        <Link href="/confirmed" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            Confirmed
                        </Link>
                        <Link href="/orders" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            Track Order
                        </Link>
                        {user?.role === 'ADMIN' && (
                            <Link href="/admin" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                                Admin
                            </Link>
                        )}
                        {!user && (
                             <Link href="/admin" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                                Admin
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-6">
                    {/* Search Bar */}
                    <div className="hidden md:flex relative w-80">
                        <input
                            type="text"
                            placeholder="Search groceries, stores..."
                            className="w-full h-10 pl-10 pr-10 rounded-full border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const query = e.currentTarget.value;
                                    if (query) window.location.href = `/search?q=${encodeURIComponent(query)}`;
                                }
                            }}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Search className="h-4 w-4" />
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                            <Mic className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center gap-5 text-muted-foreground">
                        <button className="hover:text-foreground transition-colors">
                            <MapPin className="h-5 w-5" />
                        </button>
                        
                        {/* Notifications */}
                        <div className="relative">
                            <NotificationBell />
                        </div>
                        
                        {/* Cart */}
                        <div className="relative">
                            <CartSheet />
                        </div>

                        {/* Auth Button */}
                        {isAuthenticated ? (
                            <Button 
                                onClick={logout} 
                                className="h-9 px-6 rounded-full bg-[#526a31] hover:bg-[#415525] text-white text-sm font-medium"
                            >
                                Sign Out
                            </Button>
                        ) : (
                            <Link href="/login">
                                <Button 
                                    className="h-9 px-6 rounded-full bg-[#526a31] hover:bg-[#415525] text-white text-sm font-medium"
                                >
                                    Sign In
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

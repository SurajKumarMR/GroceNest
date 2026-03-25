"use client";

import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function OrderConfirmedPage() {
    const { user } = useAuth();
    const [orderNumber, setOrderNumber] = useState("");

    useEffect(() => {
        // Generate a random order number for display purposes
        // In a real app, this would be passed via query param or fetched from an API
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        setOrderNumber(`ORD-${randomString}`);
    }, []);

    return (
        <div className="min-h-screen bg-[#f8f9f6] flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-sm border border-border/50 p-10 sm:p-16 max-w-2xl w-full text-center flex flex-col items-center">
                    <div className="h-28 w-28 bg-[#e7eedb] rounded-full flex items-center justify-center mb-8">
                        <CheckCircle2 className="h-14 w-14 text-[#5c7736]" />
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-heading font-bold text-foreground mb-4">
                        Order Confirmed!
                    </h1>

                    <p className="text-lg text-muted-foreground mb-12 max-w-md mx-auto leading-relaxed">
                        Thank you for shopping with us{user ? `, ${user.firstName}` : ''}. Your order <span className="font-bold text-foreground">{orderNumber}</span> has been successfully placed.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Link href="/orders" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-lg shadow-sm">
                                Track Order
                            </Button>
                        </Link>
                        
                        <Link href="/" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-2xl font-bold text-lg border-2 hover:bg-muted/30">
                                Return to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

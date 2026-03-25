
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Store, Package, Clock } from "lucide-react";

export default function DriverDashboard() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState<string | null>(null);

    useEffect(() => {
        fetchAvailableOrders();
    }, []);

    const fetchAvailableOrders = async () => {
        try {
            const res = await api.get("/driver/available");
            setOrders(res.data);
        } catch (error) {
            console.error("Fetch available orders error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOrder = async (orderId: string) => {
        setAccepting(orderId);
        try {
            await api.post(`/driver/orders/${orderId}/accept`);
            alert("Order accepted successfully!");
            fetchAvailableOrders();
        } catch (error) {
            console.error("Accept order error:", error);
            alert("Failed to accept order.");
        } finally {
            setAccepting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Available Jobs</h1>
                <p className="text-muted-foreground mt-1">Accept orders waiting for delivery in your area.</p>
            </div>

            {orders.length === 0 ? (
                <Card className="bg-muted/20 border-dashed">
                    <CardContent className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                        <Package className="h-8 w-8 mb-2 opacity-20" />
                        <p>No available orders at the moment.</p>
                        <Button variant="outline" className="mt-4" onClick={fetchAvailableOrders}>
                            Refresh List
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {orders.map((order) => (
                        <Card key={order.id} className="overflow-hidden">
                            <CardHeader className="border-b bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline">#{order.orderNumber}</Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <CardTitle className="mt-2 text-lg">{order.store.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Store className="h-4 w-4 text-primary mt-1 shrink-0" />
                                        <div className="text-sm">
                                            <div className="font-semibold">Pick up</div>
                                            <div className="text-muted-foreground">{order.store.streetAddress}, {order.store.city}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-4 w-4 text-secondary mt-1 shrink-0" />
                                        <div className="text-sm">
                                            <div className="font-semibold">Deliver to</div>
                                            <div className="text-muted-foreground">
                                                {order.deliveryAddress.streetAddress}, {order.deliveryAddress.city}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex items-center justify-between">
                                    <div className="text-sm font-medium">
                                        Earnings: <span className="text-primary">$5.50</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleAcceptOrder(order.id)}
                                        disabled={!!accepting}
                                    >
                                        {accepting === order.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Accept Job
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

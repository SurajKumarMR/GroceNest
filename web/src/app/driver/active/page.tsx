
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Store, Phone, CheckCircle2 } from "lucide-react";

export default function ActiveOrdersPage() {
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState<string | null>(null);

    useEffect(() => {
        fetchActiveDeliveries();
    }, []);

    const fetchActiveDeliveries = async () => {
        try {
            const res = await api.get("/driver/my-deliveries");
            // Filter only OUT_FOR_DELIVERY
            setDeliveries(res.data.filter((d: any) => d.status === "OUT_FOR_DELIVERY"));
        } catch (error) {
            console.error("Fetch active deliveries error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeliverOrder = async (orderId: string) => {
        setCompleting(orderId);
        try {
            await api.post(`/driver/orders/${orderId}/deliver`);
            alert("Order delivered successfully!");
            fetchActiveDeliveries();
        } catch (error) {
            console.error("Deliver order error:", error);
            alert("Failed to complete delivery.");
        } finally {
            setCompleting(null);
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
                <h1 className="text-3xl font-bold tracking-tight">Active Deliveries</h1>
                <p className="text-muted-foreground mt-1">Orders you've accepted and are currently fulfilling.</p>
            </div>

            {deliveries.length === 0 ? (
                <Card className="bg-muted/20">
                    <CardContent className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mb-2 opacity-20 text-primary" />
                        <p>No active deliveries. Head to "Available Jobs" to find orders.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {deliveries.map((delivery) => (
                        <Card key={delivery.id}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Badge>ACTIVE</Badge>
                                        <span className="text-sm font-medium">#{delivery.orderNumber}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">Accepted at {new Date(delivery.driverAssignedAt).toLocaleTimeString()}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Store className="h-4 w-4" />
                                            <span className="font-bold">Pick-up Location</span>
                                        </div>
                                        <div className="pl-6">
                                            <div className="font-medium">{delivery.store.name}</div>
                                            <div className="text-sm text-muted-foreground">{delivery.store.streetAddress}, {delivery.store.city}</div>
                                            <div className="flex items-center gap-2 text-sm mt-1">
                                                <Phone className="h-3 w-3" />
                                                <span>{delivery.store.phone || "No phone listed"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-secondary">
                                            <MapPin className="h-4 w-4" />
                                            <span className="font-bold">Drop-off Location</span>
                                        </div>
                                        <div className="pl-6">
                                            <div className="font-medium">Customer Address</div>
                                            <div className="text-sm text-muted-foreground">
                                                {delivery.deliveryAddress.streetAddress}, {delivery.deliveryAddress.city}, {delivery.deliveryAddress.state} {delivery.deliveryAddress.postalCode}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/10 border-t p-4 flex justify-between items-center">
                                <div className="text-sm">
                                    Total items: <span className="font-bold">{delivery.orderItems?.length || 0}</span>
                                </div>
                                <Button
                                    className="gap-2"
                                    onClick={() => handleDeliverOrder(delivery.id)}
                                    disabled={!!completing}
                                >
                                    {completing === delivery.id && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Mark as Delivered
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

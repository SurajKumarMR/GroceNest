
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Package, Star } from "lucide-react";
import Link from "next/link";
import { LiveTracking } from "@/components/features/LiveTracking";
import { socketService } from "@/lib/socket";
import { ReviewForm } from "@/components/features/ReviewForm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function OrdersPage() {
    const { isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchOrders();

            const token = localStorage.getItem("token");
            if (token) {
                const socket = socketService.connect(token);

                socket.on("statusUpdate", (data: { orderId: string, status: string }) => {
                    console.log("Status update received:", data);
                    setOrders(prev => prev.map(order =>
                        order.id === data.orderId ? { ...order, status: data.status } : order
                    ));
                });
            }
        }

        return () => {
            // We could disconnect or just leave it for global notifications
        };
    }, [isAuthenticated]);

    const fetchOrders = async () => {
        try {
            const response = await api.get("/orders");
            const fetchedOrders = response.data;
            setOrders(fetchedOrders);

            // Join rooms for all orders that are not DELIVERED or CANCELLED
            const token = localStorage.getItem("token");
            if (token) {
                fetchedOrders.forEach((order: any) => {
                    if (order.status !== "DELIVERED" && order.status !== "CANCELLED") {
                        socketService.joinOrder(order.id);
                    }
                });
            }
        } catch (error) {
            console.error("Fetch orders error:", error);
        } finally {
            setLoading(false);
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
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Order History</h1>

            {orders.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                    <p className="text-muted-foreground mb-6">Looks like you haven't placed any orders yet.</p>
                    <Link href="/stores" className="text-primary hover:underline font-medium">
                        Start shopping now
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <Card key={order.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/50 py-4">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Order #{order.orderNumber}
                                        </p>
                                        <p className="text-sm font-semibold">
                                            Placed on {format(new Date(order.placedAt), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                    <Badge variant={
                                        order.status === "DELIVERED" ? "default" :
                                            order.status === "CANCELLED" ? "destructive" : "secondary"
                                    }>
                                        {order.status.replace("_", " ")}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="py-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Store</p>
                                        <p className="font-semibold">{order.store.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Total</p>
                                        <p className="text-xl font-bold text-primary">${order.totalAmount.toFixed(2)}</p>
                                    </div>
                                </div>

                                {order.status === "OUT_FOR_DELIVERY" && (
                                    <LiveTracking orderId={order.id} orderNumber={order.orderNumber} />
                                )}

                                {order.status === "DELIVERED" && order.reviews?.length === 0 && (
                                    <div className="pt-4 border-t flex justify-end">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">Rate Order</Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Rate Order #{order.orderNumber}</DialogTitle>
                                                </DialogHeader>
                                                <ReviewForm
                                                    orderId={order.id}
                                                    storeId={order.storeId}
                                                    onSuccess={() => {
                                                        fetchOrders();
                                                        // Close dialog logic usually handled by state, 
                                                        // but for now, simple refresh works.
                                                    }}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}

                                {order.reviews?.length > 0 && (
                                    <div className="pt-4 border-t">
                                        <div className="bg-muted/30 p-4 rounded-lg">
                                            <p className="text-xs font-semibold mb-1">Your Review</p>
                                            <div className="flex gap-1 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={cn(
                                                            "h-3 w-3",
                                                            i < order.reviews[0].rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-sm italic text-muted-foreground">"{order.reviews[0].reviewText}"</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

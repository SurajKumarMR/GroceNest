"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    Package,
    Clock,
    ShoppingBag,
    User
} from "lucide-react";
import { format } from "date-fns";

type TabValue = "NEW" | "PREPARING" | "READY";

export default function StoreOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabValue>("NEW");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get("/owner/orders");
            setOrders(response.data);
        } catch (error) {
            console.error("Fetch orders error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, status: string) => {
        try {
            await api.put(`/owner/orders/${orderId}/status`, { status });
            fetchOrders();
        } catch (error) {
            console.error("Update status error:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#415e34]" />
            </div>
        );
    }

    // Filter orders based on active tab
    const filteredOrders = orders.filter(order => {
        if (activeTab === "NEW") {
            return order.status === "PENDING" || order.status === "CONFIRMED";
        }
        if (activeTab === "PREPARING") {
            return order.status === "PREPARING";
        }
        if (activeTab === "READY") {
            return order.status === "READY" || order.status === "DELIVERED";
        }
        return false;
    });

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-1">
                        GroceNest FOR BUSINESS
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#415e34]">Orders</h1>
                </div>
            </div>

            {/* Custom Tabs */}
            <div className="flex space-x-2 border-b pb-4">
                {(["NEW", "PREPARING", "READY"] as TabValue[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium text-sm rounded-full transition-colors ${
                            activeTab === tab 
                                ? "bg-[#415e34] text-white shadow-sm"
                                : "text-muted-foreground hover:bg-gray-100"
                        }`}
                    >
                        {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Order Cards List */}
            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                        <p className="text-lg font-medium text-muted-foreground">No orders in this category.</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <Card key={order.id} className="overflow-hidden border-gray-200">
                            {/* Card Top: Order Meta */}
                            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
                                <div className="flex items-center space-x-3">
                                    <div className="font-bold text-lg">#{order.orderNumber}</div>
                                    <Badge variant="outline" className="bg-white">
                                        {format(new Date(order.placedAt), "hh:mm a")}
                                    </Badge>
                                </div>
                                <div className="font-bold text-xl text-[#415e34]">
                                    ${order.totalAmount.toFixed(2)}
                                </div>
                            </div>

                            {/* Card Body: Customer & Items */}
                            <CardContent className="p-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    
                                    {/* Customer Profile */}
                                    <div className="space-y-3">
                                        <div className="flex items-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                            <User className="w-4 h-4 mr-2" />
                                            Customer
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 rounded-full bg-[#f6f8fb] border-2 border-white shadow-sm flex items-center justify-center text-[#415e34] font-bold text-lg">
                                                {order.user.firstName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-base">{order.user.firstName} {order.user.lastName}</div>
                                                <div className="text-sm text-muted-foreground">{order.user.email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Breakdown Placeholder (Since backend response varies, we use what we assume) */}
                                    <div className="space-y-3">
                                        <div className="flex items-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                            <Package className="w-4 h-4 mr-2" />
                                            Order Details
                                        </div>
                                        {order.items && order.items.length > 0 ? (
                                            <ul className="text-sm space-y-1">
                                                {order.items.slice(0, 3).map((item: any, idx: number) => (
                                                    <li key={idx} className="flex justify-between">
                                                        <span>{item.quantity}x {item.product?.name || "Product"}</span>
                                                        <span className="text-muted-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                                                    </li>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <li className="text-muted-foreground italic text-xs pt-1">
                                                        + {order.items.length - 3} more items
                                                    </li>
                                                )}
                                            </ul>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">
                                                Standard grocery order
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>

                            {/* Card Bottom: Actions */}
                            <CardFooter className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
                                {order.status === "PENDING" && (
                                    <>
                                        <Button 
                                            variant="outline" 
                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => handleStatusUpdate(order.id, "CANCELLED")}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Decline
                                        </Button>
                                        <Button 
                                            className="bg-[#415e34] hover:bg-[#324928] text-white"
                                            onClick={() => handleStatusUpdate(order.id, "CONFIRMED")}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Accept Order
                                        </Button>
                                    </>
                                )}
                                
                                {order.status === "CONFIRMED" && (
                                    <Button 
                                        className="bg-[#415e34] hover:bg-[#324928] text-white w-full md:w-auto"
                                        onClick={() => handleStatusUpdate(order.id, "PREPARING")}
                                    >
                                        <Clock className="w-4 h-4 mr-2" />
                                        Start Preparing
                                    </Button>
                                )}

                                {order.status === "PREPARING" && (
                                    <Button 
                                        className="bg-[#415e34] hover:bg-[#324928] text-white w-full md:w-auto"
                                        onClick={() => handleStatusUpdate(order.id, "READY")}
                                    >
                                        <Package className="w-4 h-4 mr-2" />
                                        Mark as Ready
                                    </Button>
                                )}

                                {order.status === "READY" && (
                                    <div className="text-sm font-bold text-[#415e34] flex items-center bg-[#e6ede4] px-4 py-2 rounded-full">
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Waiting for Driver
                                    </div>
                                )}
                                {order.status === "DELIVERED" && (
                                    <div className="text-sm font-bold text-gray-500 flex items-center">
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Completed
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

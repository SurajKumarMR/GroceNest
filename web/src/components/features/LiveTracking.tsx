
"use client";

import { useEffect, useState } from "react";
import { socketService } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation } from "lucide-react";

interface LiveTrackingProps {
    orderId: string;
    orderNumber: string;
}

export function LiveTracking({ orderId, orderNumber }: LiveTrackingProps) {
    const { user } = useAuth();
    const [location, setLocation] = useState<{ latitude: number; longitude: number; heading?: number } | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            socketService.connect(token);
            socketService.joinOrder(orderId);

            socketService.onLocationUpdated((data) => {
                console.log("Location update received for", orderId, data);
                setLocation(data);
            });
        }

        return () => {
            socketService.offLocationUpdated();
        };
    }, [orderId]);

    if (!location) {
        return (
            <div className="bg-muted p-4 rounded-lg flex items-center justify-center h-32 text-muted-foreground animate-pulse">
                Waiting for driver location...
            </div>
        );
    }

    return (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Badge className="bg-green-500 hover:bg-green-600">LIVE</Badge>
                    <span className="text-sm font-semibold">Driver is on the way!</span>
                </div>
                <Navigation className="h-4 w-4 animate-bounce text-primary" />
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                </div>
                {/* Placeholder for actual map */}
                <div className="bg-slate-200 h-40 rounded relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent" />
                    <div
                        className="absolute transition-all duration-1000 ease-in-out"
                        style={{
                            left: `${(location.longitude + 180) % 100}%`,
                            top: `${(location.latitude + 90) % 100}%`
                        }}
                    >
                        <div className="relative">
                            <div className="absolute -inset-2 bg-primary/20 rounded-full animate-ping" />
                            <Navigation
                                className="h-6 w-6 text-primary fill-primary"
                                style={{ transform: `rotate(${(location.heading || 0) - 45}deg)` }}
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter z-10">Map Visualization</p>
                </div>
            </div>
        </div>
    );
}

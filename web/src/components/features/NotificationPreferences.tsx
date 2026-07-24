"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, MessageSquare, Mail, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export function NotificationPreferences() {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [push, setPush] = useState(true);
    const [sms, setSms] = useState(true);
    const [email, setEmail] = useState(true);

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/notifications/preferences');
                setPush(data.push ?? data.pushEnabled ?? true);
                setSms(data.sms ?? data.smsEnabled ?? true);
                setEmail(data.email ?? data.emailEnabled ?? true);
            } catch (error) {
                console.error('Failed to load notification preferences:', error);
                toast.error('Failed to load notification preferences');
            } finally {
                setLoading(false);
            }
        };

        fetchPreferences();
    }, []);

    const handleToggle = async (channel: 'push' | 'sms' | 'email', value: boolean) => {
        const nextPush = channel === 'push' ? value : push;
        const nextSms = channel === 'sms' ? value : sms;
        const nextEmail = channel === 'email' ? value : email;

        // Optimistic UI update
        if (channel === 'push') setPush(value);
        if (channel === 'sms') setSms(value);
        if (channel === 'email') setEmail(value);

        try {
            setUpdating(true);
            await api.put('/notifications/preferences', {
                push: nextPush,
                sms: nextSms,
                email: nextEmail
            });
            toast.success('Notification preferences updated');
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
            // Revert on error
            if (channel === 'push') setPush(!value);
            if (channel === 'sms') setSms(!value);
            if (channel === 'email') setEmail(!value);
            toast.error('Failed to update preferences');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Notification Preferences
                    </CardTitle>
                    <CardDescription>Loading preferences...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Preferences
                </CardTitle>
                <CardDescription>
                    Control which channels GroceNest can use to contact you regarding orders, delivery status, and promotions.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Push Notifications */}
                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-md bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400">
                            <Bell className="h-5 w-5" />
                        </div>
                        <div>
                            <Label htmlFor="push-toggle" className="text-base font-semibold cursor-pointer">
                                Push Notifications
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Real-time push notifications on your browser and mobile device
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="push-toggle"
                        checked={push}
                        onCheckedChange={(val) => handleToggle('push', val)}
                        disabled={updating}
                    />
                </div>

                {/* SMS Notifications */}
                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                            <Label htmlFor="sms-toggle" className="text-base font-semibold cursor-pointer">
                                SMS Notifications
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Direct text message alerts for delivery updates and driver ETAs
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="sms-toggle"
                        checked={sms}
                        onCheckedChange={(val) => handleToggle('sms', val)}
                        disabled={updating}
                    />
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-md bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div>
                            <Label htmlFor="email-toggle" className="text-base font-semibold cursor-pointer">
                                Email Notifications
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Order receipts, invoices, and special store discounts
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="email-toggle"
                        checked={email}
                        onCheckedChange={(val) => handleToggle('email', val)}
                        disabled={updating}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

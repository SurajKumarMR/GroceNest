"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Bell, CheckCircle2, XCircle, RefreshCw, Send, Smartphone, Mail, MessageSquare, ShieldAlert } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface DeliveryStats {
    total: number;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    deliveryRate: number;
    failureRate: number;
    highFailureRate: boolean;
    channelStats: Record<string, { total: number; failed: number; sent: number; delivered: number }>;
    recentFailures: Array<{
        id: string;
        type: string;
        channel: string;
        title: string;
        error: string;
        sentAt: string;
    }>;
}

interface NotificationLog {
    id: string;
    type: string;
    channel: string;
    title?: string;
    body: string;
    status: string;
    error?: string;
    sentAt: string;
    deliveredAt?: string;
    user?: {
        email: string;
        firstName: string;
        lastName: string;
    };
}

export function NotificationDeliveryDashboard() {
    const [stats, setStats] = useState<DeliveryStats | null>(null);
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const [statsRes, logsRes] = await Promise.all([
                api.get('/admin/notifications/stats?days=7'),
                api.get('/admin/notifications/logs?limit=25')
            ]);
            setStats(statsRes.data);
            setLogs(logsRes.data);
        } catch (error) {
            console.error('Failed to load notification tracking data:', error);
            toast.error('Failed to load notification delivery stats');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Notification Delivery Tracking
                    </CardTitle>
                    <CardDescription>Loading delivery analytics...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!stats) return null;

    return (
        <div className="mt-10 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Notification Delivery Tracking</h2>
                    <p className="text-sm text-muted-foreground">
                        Real-time delivery status, failure logging, and channel health metrics across Push, SMS, and Email.
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border bg-card hover:bg-accent transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* High Failure Rate Warning Alert */}
            {stats.highFailureRate && (
                <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-start gap-4">
                    <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-base">High Notification Failure Rate Warning</h4>
                        <p className="text-sm mt-1">
                            Notification failure rate is currently at <span className="font-semibold">{stats.failureRate}%</span> ({stats.failedCount} failed out of {stats.total} total attempts in the last 7 days). Please inspect provider keys (FCM, Twilio, SendGrid) and error logs below.
                        </p>
                    </div>
                </div>
            )}

            {/* Delivery Stats KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Success Rate</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.deliveryRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.sentCount + stats.deliveredCount} delivered of {stats.total} attempts
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Dispatched</CardTitle>
                        <Send className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all channels (7 days)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Failed Attempts</CardTitle>
                        <XCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.failedCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Failure rate: {stats.failureRate}%</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
                        <AlertCircle className={`h-4 w-4 ${stats.highFailureRate ? 'text-destructive' : 'text-emerald-600'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.highFailureRate ? (
                                <Badge variant="destructive">Degraded</Badge>
                            ) : (
                                <Badge className="bg-emerald-600 hover:bg-emerald-700">Healthy</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Threshold: &lt;15% failure rate</p>
                    </CardContent>
                </Card>
            </div>

            {/* Channel Breakdown */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Bell className="h-4 w-4 text-lime-600" />
                            Push (FCM)
                        </CardTitle>
                        <Badge variant="outline">{stats.channelStats.push?.total || 0} total</Badge>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sent / Delivered:</span>
                            <span className="font-medium text-emerald-600">{(stats.channelStats.push?.sent || 0) + (stats.channelStats.push?.delivered || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Failed:</span>
                            <span className="font-medium text-destructive">{stats.channelStats.push?.failed || 0}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-orange-600" />
                            SMS (Twilio)
                        </CardTitle>
                        <Badge variant="outline">{stats.channelStats.sms?.total || 0} total</Badge>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sent / Delivered:</span>
                            <span className="font-medium text-emerald-600">{(stats.channelStats.sms?.sent || 0) + (stats.channelStats.sms?.delivered || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Failed:</span>
                            <span className="font-medium text-destructive">{stats.channelStats.sms?.failed || 0}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Mail className="h-4 w-4 text-sky-600" />
                            Email (SendGrid)
                        </CardTitle>
                        <Badge variant="outline">{stats.channelStats.email?.total || 0} total</Badge>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sent / Delivered:</span>
                            <span className="font-medium text-emerald-600">{(stats.channelStats.email?.sent || 0) + (stats.channelStats.email?.delivered || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Failed:</span>
                            <span className="font-medium text-destructive">{stats.channelStats.email?.failed || 0}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notification Delivery Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Notification Logs</CardTitle>
                    <CardDescription>Comprehensive audit log of notification attempts and failure reasons</CardDescription>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No notification logs recorded yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Channel</TableHead>
                                        <TableHead>Recipient</TableHead>
                                        <TableHead>Title & Body</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Error / Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                                {format(new Date(log.sentAt), "MMM dd, HH:mm:ss")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize text-xs">
                                                    {log.type} ({log.channel})
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {log.user ? `${log.user.firstName} ${log.user.lastName}` : "User"}
                                                <div className="text-muted-foreground">{log.user?.email}</div>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <div className="font-semibold text-xs truncate">{log.title || "Notification"}</div>
                                                <div className="text-xs text-muted-foreground truncate">{log.body}</div>
                                            </TableCell>
                                            <TableCell>
                                                {log.status === "delivered" ? (
                                                    <Badge className="bg-emerald-600 text-white text-xs">Delivered</Badge>
                                                ) : log.status === "sent" ? (
                                                    <Badge variant="secondary" className="text-xs">Sent</Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="text-xs">Failed</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs max-w-xs truncate text-muted-foreground">
                                                {log.error ? (
                                                    <span className="text-destructive font-mono text-[11px]">{log.error}</span>
                                                ) : (
                                                    <span className="text-emerald-600 font-mono text-[11px]">Success</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

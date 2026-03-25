
"use client";

import { Bell } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b p-4">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary hover:underline font-medium"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
                <ScrollArea className="h-80">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-xs text-muted-foreground">You don't have any notifications yet.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "flex flex-col gap-1 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                                        !n.isRead && "bg-primary/5"
                                    )}
                                    onClick={() => !n.isRead && markAsRead(n.id)}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold">{n.title}</span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                                    {!n.isRead && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="border-t p-2">
                    <Link href="/profile/notifications" className="block w-full">
                        <Button variant="ghost" className="w-full text-xs h-8">
                            View all
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}

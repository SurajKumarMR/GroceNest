
"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

export default function AdminUserManagement() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== "ADMIN") {
                router.push("/");
                return;
            }
            fetchUsers();
        }
    }, [user, authLoading]);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get("/admin/users");
            setUsers(data);
        } catch (error) {
            console.error("Fetch admin users error:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await api.patch(`/admin/users/${userId}/status`, { isActive: !currentStatus });
            setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
            toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        } catch (error) {
            console.error("Toggle user status error:", error);
            toast.error("Failed to update user status");
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8 flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">User Management</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Platform Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id} className={!u.isActive ? "opacity-60 bg-muted/30" : ""}>
                                    <TableCell className="font-medium text-nowrap">
                                        {u.firstName} {u.lastName}
                                    </TableCell>
                                    <TableCell className="text-nowrap">{u.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                                            {u.role.toLowerCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={u.isActive ? "default" : "destructive"}>
                                            {u.isActive ? "active" : "inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-nowrap">{format(new Date(u.createdAt), "MMM d, yyyy")}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant={u.isActive ? "destructive" : "default"}
                                            size="sm"
                                            onClick={() => toggleStatus(u.id, u.isActive)}
                                            disabled={u.id === user?.id} // Prevents self-deactivation
                                        >
                                            {u.isActive ? "Deactivate" : "Activate"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

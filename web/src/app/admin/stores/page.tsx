
"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

interface AdminStore {
    id: string;
    name: string;
    description: string;
    logoUrl: string | null;
    createdAt: string;
    owner: {
        email: string;
        firstName: string;
        lastName: string;
    };
    category: string;
    isActive: boolean;
}

export default function AdminStoreManagement() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stores, setStores] = useState<AdminStore[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== "ADMIN") {
                router.push("/");
                return;
            }
            fetchStores();
        }
    }, [user, authLoading]);

    const fetchStores = async () => {
        try {
            const { data } = await api.get("/admin/stores");
            setStores(data);
        } catch (error) {
            console.error("Fetch admin stores error:", error);
            toast.error("Failed to load stores");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (storeId: string, currentStatus: boolean) => {
        try {
            await api.patch(`/admin/stores/${storeId}/status`, { isActive: !currentStatus });
            setStores(stores.map(s => s.id === storeId ? { ...s, isActive: !currentStatus } : s));
            toast.success(`Store ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        } catch (error) {
            console.error("Toggle store status error:", error);
            toast.error("Failed to update store status");
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
                <h1 className="text-3xl font-bold">Store Management</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Grocery Stores</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Store Name</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stores.map((s) => (
                                <TableRow key={s.id} className={!s.isActive ? "opacity-60 bg-muted/30" : ""}>
                                    <TableCell className="font-medium text-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Store className="h-4 w-4 text-muted-foreground" />
                                            {s.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-nowrap">{s.owner.firstName} {s.owner.lastName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{s.category || 'General'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={s.isActive !== false ? "default" : "destructive"}>
                                            {s.isActive !== false ? "active" : "inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-nowrap">{format(new Date(s.createdAt), "MMM d, yyyy")}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant={s.isActive !== false ? "destructive" : "default"}
                                            size="sm"
                                            onClick={() => toggleStatus(s.id, s.isActive !== false)}
                                        >
                                            {s.isActive !== false ? "Deactivate" : "Activate"}
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

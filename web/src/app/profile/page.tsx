
"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, MapPin, Package, Camera, Loader2 } from "lucide-react";
import Link from "next/link";
import { AddressManager } from "@/components/features/AddressManager";
import { useState, useRef } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function ProfilePage() {
    const { user, login } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        const formData = new FormData();
        formData.append("avatar", file);

        setIsUploading(true);
        try {
            const response = await api.post("/user/profile/avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Update local user state via login or a dedicated sync function if available
            // For now, let's assume we can trigger a profile refresh or re-login with the same token
            const token = localStorage.getItem("token");
            if (token) {
                const userRes = await api.get("/user/profile");
                login(token, userRes.data);
            }
            toast.success("Profile photo updated!");
        } catch (error) {
            console.error("Avatar upload error:", error);
            toast.error("Failed to upload avatar");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader className="text-center">
                        <div className="relative mx-auto mb-4 group cursor-pointer" onClick={handleAvatarClick}>
                            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/20">
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                ) : user.profilePhotoUrl ? (
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.profilePhotoUrl}`}
                                        alt="Avatar"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-10 w-10 text-muted-foreground" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-6 w-6 text-white" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{user.firstName} {user.lastName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-wrap break-all">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{user.role.toLowerCase()}</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Link href="/orders">
                                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4 text-left">
                                    <Package className="h-5 w-5 text-primary" />
                                    <div>
                                        <div className="font-semibold text-sm">Order History</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">Track your pending or past deliveries</div>
                                    </div>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <AddressManager />

                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Password and authentication settings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline">Change Password</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

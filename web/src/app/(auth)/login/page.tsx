
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data } = await api.post("/auth/login", { email, password });
            login(data.token, data.refreshToken, data.user);
        } catch (err: any) {
            const errorData = err.response?.data?.error;
            setError(typeof errorData === "string" ? errorData : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg dark:bg-slate-800">
                <div className="flex flex-col items-center">
                    <Link href="/" className="flex items-center space-x-2 mb-6">
                        <ShoppingBag className="h-8 w-8 text-primary" />
                        <span className="font-bold text-2xl tracking-tight">GroceNest</span>
                    </Link>
                    <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-foreground">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Or{" "}
                        <Link href="/register" className="font-medium text-primary hover:text-primary/90">
                            create a new account
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <Label htmlFor="email-address">Email address</Label>
                            <Input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="mt-1"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive text-center">{error}</div>
                    )}

                    <div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

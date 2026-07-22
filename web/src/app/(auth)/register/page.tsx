
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag } from "lucide-react";

export default function RegisterPage() {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        // Client-side validation matching server-side rules exactly
        if (formData.firstName.trim().length < 2) {
            setError("First name must be at least 2 characters long");
            return;
        }
        if (formData.lastName.trim().length < 2) {
            setError("Last name must be at least 2 characters long");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError("Invalid email address");
            return;
        }
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }
        if (!/[A-Z]/.test(formData.password)) {
            setError("Password must contain at least one uppercase letter");
            return;
        }
        if (!/[0-9]/.test(formData.password)) {
            setError("Password must contain at least one number");
            return;
        }
        if (!/[^A-Za-z0-9]/.test(formData.password)) {
            setError("Password must contain at least one special character");
            return;
        }
        if (formData.phone && !/^\+44[0-9]{10}$/.test(formData.phone)) {
            setError("Invalid UK phone number format (+44xxxxxxxxxx)");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post("/auth/register", formData);
            login(data.token, data.refreshToken, data.user);
        } catch (err: any) {
            setError(err.response?.data?.error || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main role="main" className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg dark:bg-slate-800">
                <header role="banner" className="flex flex-col items-center">
                    <Link href="/" className="flex items-center space-x-2 mb-6">
                        <ShoppingBag className="h-8 w-8 text-primary" />
                        <span className="font-bold text-2xl tracking-tight">GroceNest</span>
                    </Link>
                    <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-foreground">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Or{" "}
                        <Link href="/login" className="font-medium text-primary hover:text-primary/90">
                            sign in to existing account
                        </Link>
                    </p>
                </header>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    required
                                    className="mt-1"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    required
                                    className="mt-1"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                className="mt-1"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive text-center">{error}</div>
                    )}

                    <div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? "Creating account..." : "Sign up"}
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
}

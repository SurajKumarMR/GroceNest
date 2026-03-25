
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";

export function AddressManager() {
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "USA",
        isDefault: false
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await api.get("/users/addresses");
            setAddresses(res.data);
        } catch (error) {
            console.error("Fetch addresses error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            await api.post("/users/addresses", formData);
            setIsOpen(false);
            setFormData({
                street: "",
                city: "",
                state: "",
                zipCode: "",
                country: "USA",
                isDefault: false
            });
            fetchAddresses();
        } catch (error) {
            console.error("Add address error:", error);
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (confirm("Are you sure you want to delete this address?")) {
            try {
                await api.delete(`/users/addresses/${id}`);
                fetchAddresses();
            } catch (error) {
                console.error("Delete address error:", error);
            }
        }
    };

    if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Saved Addresses</h3>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" /> Add New
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Address</DialogTitle>
                            <DialogDescription>Enter your delivery address details below.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddAddress} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="street">Street Address</Label>
                                <Input
                                    id="street"
                                    value={formData.street}
                                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="zip">ZIP Code</Label>
                                    <Input
                                        id="zip"
                                        value={formData.zipCode}
                                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={adding}>
                                    {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Address
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {addresses.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p>No saved addresses found.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {addresses.map((address) => (
                        <Card key={address.id}>
                            <CardContent className="p-4 flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="font-semibold text-sm">
                                        {address.streetAddress}
                                        {address.isDefault && (
                                            <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">Default</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {address.city}, {address.state} {address.postalCode}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{address.country}</div>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => handleDeleteAddress(address.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

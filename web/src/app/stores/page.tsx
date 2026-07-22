
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Store } from "@/types";
import { StoreCard } from "@/components/features/StoreCard";
import { StoreCardSkeleton } from "@/components/features/StoreCardSkeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import { Header } from "@/components/layout/Header";

export default function StoresPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchStores = async () => {
            try {
                setError(null);
                const { data } = await api.get<Store[]>("/stores");
                setStores(data);
            } catch (err) {
                console.error("Failed to fetch stores", err);
                setError("Failed to load stores. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchStores();
    }, []);

    const filteredStores = stores.filter((store) =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.cuisineTypes.some(type => type.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <Header />

            <main className="flex-1 container py-8 pt-24">
                <div className="mb-8 relative max-w-lg mx-auto md:mx-0">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by store name or cuisine..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <StoreCardSkeleton key={i} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-lg text-destructive">{error}</p>
                    </div>
                ) : filteredStores.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredStores.map((store) => (
                            <StoreCard key={store.id} store={store} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-lg text-muted-foreground">No stores found matching your search.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

"use client";

import { useState, useEffect, use } from "react";
import api from "@/lib/api";
import { Store, Product } from "@/types";
import { ProductCard } from "@/components/features/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Check, SlidersHorizontal, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";

type PageParams = Promise<{ slug: string }>;

interface StoreDetails extends Store {
    products: Product[];
}

export default function StoreDetailsPage({ params }: { params: PageParams }) {
    const { slug } = use(params);

    const [store, setStore] = useState<StoreDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStore = async () => {
            try {
                const { data } = await api.get<StoreDetails>(`/stores/${slug}`);
                setStore(data);
            } catch (err) {
                console.error("Failed to fetch store details", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchStore();
        }
    }, [slug]);

    if (loading) {
        return <StoreDetailsSkeleton />;
    }

    if (error || !store) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8f9f6]">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold">Store not found</h1>
                    <Link href="/stores">
                        <Button className="mt-4 bg-[#f97316] text-white">Browse all stores</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8f9f6]">
            <Header />

            <main className="container max-w-[1400px] mx-auto py-8 px-4 flex gap-8">
                {/* Left Sidebar Filters */}
                <div className="hidden lg:block w-64 flex-shrink-0 space-y-8">
                    {/* Ethnicity / Cuisine */}
                    <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Ethnicity / Cuisine</h4>
                        <div className="space-y-2">
                            {['Indian', 'Chinese', 'Mexican', 'Middle Eastern', 'Caribbean', 'West African'].map((item, idx) => (
                                <button key={item} className={`flex items-center justify-between w-full p-3 rounded-xl border text-sm font-semibold transition-colors ${idx === 0 ? 'border-[#5c7736] text-[#5c7736] bg-[#f4fce3]' : 'border-border/50 bg-white text-muted-foreground hover:border-[#5c7736] hover:text-[#5c7736]'}`}>
                                    {item}
                                    {idx === 0 && <Check className="h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Delivery Time */}
                    <div>
                         <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Delivery Time</h4>
                         <div className="space-y-2">
                            {['Under 30 min', 'Under 45 min', 'Under 60 min'].map((item, idx) => (
                                <button key={item} className={`w-full p-3 rounded-xl border text-sm font-semibold text-left transition-colors ${idx === 0 ? 'border-[#5c7736] text-[#5c7736] bg-[#f4fce3]' : 'border-border/50 bg-white text-muted-foreground hover:border-[#5c7736] hover:text-[#5c7736]'}`}>
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dietary Options */}
                    <div>
                         <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Dietary Options</h4>
                         <div className="flex flex-wrap gap-2">
                            {['Halal', 'Vegan', 'Organic', 'Gluten-Free', 'Kosher'].map((item, idx) => {
                                const activeFill = idx === 0 || idx === 2;
                                const activeOutline = idx === 1;
                                let btnClass = "px-4 py-2 rounded-full border text-sm font-medium transition-colors ";
                                if (activeFill) btnClass += "bg-[#415e34] border-[#415e34] text-white";
                                else if (activeOutline) btnClass += "bg-white border-[#5c7736] text-[#5c7736]";
                                else btnClass += "bg-white border-border/50 text-muted-foreground hover:border-[#5c7736] hover:text-[#5c7736]";
                                
                                return (
                                    <button key={item} className={btnClass}>{item}</button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                         <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Price Range</h4>
                         <div className="flex items-center gap-2">
                            <input type="text" placeholder="£0" className="w-full p-3 rounded-xl border border-border/50 bg-white text-sm" />
                            <span className="text-muted-foreground">-</span>
                            <input type="text" placeholder="£150" className="w-full p-3 rounded-xl border border-border/50 bg-white text-sm" />
                         </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-border">
                        <Button className="w-full h-12 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-base shadow-sm">
                            Apply Filters
                        </Button>
                        <Button variant="ghost" className="w-full h-10 font-bold text-muted-foreground hover:text-foreground">
                            Clear All
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-border/50 gap-4">
                        <div>
                            <h1 className="text-3xl font-heading font-bold text-foreground capitalize">{store.name || "Patel's Indian Grocery"}</h1>
                            <p className="text-muted-foreground font-medium mt-1">Showing {Math.min(24, store.products.length)} of {store.products.length} products</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 bg-white border border-border/50 px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-muted transition-colors">
                                Sort: Recommended <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <button className="flex items-center gap-2 bg-white border border-border/50 px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-muted transition-colors lg:hidden">
                                <SlidersHorizontal className="h-4 w-4" /> Filters
                            </button>
                        </div>
                    </div>

                    {/* Product Grid */}
                    {store.products.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                            {store.products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-border/50">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold mb-2">No products found</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">We couldn't find any products matching your current filters. Try removing some filters.</p>
                            <Button className="mt-6 bg-[#f97316] text-white font-bold px-8 rounded-full">Clear Filters</Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function StoreDetailsSkeleton() {
    return (
        <div className="min-h-screen bg-[#f8f9f6]">
            <Header />
            <div className="container max-w-[1400px] mx-auto py-8 px-4 flex gap-8">
                <div className="hidden lg:block w-64 space-y-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-4 w-24 bg-muted/60" />
                            <Skeleton className="h-40 w-full rounded-xl bg-muted/60" />
                        </div>
                    ))}
                </div>
                <div className="flex-1">
                    <div className="mb-8 pb-6 border-b border-border/50 flex justify-between">
                        <div>
                            <Skeleton className="h-8 w-64 mb-3 bg-muted/60" />
                            <Skeleton className="h-4 w-40 bg-muted/60" />
                        </div>
                        <Skeleton className="h-10 w-48 rounded-full bg-muted/60" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-72 w-full rounded-2xl bg-muted/60" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

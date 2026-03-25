
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { ProductCard } from "@/components/features/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const [products, setProducts] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(query);
    const [activeTab, setActiveTab] = useState<"products" | "stores">("products");

    // Filters
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        setSearchTerm(query);
        fetchResults();
    }, [query, minPrice, maxPrice, selectedCategory]);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get("/products/categories");
            setCategories(data);
        } catch (error) {
            console.error("Fetch categories error:", error);
        }
    };

    const fetchResults = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.append("q", query);
            if (minPrice) params.append("minPrice", minPrice);
            if (maxPrice) params.append("maxPrice", maxPrice);
            if (selectedCategory) params.append("category", selectedCategory);

            const [prodRes, storeRes] = await Promise.all([
                api.get(`/products?${params.toString()}`),
                api.get(`/stores?${params.toString()}`)
            ]);

            setProducts(prodRes.data);
            setStores(storeRes.data);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="w-full md:w-64 space-y-8">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4" />
                                Filters
                            </h2>
                            {(minPrice || maxPrice || selectedCategory) && (
                                <Button
                                    variant="link"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => {
                                        setMinPrice("");
                                        setMaxPrice("");
                                        setSelectedCategory("");
                                    }}
                                >
                                    Clear all
                                </Button>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Categories</label>
                                <div className="space-y-1.5">
                                    <button
                                        className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${selectedCategory === "" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                        onClick={() => setSelectedCategory("")}
                                    >
                                        All Categories
                                    </button>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                            onClick={() => setSelectedCategory(cat.id)}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Price Range</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Min"
                                        type="number"
                                        className="h-9"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                    />
                                    <span className="text-muted-foreground text-sm">-</span>
                                    <Input
                                        placeholder="Max"
                                        type="number"
                                        className="h-9"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">
                                {query ? `Search Results for "${query}"` : "Search GroceNest"}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Found {products.length} products and {stores.length} stores
                            </p>
                        </div>

                        <div className="flex bg-muted p-1 rounded-lg">
                            <button
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "products" ? "bg-background shadow-sm" : "hover:text-foreground/80"}`}
                                onClick={() => setActiveTab("products")}
                            >
                                Products ({products.length})
                            </button>
                            <button
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "stores" ? "bg-background shadow-sm" : "hover:text-foreground/80"}`}
                                onClick={() => setActiveTab("stores")}
                            >
                                Stores ({stores.length})
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {activeTab === "products" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                    {products.length === 0 && (
                                        <div className="col-span-full text-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
                                            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No products found</h3>
                                            <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {stores.map((store) => (
                                        <a
                                            key={store.id}
                                            href={`/stores/${store.slug}`}
                                            className="flex gap-4 p-4 border rounded-xl hover:shadow-md transition-shadow bg-card"
                                        >
                                            <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                                                {store.logoUrl && <img src={store.logoUrl} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold truncate">{store.name}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{store.description}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">
                                                        {store.cuisineTypes?.[0] || "Grocery"}
                                                    </span>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                    {stores.length === 0 && (
                                        <div className="col-span-full text-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
                                            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold">No stores found</h3>
                                            <p className="text-muted-foreground">Try a different search term.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchResults />
        </Suspense>
    );
}

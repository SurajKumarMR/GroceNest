"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Star,
    MessageSquare,
    Send,
    User,
    CheckCircle2,
    MessageCircle
} from "lucide-react";
import { format } from "date-fns";

export default function MerchantReviewsPage() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await api.get("/owner/reviews");
            setReviews(response.data);
        } catch (error) {
            console.error("Fetch reviews error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendResponse = async (reviewId: string) => {
        const text = responseTexts[reviewId];
        if (!text || text.trim().length === 0) return;

        setSubmittingId(reviewId);
        try {
            await api.post(`/owner/reviews/${reviewId}/response`, { response: text });
            setResponseTexts(prev => ({ ...prev, [reviewId]: "" }));
            fetchReviews();
        } catch (error) {
            console.error("Submit review response error:", error);
        } finally {
            setSubmittingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#415e34]" />
            </div>
        );
    }

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
        : "5.0";

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24 md:pb-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#1a202c]">Customer Reviews</h1>
                    <p className="text-muted-foreground mt-1">Listen to customer feedback and publish merchant responses.</p>
                </div>
                <div className="flex items-center gap-3 bg-[#f6f8fb] px-4 py-2 rounded-2xl border">
                    <div className="flex items-center text-amber-500">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-lg text-[#1a202c] ml-1.5">{avgRating}</span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">({totalReviews} Reviews)</span>
                </div>
            </div>

            {/* Review Cards Feed */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed">
                        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                        <p className="text-lg font-medium text-muted-foreground">No customer reviews yet.</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <Card key={review.id} className="rounded-2xl border-gray-200 shadow-sm overflow-hidden">
                            <CardContent className="p-6 space-y-4">
                                
                                {/* Top Meta */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-[#e6ffe6] text-[#415e34] font-bold flex items-center justify-center">
                                            {review.user?.firstName?.charAt(0) || "U"}
                                        </div>
                                        <div>
                                            <div className="font-bold text-base text-[#1a202c]">
                                                {review.user ? `${review.user.firstName} ${review.user.lastName}` : "Verified Buyer"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(review.createdAt), "MMM d, yyyy")}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-xs font-bold">
                                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                        <span>{review.rating}.0</span>
                                    </div>
                                </div>

                                {/* Review Text */}
                                {review.reviewText && (
                                    <p className="text-sm text-gray-700 leading-relaxed font-normal">
                                        "{review.reviewText}"
                                    </p>
                                )}

                                {/* Product Tag if present */}
                                {review.product?.name && (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                                        Product: {review.product.name}
                                    </Badge>
                                )}

                                {/* Existing Store Response */}
                                {review.storeResponse ? (
                                    <div className="bg-[#f4f8f3] border border-[#d4e4d0] p-4 rounded-xl space-y-1 mt-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-[#415e34]">
                                            <MessageCircle className="h-3.5 w-3.5" />
                                            Merchant Response
                                            {review.storeResponseAt && (
                                                <span className="text-muted-foreground font-normal text-[10px]">
                                                    • {format(new Date(review.storeResponseAt), "MMM d, yyyy")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-800 italic">
                                            "{review.storeResponse}"
                                        </p>
                                    </div>
                                ) : (
                                    /* Response Submission Input */
                                    <div className="flex gap-2 pt-2 border-t mt-4">
                                        <Input
                                            placeholder="Write a response to this review..."
                                            value={responseTexts[review.id] || ""}
                                            onChange={(e) => setResponseTexts({ ...responseTexts, [review.id]: e.target.value })}
                                            className="text-sm rounded-xl"
                                        />
                                        <Button
                                            onClick={() => handleSendResponse(review.id)}
                                            disabled={submittingId === review.id || !responseTexts[review.id]?.trim()}
                                            className="bg-[#415e34] hover:bg-[#324928] text-white rounded-xl gap-2"
                                        >
                                            {submittingId === review.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                            Reply
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

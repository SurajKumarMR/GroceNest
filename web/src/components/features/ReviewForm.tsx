
"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface ReviewFormProps {
    orderId?: string;
    storeId?: string;
    productId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function ReviewForm({ orderId, storeId, productId, onSuccess, onCancel }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Please select a rating");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await api.post("/reviews", {
                orderId,
                storeId,
                productId,
                rating,
                reviewText
            });
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to submit review");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl border">
            <div className="space-y-4 text-center">
                <h3 className="text-lg font-bold">Rate your experience</h3>
                <p className="text-sm text-muted-foreground">How was your order from GroceNest?</p>

                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="p-1 transition-transform active:scale-95"
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <Star
                                className={cn(
                                    "h-8 w-8 transition-colors",
                                    (hoveredRating || rating) >= star
                                        ? "fill-primary text-primary"
                                        : "text-muted-foreground/30"
                                )}
                            />
                        </button>
                    ))}
                </div>
                {error && <p className="text-xs text-destructive font-medium">{error}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Write a review (optional)</label>
                <Textarea
                    placeholder="What did you like or dislike about your order?"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="min-h-[100px] resize-none"
                />
            </div>

            <div className="flex gap-3">
                {onCancel && (
                    <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading || rating === 0}
                >
                    {isLoading ? "Submitting..." : "Submit Review"}
                </Button>
            </div>
        </form>
    );
}

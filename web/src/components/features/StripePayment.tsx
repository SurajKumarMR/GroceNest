
"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

interface PaymentFormProps {
    orderId: string;
    onSuccess: () => void;
    onCancel: () => void;
    amount: number;
}

function CheckoutForm({ onSuccess, onCancel, amount }: { onSuccess: () => void; onCancel: () => void; amount: number }) {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/orders`,
            },
            redirect: "if_required",
        });

        if (error) {
            setErrorMessage(error.message || "An unexpected error occurred.");
            setLoading(false);
        } else {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {errorMessage && (
                <div className="text-destructive text-sm bg-destructive/10 p-3 rounded">{errorMessage}</div>
            )}
            <div className="flex gap-2 pt-4">
                <Button
                    type="submit"
                    disabled={!stripe || loading}
                    className="flex-1"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Pay ${(amount).toFixed(2)}
                </Button>
                <Button variant="ghost" type="button" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}

export function StripePayment({ orderId, amount, onSuccess, onCancel }: PaymentFormProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initPayment = async () => {
            try {
                const { data } = await api.post("/payments/init", { orderId });
                setClientSecret(data.clientSecret);
            } catch (error) {
                console.error("Failed to initialize payment:", error);
            } finally {
                setLoading(false);
            }
        };
        initPayment();
    }, [orderId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Preparing secure checkout...</p>
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div className="text-center py-10 space-y-4">
                <p className="text-destructive font-semibold text-lg">Payment initialization failed</p>
                <Button variant="outline" onClick={onCancel}>Try again or choose another method</Button>
            </div>
        );
    }

    if (clientSecret.startsWith("pi_mock_")) {
        return (
            <div className="space-y-6 py-6 text-center">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                        <strong>Developer Mode:</strong> Stripe is not configured or in development. Using mock payment flow.
                    </p>
                </div>
                <Button
                    className="w-full h-12 text-lg"
                    onClick={() => {
                        setLoading(true);
                        setTimeout(() => {
                            setLoading(false);
                            onSuccess();
                        }, 1500);
                    }}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Simulate Successful Payment"}
                </Button>
                <Button variant="ghost" className="w-full" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        );
    }

    return (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} amount={amount} />
        </Elements>
    );
}

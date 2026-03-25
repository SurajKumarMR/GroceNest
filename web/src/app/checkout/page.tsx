"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, MapPin, Plus, Lock, HelpCircle, CreditCard, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StripePayment } from "@/components/features/StripePayment";
import Image from "next/image";
import Link from "next/link";

interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}

export default function CheckoutPage() {
    const { cart, refreshCart, itemCount } = useCart();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [lastCreatedOrderId, setLastCreatedOrderId] = useState<string | null>(null);

    const [instructions, setInstructions] = useState("");
    const [deliveryTime, setDeliveryTime] = useState("asap");
    const [tipPercent, setTipPercent] = useState(15);
    
    // New Address Form State
    const [newAddress, setNewAddress] = useState({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        isDefault: false
    });

    useEffect(() => {
        fetchAddresses();
        refreshCart();
    }, []);

    const fetchAddresses = async () => {
        try {
            const { data } = await api.get<Address[]>('/users/addresses');
            setAddresses(data);
            if (data.length > 0) {
                const defaultAddr = data.find(a => a.isDefault);
                setSelectedAddressId(defaultAddr ? defaultAddr.id : data[0].id);
            } else {
                setShowAddressForm(true);
            }
        } catch (error) {
            console.error("Failed to fetch addresses", error);
        }
    };

    const handleCreateAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post<Address>('/users/addresses', newAddress);
            setAddresses([...addresses, data]);
            setSelectedAddressId(data.id);
            setShowAddressForm(false);
            setNewAddress({ street: "", city: "", state: "", zipCode: "", country: "", isDefault: false });
        } catch (error) {
            console.error("Failed to create address", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) return;
        setLoading(true);
        try {
            const { data } = await api.post('/orders', {
                deliveryAddressId: selectedAddressId,
                paymentMethod: 'CARD',
                tipAmount: tipValue,
                deliveryInstructions: instructions
            });
            const order = Array.isArray(data.orders) ? data.orders[0] : (data.order || data);
            setLastCreatedOrderId(order.id);
            setShowPaymentModal(true);
        } catch (error) {
            console.error("Failed to place order", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateSubtotal = () => {
        if (!cart) return 0;
        return cart.items.reduce((total, item) => {
            const price = item.product.salePrice || item.product.regularPrice;
            return total + (price * item.quantity);
        }, 0);
    };

    const subtotal = calculateSubtotal();
    const deliveryFee = subtotal > 0 ? 3.99 : 0;
    const serviceFee = subtotal > 0 ? 1.50 : 0;
    const tax = subtotal * 0.08;
    const tipValue = (subtotal * tipPercent) / 100;
    const total = subtotal + deliveryFee + serviceFee + tax + tipValue;

    if (orderComplete) {
        // We will move this to a dedicated /confirmed page later, but for now redirect.
        router.push('/confirmed');
        return null;
    }

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);

    return (
        <div className="min-h-screen bg-[#f8f9f6] pb-20">
            {/* Custom Checkout Header */}
            <header className="sticky top-0 z-40 w-full border-b bg-white">
                <div className="container max-w-[1200px] mx-auto flex h-20 items-center justify-between px-4">
                    <Link href="/" className="flex items-center">
                        <Image src="/logo.png" alt="GroceNest Logo" width={140} height={45} className="h-10 w-auto" priority />
                    </Link>
                    
                    <div className="hidden md:flex items-center gap-3 text-sm font-bold text-muted-foreground">
                        <Link href="/cart" className="hover:text-foreground">Cart</Link>
                        <span className="text-border">—</span>
                        <span className="text-foreground">2 Details</span>
                        <span className="text-border">—</span>
                        <span>3 Payment</span>
                        <span className="text-border">—</span>
                        <span>4 Review</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#5c7736]">
                            <Lock className="h-4 w-4" /> Secure Checkout
                        </div>
                        <button className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" /> Help
                        </button>
                    </div>
                </div>
            </header>

            <main className="container max-w-[1200px] mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Forms */}
                    <div className="flex-1 space-y-6">
                        
                        {/* 1. Delivery Address */}
                        <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6 sm:p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-8 w-8 rounded-full bg-foreground text-white flex items-center justify-center font-bold text-sm">1</div>
                                <h2 className="text-2xl font-bold font-heading">Delivery Address</h2>
                            </div>

                            {showAddressForm ? (
                                <form onSubmit={handleCreateAddress} className="space-y-4 ml-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="street">Street Address</Label>
                                            <Input id="street" required value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} className="bg-muted/30" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input id="city" required value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="bg-muted/30" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State</Label>
                                            <Input id="state" required value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className="bg-muted/30" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="zipCode">Zip Code</Label>
                                            <Input id="zipCode" required value={newAddress.zipCode} onChange={e => setNewAddress({ ...newAddress, zipCode: e.target.value })} className="bg-muted/30" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input id="country" required value={newAddress.country} onChange={e => setNewAddress({ ...newAddress, country: e.target.value })} className="bg-muted/30" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                        <Button type="submit" disabled={loading} className="bg-[#5c7736] hover:bg-[#465c2a] text-white rounded-xl">
                                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Save Address
                                        </Button>
                                        {addresses.length > 0 && (
                                            <Button type="button" variant="ghost" onClick={() => setShowAddressForm(false)}>
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            ) : (
                                <div className="ml-12 border border-border/50 rounded-xl p-4 flex gap-4 bg-muted/20">
                                    <div className="h-20 w-32 bg-slate-200 rounded-lg hidden sm:block overflow-hidden relative">
                                         {/* Map placeholder */}
                                         <div className="absolute inset-0 bg-[#e7eedb] flex items-center justify-center">
                                            <MapPin className="h-6 w-6 text-[#5c7736]" />
                                         </div>
                                    </div>
                                    <div className="flex-1 flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-foreground">{selectedAddress?.street || 'No address selected'}</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {selectedAddress ? `${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zipCode}` : 'Please add an address.'}
                                            </p>
                                            <textarea 
                                                className="w-full mt-4 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#5c7736] bg-white resize-none"
                                                placeholder="Add delivery instructions (e.g. Leave at door)"
                                                rows={2}
                                                value={instructions}
                                                onChange={(e) => setInstructions(e.target.value)}
                                            />
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-xl font-bold" onClick={() => setShowAddressForm(true)}>
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Delivery Time */}
                        <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6 sm:p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm">2</div>
                                <h2 className="text-2xl font-bold font-heading">Delivery Time</h2>
                            </div>
                            <div className="ml-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div 
                                    className={`border rounded-xl p-4 cursor-pointer flex justify-between items-center transition-colors ${deliveryTime === 'asap' ? 'border-[#5c7736] bg-[#f4fce3]' : 'border-border/50 bg-white hover:border-[#5c7736]'}`}
                                    onClick={() => setDeliveryTime('asap')}
                                >
                                    <div>
                                        <p className={`font-bold ${deliveryTime === 'asap' ? 'text-[#5c7736]' : 'text-foreground'}`}>ASAP (30-45 min)</p>
                                    </div>
                                    {deliveryTime === 'asap' && <Check className="h-5 w-5 text-[#5c7736]" />}
                                </div>
                                <div 
                                    className={`border rounded-xl p-4 cursor-pointer flex justify-between items-center transition-colors ${deliveryTime === 'later' ? 'border-[#5c7736] bg-[#f4fce3]' : 'border-border/50 bg-white hover:border-[#5c7736]'}`}
                                    onClick={() => setDeliveryTime('later')}
                                >
                                    <div>
                                        <p className={`font-bold ${deliveryTime === 'later' ? 'text-[#5c7736]' : 'text-foreground'}`}>Schedule for later</p>
                                    </div>
                                    {deliveryTime === 'later' && <Check className="h-5 w-5 text-[#5c7736]" />}
                                </div>
                            </div>
                        </div>

                        {/* 3. Payment Method */}
                        <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6 sm:p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm">3</div>
                                <h2 className="text-2xl font-bold font-heading">Payment Method</h2>
                            </div>
                            <div className="ml-12 space-y-4">
                                <div className="border border-[#5c7736] bg-[#f4fce3] rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-16 bg-white rounded flex items-center justify-center border border-border shadow-sm">
                                            <span className="font-bold text-[#1a1f71] italic">VISA</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#5c7736]">Visa ending in 4242</p>
                                        </div>
                                    </div>
                                    <Check className="h-5 w-5 text-[#5c7736]" />
                                </div>
                                <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold border-dashed border-2">
                                    <Plus className="mr-2 h-4 w-4" /> Add New Card
                                </Button>
                            </div>
                        </div>

                        {/* 4. Tip Your Driver */}
                        <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6 sm:p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm">4</div>
                                <h2 className="text-2xl font-bold font-heading">Tip Your Driver</h2>
                            </div>
                            <div className="ml-12">
                                <p className="text-sm text-muted-foreground mb-4">100% of the tip goes to your driver.</p>
                                <div className="flex flex-wrap gap-3">
                                    {[15, 18, 20].map((pct) => (
                                        <button 
                                            key={pct}
                                            onClick={() => setTipPercent(pct)}
                                            className={`px-6 py-3 rounded-xl border font-bold text-sm transition-colors ${tipPercent === pct ? 'border-[#5c7736] bg-[#5c7736] text-white' : 'border-border/50 bg-white text-muted-foreground hover:border-[#5c7736] hover:text-[#5c7736]'}`}
                                        >
                                            {pct}% (${((subtotal * pct) / 100).toFixed(2)})
                                        </button>
                                    ))}
                                    <button 
                                        onClick={() => setTipPercent(0)}
                                        className={`px-6 py-3 rounded-xl border font-bold text-sm transition-colors ${tipPercent === 0 ? 'border-[#5c7736] bg-[#5c7736] text-white' : 'border-border/50 bg-white text-muted-foreground hover:border-[#5c7736]'}`}
                                    >
                                        Other
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 rounded-2xl bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-lg shadow-sm"
                            onClick={handlePlaceOrder}
                            disabled={loading || !selectedAddressId || !cart || cart.items.length === 0}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            Place Order
                        </Button>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:w-[400px] flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6 sm:p-8 sticky top-24">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Order Summary</h3>
                                <Link href="/cart" className="text-[#5c7736] font-bold text-sm hover:underline">Edit</Link>
                            </div>
                            
                            <div className="space-y-4 mb-6 border-b border-border pb-6 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
                                {cart?.items.map(item => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="h-16 w-16 bg-[#f4ece3] rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden p-1">
                                            {item.product.images?.[0] ? (
                                                <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-contain" />
                                            ) : (
                                                <span className="text-2xl">🥦</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm line-clamp-1">{item.product.name}</h4>
                                            <p className="text-xs text-muted-foreground">{item.quantity}x ${item.product.salePrice || item.product.regularPrice}</p>
                                        </div>
                                        <div className="font-bold text-sm">
                                            ${((item.product.salePrice || item.product.regularPrice) * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 text-sm mb-6 border-b border-border pb-6">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Subtotal</span>
                                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Service Fee</span>
                                    <span className="font-bold">${serviceFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Delivery Fee</span>
                                    <span className="font-bold">${deliveryFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Taxes</span>
                                    <span className="font-bold">${tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Tip ({tipPercent}%)</span>
                                    <span className="font-bold">${tipValue.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-bold text-2xl text-[#5c7736]">${total.toFixed(2)}</span>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                                By placing your order, you agree to our <a href="#" className="underline">Terms of Use</a> and <a href="#" className="underline">Privacy Policy</a>.
                            </p>
                        </div>
                    </div>

                    {/* Stripe Modal Overlay */}
                    {showPaymentModal && lastCreatedOrderId && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <Card className="w-full max-w-md">
                                <CardHeader>
                                    <CardTitle>Complete Payment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <StripePayment
                                        orderId={lastCreatedOrderId}
                                        amount={total}
                                        onSuccess={() => {
                                            setOrderComplete(true);
                                            setShowPaymentModal(false);
                                            refreshCart();
                                        }}
                                        onCancel={() => setShowPaymentModal(false)}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

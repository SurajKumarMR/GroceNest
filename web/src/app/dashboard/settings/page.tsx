"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronRight, MapPin } from "lucide-react";

export default function SettingsLocationPage() {
    const [hours, setHours] = useState([
        { day: 'Monday', isOpen: true, openTime: '08:00 AM', closeTime: '09:00 PM' },
        { day: 'Tuesday', isOpen: false, openTime: '08:00 AM', closeTime: '09:00 PM' },
        { day: 'Wednesday', isOpen: true, openTime: '08:00 AM', closeTime: '09:00 PM' },
        { day: 'Thursday', isOpen: true, openTime: '08:00 AM', closeTime: '09:00 PM' },
        { day: 'Friday', isOpen: true, openTime: '08:00 AM', closeTime: '09:00 PM' },
        { day: 'Saturday', isOpen: true, openTime: '09:00 AM', closeTime: '08:00 PM' },
        { day: 'Sunday', isOpen: true, openTime: '09:00 AM', closeTime: '06:00 PM' },
    ]);

    const [distancePricing, setDistancePricing] = useState(true);

    const toggleDay = (index: number) => {
        const newHours = [...hours];
        newHours[index].isOpen = !newHours[index].isOpen;
        setHours(newHours);
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-24 md:pb-8 flex flex-col relative">
            
            {/* Top Toolbar (Mobile) */}
            <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <h1 className="text-lg font-bold text-[#1a202c]">Location & Hours</h1>
                <Button className="bg-black hover:bg-gray-800 text-white font-bold h-9 px-4 rounded-full text-xs">
                    Update
                </Button>
            </div>

            {/* Main Content Area */}
            <div className="max-w-2xl mx-auto w-full p-4 md:p-8 space-y-8 flex-1">
                
                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between">
                    <div>
                        <div className="flex items-center text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-1">
                            <span className="text-gray-400">SETTINGS</span>
                            <ChevronRight className="w-3 h-3 mx-1" />
                            <span className="text-[#8cc63f]">LOCATION & HOURS</span>
                        </div>
                        <h1 className="text-2xl font-bold text-[#1a202c]">Location & Hours</h1>
                    </div>
                    <Button className="bg-[#1a202c] hover:bg-gray-800 text-white font-bold h-10 px-6 rounded-full shadow-md">
                        Update
                    </Button>
                </div>

                {/* Operating Hours Section */}
                <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm shadow-gray-100">
                    <h2 className="text-lg font-bold text-[#1a202c] mb-6">Operating Hours</h2>
                    
                    <div className="space-y-4">
                        {hours.map((schedule, idx) => (
                            <div key={schedule.day} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-4 w-32">
                                    <Switch 
                                        checked={schedule.isOpen}
                                        onCheckedChange={() => toggleDay(idx)}
                                        className="data-[state=checked]:bg-[#8cc63f]"
                                    />
                                    <span className={`font-semibold text-sm ${schedule.isOpen ? 'text-[#1a202c]' : 'text-gray-400'}`}>
                                        {schedule.day}
                                    </span>
                                </div>
                                
                                <div className="flex-1 flex justify-end">
                                    {schedule.isOpen ? (
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-xs font-semibold text-gray-700">
                                                {schedule.openTime}
                                            </div>
                                            <span className="text-gray-400 font-medium">-</span>
                                            <div className="bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-xs font-semibold text-gray-700">
                                                {schedule.closeTime}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-sm font-bold text-gray-400">Closed</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Delivery Radius Section */}
                <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm shadow-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-[#1a202c]">Delivery Radius</h2>
                        <button className="text-[#8cc63f] text-sm font-bold flex items-center gap-1 hover:text-[#7bb033] tracking-wider uppercase">
                            <MapPin className="w-3 h-3" />
                            Edit on Map
                        </button>
                    </div>

                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 mb-4 bg-blue-50">
                        {/* Map Placeholder */}
                        <img 
                            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600" 
                            alt="Map Placeholder" 
                            className="w-full h-full object-cover opacity-60"
                        />
                        {/* Fake radius circle */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-[#8cc63f] bg-[#8cc63f]/20"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-[-10px]">
                            <MapPin className="w-6 h-6 text-[#1a202c] fill-[#8cc63f]" />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Current Radius:</span>
                        <span className="text-base font-bold text-[#1a202c]">5 miles</span>
                    </div>
                </section>

                {/* Delivery Fees Section */}
                <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm shadow-gray-100 pb-8">
                    <h2 className="text-lg font-bold text-[#1a202c] mb-6">Delivery Fees</h2>
                    
                    <div className="space-y-6">
                        <div>
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">BASE DELIVERY FEE</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">$</span>
                                <Input defaultValue="4.99" className="border-gray-200 h-11 bg-gray-50 pl-8 font-semibold text-[#1a202c]" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <Label className="text-sm font-bold text-[#1a202c] block mb-0.5">Distance-based pricing</Label>
                                <span className="text-xs text-muted-foreground font-medium">Add fee per extra mile</span>
                            </div>
                            <Switch 
                                checked={distancePricing}
                                onCheckedChange={setDistancePricing}
                                className="data-[state=checked]:bg-[#8cc63f]"
                            />
                        </div>

                        <div>
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">MINIMUM ORDER AMOUNT</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">$</span>
                                <Input defaultValue="15.00" className="border-gray-200 h-11 bg-gray-50 pl-8 font-semibold text-[#1a202c]" />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

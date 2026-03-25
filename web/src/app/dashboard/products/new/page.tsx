"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    ChevronRight,
    UploadCloud,
    X,
    Bold,
    Italic,
    List,
    Link as LinkIcon,
    PlusCircle
} from "lucide-react";

export default function AddProductPage() {
    const [dietaryTags, setDietaryTags] = useState<string[]>(['Halal', 'Organic']);

    const allTags = ['Halal', 'Vegan', 'Organic', 'Gluten Free', 'Non-GMO'];

    const toggleTag = (tag: string) => {
        if (dietaryTags.includes(tag)) {
            setDietaryTags(dietaryTags.filter(t => t !== tag));
        } else {
            setDietaryTags([...dietaryTags, tag]);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-24 md:pb-8 flex flex-col relative">
            
            {/* Top Toolbar (Mobile) */}
            <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2 text-[#8cc63f] font-bold text-lg tracking-tight">
                    <div className="bg-[#8cc63f] text-white p-1 rounded-md">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    GroceNest <span className="text-sm font-normal text-[#8cc63f] ml-1 opacity-80">Business</span>
                </div>
                <Button className="bg-[#f08a4b] hover:bg-[#d97736] text-white font-bold h-9 px-4 rounded-full text-xs">
                    Save Product
                </Button>
            </div>

            {/* Main Content Area */}
            <div className="max-w-2xl mx-auto w-full p-4 md:p-8 space-y-8 flex-1">
                
                {/* Breadcrumbs */}
                <div className="flex items-center text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    <span className="text-[#8cc63f]">DASHBOARD</span>
                    <ChevronRight className="w-3 h-3 mx-1" />
                    <span className="text-[#8cc63f]">INVENTORY</span>
                    <ChevronRight className="w-3 h-3 mx-1" />
                    <span className="text-gray-400">ADD PRODUCT</span>
                </div>

                {/* Section 1: Basic Information */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 rounded-full bg-[#e6f4d5] text-[#8cc63f] flex items-center justify-center font-bold text-sm">1</div>
                        <h2 className="text-lg font-bold text-[#1a202c]">Basic Information</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">PRODUCT NAME</Label>
                            <Input placeholder="e.g. Organic Basmati Rice" className="border-gray-200 h-11 bg-white" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">CATEGORY</Label>
                                <select className="w-full border border-gray-200 rounded-md h-11 px-3 bg-white text-sm outline-none focus:ring-2 focus:ring-[#8cc63f] focus:border-transparent">
                                    <option>Grains & Rice</option>
                                    <option>Produce</option>
                                    <option>Spices</option>
                                </select>
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">BRAND</Label>
                                <Input placeholder="e.g. Nature's Best" className="border-gray-200 h-11 bg-white" />
                            </div>
                        </div>

                        <div>
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">DESCRIPTION</Label>
                            <div className="border border-gray-200 rounded-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#8cc63f] focus-within:border-transparent">
                                {/* Rich Text Toolbar */}
                                <div className="border-b border-gray-100 flex items-center px-2 py-1 gap-1">
                                    <button className="p-2 text-gray-700 hover:bg-gray-100 rounded">
                                        <Bold className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-gray-700 hover:bg-gray-100 rounded">
                                        <Italic className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-gray-700 hover:bg-gray-100 rounded">
                                        <List className="w-4 h-4" />
                                    </button>
                                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                    <button className="p-2 text-gray-700 hover:bg-gray-100 rounded">
                                        <LinkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <Textarea 
                                    placeholder="Describe your product's key features..." 
                                    className="border-0 focus-visible:ring-0 resize-none min-h-[120px] bg-transparent" 
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Product Media */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 rounded-full bg-[#e6f4d5] text-[#8cc63f] flex items-center justify-center font-bold text-sm">2</div>
                        <h2 className="text-lg font-bold text-[#1a202c]">Product Media</h2>
                    </div>

                    <div className="bg-white border-2 border-dashed border-[#aed581] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors mb-4">
                        <div className="bg-[#8cc63f] text-white p-2 rounded-full mb-3 shadow-md shadow-green-100">
                            <UploadCloud className="w-6 h-6" />
                        </div>
                        <div className="font-bold text-[#1a202c] mb-1">Upload Images</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">DRAG AND DROP OR TAP HERE</div>
                    </div>

                    {/* Image Thumbnails */}
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {[
                            'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=150',
                            'https://images.unsplash.com/photo-1596541223130-5d564415ff68?auto=format&fit=crop&q=80&w=150',
                            'https://images.unsplash.com/photo-1508061253366-f7da158b6d94?auto=format&fit=crop&q=80&w=150'
                        ].map((src, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                <img src={src} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                                <button className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full w-5 h-5 flex items-center justify-center">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[#aed581] bg-[#f8fcf3] flex items-center justify-center text-[#8cc63f] cursor-pointer hover:bg-[#f0f8e6]">
                            <PlusCircle className="w-6 h-6" />
                        </div>
                    </div>
                </section>

                {/* Section 3: Pricing & Inventory */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 rounded-full bg-[#e6f4d5] text-[#8cc63f] flex items-center justify-center font-bold text-sm">3</div>
                        <h2 className="text-lg font-bold text-[#1a202c]">Pricing & Inventory</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">REGULAR PRICE ($)</Label>
                            <Input placeholder="0.00" className="border-gray-200 h-11 bg-white" />
                        </div>
                        <div>
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">UNIT</Label>
                            <select className="w-full border border-gray-200 rounded-md h-11 px-3 bg-white text-sm outline-none focus:ring-2 focus:ring-[#8cc63f] focus:border-transparent">
                                <option>Kilogram (kg)</option>
                                <option>Gram (g)</option>
                                <option>Piece</option>
                            </select>
                        </div>
                        <div>
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">SKU</Label>
                            <Input placeholder="BAS-RIC-01" className="border-gray-200 h-11 bg-white" />
                        </div>
                        <div>
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">STOCK QUANTITY</Label>
                            <Input placeholder="100" className="border-gray-200 h-11 bg-white" />
                        </div>
                    </div>
                </section>

                {/* Section 4: Dietary Tags & Details */}
                <section className="pb-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 rounded-full bg-[#e6f4d5] text-[#8cc63f] flex items-center justify-center font-bold text-sm">4</div>
                        <h2 className="text-lg font-bold text-[#1a202c]">Dietary Tags & Details</h2>
                    </div>

                    <div className="mb-6">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">SELECT DIETARY TAGS</Label>
                        <div className="flex flex-wrap gap-2">
                            {allTags.map(tag => {
                                const active = dietaryTags.includes(tag);
                                return (
                                    <button 
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                            active 
                                                ? 'bg-[#8cc63f] border-[#8cc63f] text-white shadow-sm shadow-green-200' 
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-[#8cc63f]'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-bold text-sm text-[#1a202c] uppercase tracking-wider">NUTRITIONAL INFO</h3>
                            <button className="text-[#8cc63f] text-xs font-bold flex items-center gap-1 hover:text-[#7bb033]">
                                <PlusCircle className="w-3 h-3" />
                                Add Row
                            </button>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-gray-50">
                                    <th className="px-4 py-3 font-semibold w-1/2">ATTRIBUTE</th>
                                    <th className="px-4 py-3 font-semibold w-1/2">VALUE (PER 100G)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr>
                                    <td className="px-4 py-3 text-gray-600">Calories</td>
                                    <td className="px-4 py-3 text-gray-600">360 kcal</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-gray-600">Total Fat</td>
                                    <td className="px-4 py-3 text-gray-600">0.5g</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-gray-600">Protein</td>
                                    <td className="px-4 py-3 text-gray-600">7.5g</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="fixed bottom-0 md:bottom-auto left-0 right-0 md:sticky bg-white border-t border-gray-200 p-4 z-20 md:border-none md:bg-transparent md:px-8">
                <div className="max-w-2xl mx-auto flex gap-3">
                    <Button variant="outline" className="flex-1 bg-white border-gray-200 text-gray-700 font-bold h-12 rounded-xl hover:bg-gray-50">
                        Cancel
                    </Button>
                    <Button className="flex-[2] bg-[#8cc63f] hover:bg-[#7bb033] text-white font-bold h-12 rounded-xl shadow-lg shadow-green-200">
                        Complete & Publish
                    </Button>
                </div>
            </div>

        </div>
    );
}

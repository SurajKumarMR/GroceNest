"use client";

import { Header } from "@/components/layout/Header";
import { MessageSquare, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[#f8f9f6]">
            <Header />
            <main className="container max-w-[1400px] mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold font-heading">Contact Us</h1>
                        <p className="text-muted-foreground text-lg">We're here to help with your orders, account, or any other questions.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Contact Form */}
                        <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
                            <h2 className="text-2xl font-bold">Send us a message</h2>
                            <form className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Name</label>
                                        <input className="w-full h-10 rounded-lg px-3 bg-muted border focus:outline-primary" placeholder="Your name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <input className="w-full h-10 rounded-lg px-3 bg-muted border focus:outline-primary" placeholder="Email address" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Subject</label>
                                    <select className="w-full h-10 rounded-lg px-3 bg-muted border focus:outline-primary">
                                        <option>Order Issue</option>
                                        <option>Account Support</option>
                                        <option>Partnership Inquiry</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Message</label>
                                    <textarea className="w-full h-32 rounded-lg p-3 bg-muted border focus:outline-primary resize-none" placeholder="How can we help?"></textarea>
                                </div>
                                <button className="w-full h-12 bg-[#415e34] text-white font-bold rounded-xl hover:bg-[#344d2a] transition-colors">
                                    Send Message
                                </button>
                            </form>
                        </div>

                        {/* Contact Info & Chat */}
                        <div className="space-y-8">
                            <div className="bg-[#415e34] text-white p-8 rounded-3xl space-y-6 relative overflow-hidden">
                                <div className="relative z-10 space-y-4">
                                    <h2 className="text-2xl font-bold">Live Support</h2>
                                    <p className="opacity-80">Our support team is available Mon-Sun, 8am-10pm to assist you in real-time.</p>
                                    <button 
                                        onClick={() => (window as any).toggleChat?.()} 
                                        className="h-12 px-8 bg-[#f97316] text-white font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2"
                                    >
                                        <MessageSquare size={20} />
                                        Start Live Chat
                                    </button>
                                </div>
                                <MessageSquare className="absolute -right-8 -bottom-8 h-48 w-48 opacity-10" />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Us</p>
                                        <p className="font-medium">support@grocenest.com</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Call Us</p>
                                        <p className="font-medium">+44 20 1234 5678</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

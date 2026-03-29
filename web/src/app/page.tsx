"use client";

import Link from "next/link";
import { ArrowRight, Store, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { SplashScreen } from "@/components/ui/splash-screen";

export default function Home() {
  return (
    <>
      <SplashScreen />
      <div className="flex flex-col min-h-screen bg-[#f8f9f6]">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-[#526a31] text-white py-16 lg:py-24">
            {/* Background Blob Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#5c7736] rounded-full translate-x-1/3 -translate-y-1/4 opacity-50 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#465c2a] rounded-full -translate-x-1/3 translate-y-1/3 opacity-50 blur-3xl pointer-events-none" />

            <div className="container relative z-10 max-w-[1400px] mx-auto px-4 md:px-8">
              <div className="max-w-2xl space-y-8">
                <div className="inline-flex items-center rounded-sm bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                  <span className="opacity-80 font-bold mr-1">BOLT</span> FREE DELIVERY ON YOUR FIRST ORDER
                </div>
                
                <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
                  Authentic groceries <br/>
                  from <span className="italic font-serif font-medium opacity-90">every culture</span>
                </h1>
                
                <p className="max-w-[38rem] leading-relaxed text-white/90 text-lg sm:text-xl">
                  Fresh, authentic ingredients from Indian, Chinese, Mexican, Middle Eastern and dozens more cuisines — delivered in under 45 minutes.
                </p>
                
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/stores"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-[#f97316] px-8 text-sm font-bold text-white shadow-sm transition-transform hover:scale-105 focus-visible:outline-none"
                  >
                    <Store className="mr-2 h-4 w-4" />
                    Shop Now
                  </Link>
                  <Link
                    href="/stores"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/40 bg-transparent px-8 text-sm font-bold text-white shadow-sm transition-colors hover:bg-white/10 focus-visible:outline-none"
                  >
                    Browse Stores
                  </Link>
                </div>

                <div className="flex items-center gap-6 pt-4 text-sm font-medium text-white/80">
                  <span><strong className="text-white">500+</strong> Stores</span>
                  <span><strong className="text-white">20+</strong> Cuisines</span>
                  <span><strong className="text-white">45 min</strong> Avg. delivery</span>
                </div>
              </div>
            </div>
          </section>

          {/* Shop by Cuisine Bar */}
          <section className="border-b bg-white scrollbar-hide overflow-x-auto">
            <div className="container max-w-[1400px] mx-auto px-4 py-4 flex items-center gap-4 min-w-max">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">SHOP BY CUISINE</span>
              <button className="h-9 px-5 rounded-full bg-[#415e34] text-white text-sm font-semibold">All</button>
              {['🇮🇳 Indian', '🇨🇳 Chinese', '🇲🇽 Mexican', '🌙 Middle Eastern', '🇯🇵 Japanese', '🇰🇷 Korean', '🇳🇬 West African', '🇵🇱 Polish', '🇯🇲 Caribbean'].map(cuisine => (
                <button key={cuisine} className="h-9 px-5 rounded-full bg-white border outline-none text-sm font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap">
                  {cuisine}
                </button>
              ))}
            </div>
          </section>

          <div className="container max-w-[1400px] mx-auto px-4 py-12 space-y-16">
            {/* Shop by Category */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-bold">Shop by Category</h2>
                <Link href="/categories" className="text-sm font-medium text-muted-foreground hover:text-primary">
                  See all categories &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { name: 'Fresh Produce', icon: '🥦' },
                  { name: 'Dairy & Eggs', icon: '🧀' },
                  { name: 'Grains & Rice', icon: '🌾' },
                  { name: 'Spices & Herbs', icon: '🫙' },
                  { name: 'Frozen Foods', icon: '🧊' },
                  { name: 'Bakery', icon: '🍞' },
                ].map(cat => (
                  <div key={cat.name} className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <span className="text-4xl mb-3">{cat.icon}</span>
                    <span className="text-sm font-bold text-center">{cat.name}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Promo Banners */}
            <section className="grid md:grid-cols-2 gap-6">
              <div className="relative overflow-hidden rounded-2xl bg-[#718b4e] p-8 text-white min-h-[220px] flex flex-col justify-center">
                <div className="absolute right-0 bottom-0 opacity-80 translate-x-4 translate-y-4 text-9xl">🛒</div>
                <div className="relative z-10 space-y-1">
                  <span className="text-xs font-bold tracking-wider uppercase text-white/80">NEW USERS</span>
                  <h3 className="text-3xl font-bold pb-4">Free Delivery<br/>First Order</h3>
                  <button className="h-10 px-6 rounded-full bg-[#f97316] hover:bg-[#ea580c] font-bold text-sm transition-colors">Order Now</button>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-[#ff8a4c] p-8 text-white min-h-[220px] flex flex-col justify-center">
                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-8xl drop-shadow-lg">🥑</div>
                <div className="relative z-10 space-y-1">
                  <span className="text-xs font-bold tracking-wider uppercase text-white/80">WEEKEND DEAL</span>
                  <h3 className="text-3xl font-bold pb-4">20% Off All<br/>Fresh Produce</h3>
                  <button className="h-10 px-6 rounded-full bg-white text-[#ea580c] hover:bg-gray-50 font-bold text-sm transition-colors">Shop Now</button>
                </div>
              </div>
            </section>

            {/* Stores Near You */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-bold">Stores Near You</h2>
                <Link href="/stores" className="text-sm font-medium text-muted-foreground hover:text-primary">
                  See all stores &rarr;
                </Link>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Taj Mahal Grocers', desc: 'Authentic Spices & Indian Staples', time: '20-30 min', fee: '£0.99', tags: ['Indian', 'Halal'], rating: '4.8', bgColor: 'bg-green-50' },
                  { name: 'Oriental Market', desc: 'Wide range of East Asian groceries', time: '15-25 min', fee: '£1.49', tags: ['Chinese', 'Japanese'], rating: '4.6', bgColor: 'bg-red-50' },
                  { name: 'Patel\'s Indian Grocery', desc: 'Flours, lentils, fresh herbs & spices', time: '25-35 min', fee: 'Free over £25', tags: ['Indian', 'Organic'], rating: '4.9', bgColor: 'bg-orange-50' },
                ].map(store => (
                  <Link href={`/stores/1`} key={store.name} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all">
                    <div className={`h-40 ${store.bgColor} relative overflow-hidden`}>
                        {/* Placeholder for store image */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center mix-blend-multiply" />
                    </div>
                    <div className="p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{store.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{store.desc}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{store.time}</p>
                          <p className="text-xs text-muted-foreground">Delivery: {store.fee}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t">
                        <div className="flex gap-2">
                          {store.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-muted rounded text-xs font-semibold text-muted-foreground">{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center font-bold text-sm">
                           <Star className="h-4 w-4 fill-primary text-primary mr-1" /> {store.rating}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
            {/* Waitlist Section */}
            <section id="waitlist" className="bg-[#415e34] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden my-16">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Store className="h-48 w-48" />
              </div>
              <div className="relative z-10 max-w-xl space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold font-heading">Join the waitlist</h2>
                <p className="text-white/80 text-lg">
                  Be the first to know when we launch in your neighborhood. Get exclusive early access and free delivery for a month.
                </p>
                <form className="flex flex-col sm:flex-row gap-4 pt-2" onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                  try {
                    const res = await fetch('http://localhost:5000/api/marketing/waitlist', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    });
                    const data = await res.json();
                    if (res.ok) alert('Welcome to the waitlist!');
                    else alert(data.error || 'Something went wrong');
                  } catch (err) {
                    alert('Could not join waitlist. Please try again later.');
                  }
                }}>
                  <input 
                    name="email"
                    type="email" 
                    placeholder="Enter your email" 
                    required
                    className="flex-1 h-12 rounded-full px-6 bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  />
                  <button className="h-12 px-8 rounded-full bg-[#f97316] hover:bg-[#ea580c] font-bold transition-all shadow-lg hover:shadow-xl">
                    Stay Updated
                  </button>
                </form>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fading out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2000);

    // Remove from DOM after transition (2.5 seconds total)
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-zinc-950 transition-opacity duration-500",
        isFading ? "opacity-0" : "opacity-100"
      )}
    >
      <div className="animate-pulse">
        <Image
          src="/logo.png"
          alt="GroceNest Logo"
          width={400}
          height={400}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}

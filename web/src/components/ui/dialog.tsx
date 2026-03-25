
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const DialogContext = React.createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
} | null>(null);

interface DialogProps {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function Dialog({ children, open, onOpenChange }: DialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const isControlled = open !== undefined;
    const show = isControlled ? open : isOpen;
    const setShow = isControlled && onOpenChange ? onOpenChange : setIsOpen;

    return (
        <DialogContext.Provider value={{ open: show, setOpen: setShow }}>
            {children}
        </DialogContext.Provider>
    );
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error("DialogTrigger must be used within Dialog");

    return (
        <div onClick={() => context.setOpen(true)} className="cursor-pointer">
            {children}
        </div>
    );
}

export function DialogContent({ children, className }: { children: React.ReactNode, className?: string }) {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error("DialogContent must be used within Dialog");

    if (!context.open) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => context.setOpen(false)}
            />
            <div
                className={cn(
                    "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in zoom-in-95 sm:rounded-lg md:w-full",
                    className
                )}
            >
                <div className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                    <X className="h-4 w-4 cursor-pointer" onClick={() => context.setOpen(false)} />
                    <span className="sr-only">Close</span>
                </div>
                {children}
            </div>
        </>
    );
}

export function DialogHeader({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
            {children}
        </div>
    );
}

export function DialogTitle({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
            {children}
        </h2>
    );
}

export function DialogDescription({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <p className={cn("text-sm text-muted-foreground", className)}>
            {children}
        </p>
    );
}
export function DialogFooter({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
                className
            )}
            {...props}
        />
    )
}
DialogFooter.displayName = "DialogFooter"

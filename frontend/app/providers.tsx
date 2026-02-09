"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"

import { GoogleOAuthProvider } from "@react-oauth/google"
import { ThemeSync } from "@/components/ThemeSync"

const queryClient = new QueryClient()

export function Providers({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <QueryClientProvider client={queryClient}>
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID"}>
                <NextThemesProvider {...props}>
                    <ThemeSync />
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            classNames: {
                                toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                                description: 'group-[.toast]:text-muted-foreground',
                                actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                                cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                            },
                        }}
                        visibleToasts={3}
                        closeButton
                        // On mobile, show only 2 toasts
                        expand={false}
                        richColors
                    />
                </NextThemesProvider>
            </GoogleOAuthProvider>
        </QueryClientProvider>
    )
}

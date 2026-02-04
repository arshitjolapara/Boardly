"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { GoogleOAuthProvider } from "@react-oauth/google"

const queryClient = new QueryClient()

export function Providers({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <QueryClientProvider client={queryClient}>
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID"}>
                <NextThemesProvider {...props}>
                    {children}
                </NextThemesProvider>
            </GoogleOAuthProvider>
        </QueryClientProvider>
    )
}

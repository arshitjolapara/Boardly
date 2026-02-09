"use client"

import { useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { api } from "@/lib/api"
import { UserPreferences } from "@/components/board/board.types"

export function ThemeSync() {
    const { setTheme } = useTheme()
    const lastSyncedTheme = useRef<string | null>(null)

    const { data: prefs } = useQuery<UserPreferences>({
        queryKey: ['user', 'preferences'],
        queryFn: async () => {
            const res = await api.get('/users/me/preferences')
            return res.data
        },
        // Only fetch if token exists
        enabled: typeof window !== 'undefined' && !!localStorage.getItem('token'),
        staleTime: Infinity,
    })

    useEffect(() => {
        if (prefs?.theme_preference && prefs.theme_preference !== lastSyncedTheme.current) {
            setTheme(prefs.theme_preference)
            lastSyncedTheme.current = prefs.theme_preference
        }
    }, [prefs?.theme_preference, setTheme])

    return null
}

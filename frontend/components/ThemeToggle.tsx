"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { ThemePreference } from "@/components/board/board.types"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
    const { setTheme } = useTheme()
    const queryClient = useQueryClient()

    const updatePrefs = useMutation({
        mutationFn: async (theme: ThemePreference) => {
            const res = await api.put('/users/me/preferences', { theme_preference: theme })
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] })
        }
    })

    const handleThemeChange = (theme: string) => {
        setTheme(theme)
        if (typeof window !== 'undefined' && localStorage.getItem('token')) {
            updatePrefs.mutate(theme as ThemePreference)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 border-0 bg-transparent hover:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

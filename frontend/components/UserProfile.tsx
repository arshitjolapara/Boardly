"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { toast } from "sonner"


export function UserProfile() {
    const router = useRouter()

    const { data: user, isLoading } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: async () => {
            const res = await api.get('/users/me')
            return res.data
        }
    })

    const handleLogout = () => {
        localStorage.removeItem("token")
        router.push("/auth/login")
    }

    if (isLoading) {
        return <Skeleton className="h-9 w-9 rounded-full" />
    }

    if (!user) return null

    const initials = user.full_name
        ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : user.email[0].toUpperCase()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="cursor-pointer">
                    <Avatar className="h-9 w-9 border transition-all hover:scale-105 active:scale-95">
                        {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.display_name || user.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
                    Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile?tab=preferences")}>
                    Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

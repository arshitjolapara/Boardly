"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Layout, Settings, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/ThemeToggle"
import { UserProfile } from "@/components/UserProfile"

interface NavItem {
    title: string
    href: string
    icon: React.ElementType
}

const navItems: NavItem[] = [
    { title: "Dashboard", href: "/boards", icon: Layout },
]

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
    const [open, setOpen] = React.useState(false)
    const pathname = usePathname()

    if (!isLoggedIn) return null

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] flex flex-col p-6">
                <SheetHeader className="text-left mb-8">
                    <SheetTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <Layout className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">Boardly</span>
                    </SheetTitle>
                </SheetHeader>

                <nav className="flex-1 flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                            {item.title}
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto border-t pt-6 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-sm font-medium text-muted-foreground">Appearance</span>
                        <ThemeToggle />
                    </div>
                    {/* User profile is also accessible via the AppNavbar, but we can put a dedicated section here if needed */}
                </div>
            </SheetContent>
        </Sheet>
    )
}

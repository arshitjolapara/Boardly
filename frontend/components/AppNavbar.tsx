"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Layout, Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { UserProfile } from "@/components/UserProfile"
import { MobileNav } from "@/components/MobileNav"
import { Input } from "@/components/ui/input"

export function AppNavbar() {
    const pathname = usePathname()
    const isAuthPage = pathname.startsWith('/auth')

    if (isAuthPage) return null

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md transition-all">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-2 md:gap-8">
                    {/* Mobile Menu Trigger (Far Left on mobile) */}
                    <div className="md:hidden">
                        <MobileNav isLoggedIn={true} />
                    </div>

                    {/* Logo */}
                    <Link href="/boards" className="flex items-center gap-2 group transition-transform active:scale-95">
                        <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg md:rounded-xl bg-primary shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
                            <Layout className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                        </div>
                        <span className="hidden font-bold text-lg md:text-xl tracking-tight sm:inline-block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            Boardly
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <nav className="hidden md:flex items-center gap-1 font-medium text-sm">
                        <Link
                            href="/boards"
                            className={`px-4 py-2 rounded-full transition-colors ${pathname === '/boards' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                        >
                            Boards
                        </Link>
                    </nav>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 sm:gap-4">
                    {/* Search - Desktop only or expandable on mobile */}
                    <div className="hidden lg:flex relative items-center group">
                        <Search className="absolute left-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Quick search..."
                            className="h-9 w-[180px] lg:w-[260px] pl-9 rounded-full bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-full text-muted-foreground hover:text-foreground relative">
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary border-2 border-background" />
                        </Button>

                        <div className="hidden xs:block h-4 w-px bg-border mx-1" />

                        <ThemeToggle />
                        <UserProfile />
                    </div>
                </div>
            </div>
        </header>
    )
}

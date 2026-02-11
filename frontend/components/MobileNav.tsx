"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, Layout, Plus, CheckCircle, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

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

    if (!isLoggedIn) return null

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="border-b pb-4 mb-4 text-left">
                    <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                        Boardly
                    </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-lg font-medium rounded-lg hover:bg-muted transition-colors"
                        >
                            <item.icon className="h-5 w-5 text-primary" />
                            {item.title}
                        </Link>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    )
}

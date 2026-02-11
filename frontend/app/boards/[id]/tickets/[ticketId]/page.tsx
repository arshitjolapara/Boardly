"use client"

import { useParams, useRouter } from "next/navigation"
import { TicketDetailView } from "@/components/board/TicketDetailView"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, Share2 } from "lucide-react"
import Link from "next/link"

export default function TicketPage() {
    const params = useParams()
    const router = useRouter()
    const boardId = params.id as string
    const ticketId = params.ticketId as string

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        // Toast is handled by components if needed, or simple alert
    }

    return (
        <div className="min-h-screen bg-background flex flex-col overflow-hidden">
            {/* Professional Header */}
            <header className="border-b h-14 flex items-center justify-between px-6 shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/boards/${boardId}`)}
                        className="gap-2 text-muted-foreground hover:text-foreground transition-colors rounded-full"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Board
                    </Button>
                    <div className="h-4 w-px bg-border mx-2" />
                    <nav className="flex items-center gap-2 text-xs font-medium">
                        <Link href="/boards" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            Boards
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <Link href={`/boards/${boardId}`} className="text-muted-foreground hover:text-primary transition-colors">
                            Board
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 rounded-full">
                        <Share2 className="h-3.5 w-3.5" />
                        Share
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-hidden">
                <div className="h-full w-full">
                    <TicketDetailView ticketId={ticketId} />
                </div>
            </main>
        </div>
    )
}

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
        <div className="h-full bg-background flex flex-col overflow-hidden">
            <main className="flex-1 overflow-hidden">
                <TicketDetailView ticketId={ticketId} />
            </main>
        </div>
    )
}

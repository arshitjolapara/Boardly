"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Ticket {
    id: string
    title: string
    priority: "low" | "medium" | "high" | string
}

interface KanbanTicketProps {
    ticket: Ticket
}

export function KanbanTicket({ ticket }: KanbanTicketProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: ticket.id,
        data: {
            type: "Ticket",
            ticket,
        },
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className="cursor-grab hover:shadow-md transition-shadow relative">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium leading-none">{ticket.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                    <Badge
                        variant={ticket.priority === 'high' ? 'destructive' : 'outline'}
                        className="text-[10px] px-1.5 py-0 uppercase tracking-wider"
                    >
                        {ticket.priority}
                    </Badge>
                </CardContent>
            </Card>
        </div>
    )
}

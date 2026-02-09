"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TicketActionsMenu } from "./TicketActionsMenu"

import { Ticket } from "./board.types"

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

    // Priority colors
    const priorityColors: Record<string, string> = {
        low: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
        medium: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
        high: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
    }

    const colorClass = priorityColors[ticket.priority as string] || "bg-muted text-muted-foreground"

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="group relative">
            <Card className="cursor-grab hover:shadow-md transition-shadow relative border-l-4" style={{
                borderLeftColor: ticket.priority === 'high' ? 'hsl(var(--destructive))' :
                    ticket.priority === 'medium' ? 'hsl(var(--warning))' : 'hsl(var(--primary))'
            }}>
                <CardHeader className="p-3 pb-2 pr-8 space-y-2">
                    <div className="flex items-center justify-between">
                        <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 uppercase tracking-wider border-0 ${colorClass}`}
                        >
                            {ticket.priority}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                            #{ticket.id.slice(0, 4)}
                        </span>
                    </div>
                    <CardTitle className="text-sm font-medium leading-tight">{ticket.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                    {ticket.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {ticket.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                        {/* Reporter */}
                        <div className="flex items-center gap-1.5" title={`Reporter: ${ticket.reporter?.full_name || ticket.reporter?.email || 'Unknown'}`}>
                            <div className="text-[10px] text-muted-foreground">Rep:</div>
                            <Avatar className="h-4 w-4">
                                <AvatarImage src={ticket.reporter?.avatar_url} />
                                <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                                    {ticket.reporter?.full_name?.[0] || ticket.reporter?.email?.[0] || "?"}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Assignee */}
                        <div className="flex items-center gap-1.5" title={`Assignee: ${ticket.assignee?.full_name || ticket.assignee?.email || 'Unassigned'}`}>
                            <div className="text-[10px] text-muted-foreground">Asg:</div>
                            {ticket.assignee ? (
                                <Avatar className="h-5 w-5 ring-1 ring-background">
                                    <AvatarImage src={ticket.assignee.avatar_url} />
                                    <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                                        {ticket.assignee.full_name?.[0] || ticket.assignee.email[0]}
                                    </AvatarFallback>
                                </Avatar>
                            ) : (
                                <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                            )}
                        </div>
                    </div>
                </CardContent>
                <TicketActionsMenu
                    ticket={ticket}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                />
            </Card>
        </div>
    )
}

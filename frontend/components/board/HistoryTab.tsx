"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { api } from "@/lib/api"
import { TicketHistory, TicketActionType } from "./board.types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

interface HistoryTabProps {
    ticketId: string
}

export function HistoryTab({ ticketId }: HistoryTabProps) {
    const { data: history, isLoading } = useQuery({
        queryKey: ['ticket-history', ticketId],
        queryFn: async () => {
            const res = await api.get(`/tickets/${ticketId}/history`)
            return res.data as TicketHistory[]
        }
    })

    if (isLoading) {
        return (
            <div className="space-y-4 py-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (!history?.length) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                No history available for this ticket.
            </div>
        )
    }

    return (
        <div className="h-[400px] w-full overflow-y-auto pr-4">
            <div className="space-y-6 relative border-l border-muted ml-4 my-4">
                {history.map((record) => (
                    <div key={record.id} className="relative pl-6">
                        {/* Timeline dot */}
                        <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-border ring-4 ring-background" />

                        <div className="flex gap-3 items-start">
                            <Avatar className="h-6 w-6 mt-0.5">
                                <AvatarImage src={record.actor.avatar_url} />
                                <AvatarFallback>{record.actor.full_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-1">
                                <p className="text-sm">
                                    <span className="font-semibold">{record.actor.full_name || record.actor.email}</span>
                                    {" "}
                                    {formatActionText(record)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {format(new Date(record.created_at), "MMM d, yyyy 'at' h:mm a")}
                                </p>

                                {renderActionDetails(record)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function formatActionText(record: TicketHistory): string {
    switch (record.action_type) {
        case TicketActionType.TICKET_CREATED:
            return "created this ticket"
        case TicketActionType.TICKET_UPDATED:
            return `updated ${record.field_name || 'ticket details'}`
        case TicketActionType.STATUS_CHANGED:
            return "changed status" // We could fetch column names if we had them or stored them
        case TicketActionType.ASSIGNEE_CHANGED:
            return "changed assignee"
        case TicketActionType.PRIORITY_CHANGED:
            return "changed priority"
        case TicketActionType.TICKET_DELETED:
            return "deleted this ticket"
        case TicketActionType.COMMENT_ADDED:
            return "commented"
        case TicketActionType.COMMENT_EDITED:
            return "edited a comment"
        case TicketActionType.COMMENT_DELETED:
            return "deleted a comment"
        case TicketActionType.WATCHER_ADDED:
            return "added a watcher"
        case TicketActionType.WATCHER_REMOVED:
            return "removed a watcher"
        default:
            return "performed an action"
    }
}

function renderActionDetails(record: TicketHistory) {
    // Handle Comment Edits
    if (record.action_type === TicketActionType.COMMENT_EDITED && record.old_value && record.new_value) {
        return (
            <div className="text-xs mt-1 text-muted-foreground">
                <div className="flex flex-col gap-1">
                    <span className="line-through opacity-70">"{truncate(record.old_value, 40)}"</span>
                    <span className="opacity-70">↓</span>
                    <span className="font-medium">"{truncate(record.new_value, 40)}"</span>
                </div>
            </div>
        )
    }

    if (record.old_value && record.new_value) {
        // Special formatting for known fields
        if (record.field_name === 'priority') {
            return (
                <div className="text-xs mt-1 bg-muted/50 p-2 rounded-md">
                    <span className="line-through text-muted-foreground">{record.old_value}</span>
                    {" → "}
                    <span className="font-medium">{record.new_value}</span>
                </div>
            )
        }

        // Generic change display (limits length)
        return (
            <div className="text-xs mt-1 text-muted-foreground">
                From <span className="italic">{truncate(record.old_value)}</span> to <span className="font-medium">{truncate(record.new_value)}</span>
            </div>
        )
    }

    // For comments, maybe show snippet?
    if (record.action_type === TicketActionType.COMMENT_ADDED && record.new_value) {
        return (
            <div className="text-xs mt-1 text-muted-foreground border-l-2 pl-2 italic">
                "{truncate(record.new_value, 60)}"
            </div>
        )
    }

    // Handle Comment Deletion
    if (record.action_type === TicketActionType.COMMENT_DELETED && record.old_value) {
        return (
            <div className="text-xs mt-1 text-muted-foreground border-l-2 pl-2 italic line-through opacity-70">
                "{truncate(record.old_value, 60)}"
            </div>
        )
    }

    return null
}

function truncate(str?: string, length = 40) {
    if (!str) return "empty"
    if (str.length <= length) return str
    return str.slice(0, length) + "..."
}

"use client"

import { useMemo } from "react"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@/components/ui/badge"
import { KanbanTicket } from "./KanbanTicket"

interface Ticket {
    id: string
    title: string
    priority: "low" | "medium" | "high" | string
    status_column_id: string
}

interface Column {
    id: string
    name: string
    tickets: Ticket[]
}

interface KanbanColumnProps {
    column: Column
}

export function KanbanColumn({ column }: KanbanColumnProps) {
    const ticketIds = useMemo(() => {
        return column.tickets.map((ticket) => ticket.id)
    }, [column.tickets])

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column,
        },
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex flex-col w-80 shrink-0 h-full"
        >
            {/* Drag Handle for Column */}
            <div
                {...attributes}
                {...listeners}
                className="mb-3 flex items-center justify-between cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/50"
            >
                <h3 className="font-semibold text-sm uppercase text-muted-foreground pl-1">{column.name}</h3>
                <Badge variant="secondary" className="rounded-full px-2">
                    {column.tickets.length}
                </Badge>
            </div>

            <div className="flex-1 flex flex-col gap-3 min-h-[500px] bg-muted/20 rounded-lg p-2 border border-border/50">
                <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
                    {column.tickets.map((ticket) => (
                        <KanbanTicket key={ticket.id} ticket={ticket} />
                    ))}
                </SortableContext>
            </div>
        </div>
    )
}

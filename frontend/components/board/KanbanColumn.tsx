"use client"

import { useMemo } from "react"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Plus } from "lucide-react"
import { KanbanTicket } from "./KanbanTicket"

import { Ticket, Column } from "./board.types"

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
            className="flex flex-col w-[320px] h-full max-h-full group"
        >
            {/* Column Header */}
            <div
                {...attributes}
                {...listeners}
                className="flex items-center justify-between p-4 mb-2 rounded-xl glass dark:glass-dark group-hover:border-primary/30 transition-colors cursor-grab active:cursor-grabbing border-transparent border-2 shadow-sm"
            >
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold tracking-tight uppercase">
                        {column.name}
                    </h3>
                    <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-mono bg-primary/10 text-primary border-none">
                        {column.tickets.length}
                    </Badge>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Tickets Container */}
            <div className="flex-1 overflow-y-auto px-1 space-y-4 min-h-[150px] scrollbar-none kanban-column-gradient rounded-b-2xl pb-10">
                <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
                    {column.tickets.map((ticket) => (
                        <KanbanTicket key={ticket.id} ticket={ticket} />
                    ))}
                </SortableContext>

                <Button
                    variant="ghost"
                    className="w-full justify-start text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 border border-dashed border-transparent hover:border-primary/20 transition-all rounded-xl py-6 group/add"
                >
                    <Plus className="h-4 w-4 mr-2 group-hover/add:rotate-90 transition-transform" />
                    Add Task
                </Button>
            </div>
        </div>
    )
}

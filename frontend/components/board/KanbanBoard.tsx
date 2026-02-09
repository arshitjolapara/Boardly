"use client"

import { useState, useMemo, useEffect } from "react"
import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    useSensor,
    useSensors,
    PointerSensor,
    closestCorners,
} from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { createPortal } from "react-dom"
import { KanbanColumn } from "./KanbanColumn"
import { KanbanTicket } from "./KanbanTicket"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

import { Ticket, Column, Board } from "./board.types"

interface KanbanBoardProps {
    initialBoard: Board
}

export function KanbanBoard({ initialBoard }: KanbanBoardProps) {
    const [columns, setColumns] = useState<Column[]>(initialBoard.columns)
    const [activeColumn, setActiveColumn] = useState<Column | null>(null)
    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
    const queryClient = useQueryClient()

    useEffect(() => {
        setColumns(initialBoard.columns)
    }, [initialBoard])

    const columnIds = useMemo(() => columns.map((col) => col.id), [columns])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // 3px movement required to start drag
            },
        })
    )

    // Mutation to update ticket status in backend
    const updateTicketMutation = useMutation({
        mutationFn: async (vars: { ticketId: string; status_column_id: string }) => {
            return await api.put(`/tickets/${vars.ticketId}`, {
                status_column_id: vars.status_column_id
            })
        },
        onSuccess: () => {
            // We can invalidate, but we are also managing local state optimistically
            queryClient.invalidateQueries({ queryKey: ['board', initialBoard.id] })
        }
    })


    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === "Column") {
            setActiveColumn(event.active.data.current.column)
            return
        }

        if (event.active.data.current?.type === "Ticket") {
            setActiveTicket(event.active.data.current.ticket)
            return
        }
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        if (activeId === overId) return

        const isActiveTicket = active.data.current?.type === "Ticket"
        const isOverTicket = over.data.current?.type === "Ticket"
        const isOverColumn = over.data.current?.type === "Column"

        if (!isActiveTicket) return

        // 1. Im dropping a ticket over another ticket
        if (isActiveTicket && isOverTicket) {
            setColumns((columns) => {
                const activeColumnIndex = columns.findIndex((col) =>
                    col.tickets.some((t) => t.id === activeId)
                )
                const overColumnIndex = columns.findIndex((col) =>
                    col.tickets.some((t) => t.id === overId)
                )

                if (activeColumnIndex === -1 || overColumnIndex === -1) return columns

                const activeColumn = columns[activeColumnIndex]
                const overColumn = columns[overColumnIndex]

                if (activeColumnIndex !== overColumnIndex) {
                    // Moving between columns (DragOver only handles visual change, DragEnd handles data persist)
                    const activeTicketIndex = activeColumn.tickets.findIndex(t => t.id === activeId)
                    const overTicketIndex = overColumn.tickets.findIndex(t => t.id === overId)

                    // Logic to move ticket to new column visually
                    // We need deep copy
                    const newColumns = JSON.parse(JSON.stringify(columns)) as Column[]
                    const [movedTicket] = newColumns[activeColumnIndex].tickets.splice(activeTicketIndex, 1)

                    movedTicket.status_column_id = newColumns[overColumnIndex].id

                    // Insert at correct position (or strictly just append if we don't have order)
                    // dnd-kit suggests using arrayMove for same container, but for different containers we splice and push
                    newColumns[overColumnIndex].tickets.splice(overTicketIndex, 0, movedTicket)

                    return newColumns
                }

                // Same column reordering (handled in DragEnd usually, but for dragOver visual feedback we might need it)
                return columns
            })
        }

        // 2. Im dropping a ticket over a column (empty or not)
        if (isActiveTicket && isOverColumn) {
            setColumns((columns) => {
                const activeColumnIndex = columns.findIndex((col) =>
                    col.tickets.some((t) => t.id === activeId)
                )
                const overColumnIndex = columns.findIndex((col) => col.id === overId)

                if (activeColumnIndex === overColumnIndex) return columns
                if (activeColumnIndex === -1 || overColumnIndex === -1) return columns

                const newColumns = JSON.parse(JSON.stringify(columns)) as Column[]
                const activeTicketIndex = newColumns[activeColumnIndex].tickets.findIndex(t => t.id === activeId)

                const [movedTicket] = newColumns[activeColumnIndex].tickets.splice(activeTicketIndex, 1)
                movedTicket.status_column_id = newColumns[overColumnIndex].id

                newColumns[overColumnIndex].tickets.push(movedTicket)

                return newColumns
            })
        }
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveColumn(null)
        setActiveTicket(null)

        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        // Column Sorting
        if (active.data.current?.type === "Column") {
            // Note: Backend doesn't support column column ordering yet in this MVP phase update logic
            // But we can update local state
            if (activeId !== overId) {
                setColumns((columns) => {
                    const activeIndex = columns.findIndex((col) => col.id === activeId)
                    const overIndex = columns.findIndex((col) => col.id === overId)
                    return arrayMove(columns, activeIndex, overIndex)
                })
            }
            return
        }

        // Ticket Sorting/Moving
        if (active.data.current?.type === "Ticket") {
            const activeColumnIndex = columns.findIndex(col => col.tickets.some(t => t.id === activeId))
            // Find over column (could be ticket or column)
            let overColumnIndex = -1

            if (over.data.current?.type === "Column") {
                overColumnIndex = columns.findIndex(col => col.id === overId)
            } else if (over.data.current?.type === "Ticket") {
                overColumnIndex = columns.findIndex(col => col.tickets.some(t => t.id === overId))
            }

            if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
                const overColumn = columns[overColumnIndex]
                // activeTicket is set on DragStart and holds the original state
                const originalColumnId = activeTicket?.status_column_id

                if (activeTicket && originalColumnId !== overColumn.id) {
                    // Changed Column - Call Backend
                    // Also update the local ticket's status_column_id to prevent re-triggering if we were using it elsewhere
                    // activeTicket.status_column_id = overColumn.id; // Not strictly needed as we reset activeTicket null right after

                    updateTicketMutation.mutate({
                        ticketId: activeTicket.id,
                        status_column_id: overColumn.id
                    })
                }
                else if (activeTicket && activeColumnIndex === overColumnIndex && activeId !== overId) {
                    // Reordered in same column (Backend doesn't support order field on ticket yet)
                    // Just local state update for now
                    setColumns((columns) => {
                        const newColumns = [...columns]
                        const column = newColumns[activeColumnIndex]
                        const oldIndex = column.tickets.findIndex(t => t.id === activeId)
                        const newIndex = column.tickets.findIndex(t => t.id === overId)
                        column.tickets = arrayMove(column.tickets, oldIndex, newIndex)
                        return newColumns
                    })
                }
            }
        }
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            collisionDetection={closestCorners}
        >
            <div className="h-full flex gap-6 p-6 min-w-max">
                <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                    {columns.map((col) => (
                        <KanbanColumn key={col.id} column={col} />
                    ))}
                </SortableContext>
            </div>

            {/* Drag Overlay for smooth visuals */}
            {createPortal(
                <DragOverlay>
                    {activeColumn && (
                        <KanbanColumn column={activeColumn} />
                    )}
                    {activeTicket && (
                        <KanbanTicket ticket={activeTicket} />
                    )}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    )
}

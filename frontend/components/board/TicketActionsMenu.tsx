"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TicketEditDialog } from "./TicketEditDialog"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"

import { Ticket } from "./board.types"

interface TicketActionsMenuProps {
    ticket: Ticket
    className?: string
}

export function TicketActionsMenu({ ticket, className }: TicketActionsMenuProps) {
    const queryClient = useQueryClient()
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const deleteTicketMutation = useMutation({
        mutationFn: async () => {
            return await api.delete(`/tickets/${ticket.id}`)
        },
        onSuccess: () => {
            const targetBoardId = ticket.board_id

            // Optimistically update the cache to remove the ticket immediately
            queryClient.setQueryData(['board', targetBoardId], (oldData: any) => {
                if (!oldData) return oldData

                return {
                    ...oldData,
                    columns: oldData.columns.map((col: any) => ({
                        ...col,
                        tickets: col.tickets.filter((t: any) => t.id !== ticket.id)
                    }))
                }
            })

            queryClient.invalidateQueries({ queryKey: ['board', targetBoardId] })
            setIsDeleteDialogOpen(false)
            toast.error("🗑️ Ticket deleted", {
                description: "The ticket has been permanently removed",
                style: { background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }
            })
        }
    })

    return (
        <>
            <div className={className} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-muted">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="bottom" className="w-[160px]">
                        <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setIsDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <TicketEditDialog
                ticket={ticket}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
            />

            <ConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Ticket?"
                description="Are you sure you want to delete this ticket? This action cannot be undone."
                variant="destructive"
                actionLabel="Delete"
                onConfirm={() => deleteTicketMutation.mutate()}
            />
        </>
    )
}

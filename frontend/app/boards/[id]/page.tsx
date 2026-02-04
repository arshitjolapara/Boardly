"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "@/components/board/KanbanBoard"
import { api } from "@/lib/axios"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Ticket {
    id: string
    title: string
    description?: string
    priority: "low" | "medium" | "high" | string
    status_column_id: string
    board_id: string
}

interface Column {
    id: string
    name: string
    order: number
    tickets: Ticket[]
}

interface BoardDetail {
    id: string
    name: string
    columns: Column[]
}

export default function BoardDetailPage() {
    const params = useParams()
    const queryClient = useQueryClient()
    const boardId = params.id as string

    const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false)
    const [newTicket, setNewTicket] = useState({
        title: "",
        description: "",
        priority: "medium",
        status_column_id: ""
    })

    const { data: board, isLoading } = useQuery<BoardDetail>({
        queryKey: ['board', boardId],
        queryFn: async () => {
            const res = await api.get(`/boards/${boardId}`)
            return res.data
        }
    })

    const createTicketMutation = useMutation({
        mutationFn: async (ticketData: { title: string; description: string; priority: string; status_column_id: string }) => {
            return await api.post("/tickets/", {
                ...ticketData,
                board_id: boardId
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
            setIsTicketDialogOpen(false)
            setNewTicket({
                title: "",
                description: "",
                priority: "medium",
                status_column_id: ""
            })
        }
    })

    const handleCreateTicket = () => {
        if (newTicket.title && newTicket.status_column_id) {
            createTicketMutation.mutate(newTicket)
        }
    }

    if (isLoading) return <div className="flex justify-center p-10 h-screen items-center">Loading board...</div>
    if (!board) return <div className="flex justify-center p-10 h-screen items-center">Board not found</div>

    return (
        <div className="h-screen flex flex-col bg-background">
            <header className="border-b p-4 flex justify-between items-center bg-card shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.location.href = '/boards'}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {board.name}
                    </h1>
                </div>
                <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Ticket</DialogTitle>
                            <DialogDescription>Add a task to your board.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={newTicket.title}
                                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desc">Description</Label>
                                <Textarea
                                    id="desc"
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={newTicket.priority}
                                        onValueChange={(val) => setNewTicket({ ...newTicket, priority: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={newTicket.status_column_id}
                                        onValueChange={(val) => setNewTicket({ ...newTicket, status_column_id: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {board.columns.map(col => (
                                                <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateTicket} disabled={createTicketMutation.isPending}>
                                {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </header>

            <main className="flex-1 overflow-auto bg-muted/10">
                {/* Use the new KanbanBoard component that handles Drag & Drop */}
                {/* We pass a key to force re-render if board data changes drastically, but internal state manages optimistics */}
                <KanbanBoard initialBoard={board} key={board.updated_at ? String(board.updated_at) : 'board'} />
            </main>
        </div>
    )
}

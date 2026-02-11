"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { KanbanBoard } from "@/components/board/KanbanBoard"
import { ListView } from "@/components/board/ListView"
import { UserProfile } from "@/components/UserProfile"
import { MobileNav } from "@/components/MobileNav"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Plus,
    Settings,
    Trash2,
    Pencil,
    Layout,
    List as ListIcon
} from "lucide-react"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BoardSettingsDialog } from "@/components/board/BoardSettingsDialog"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { toast } from "sonner"
import { useWebSocket } from "@/hooks/useWebSocket"

export default function BoardDetailPage() {
    const params = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const boardId = params.id as string

    const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
    const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isDeleteBoardDialogOpen, setIsDeleteBoardDialogOpen] = useState(false)
    const [newTicket, setNewTicket] = useState({
        title: "",
        description: "",
        priority: "medium",
        status_column_id: ""
    })

    // Real-time synchronization
    useWebSocket(boardId, (message) => {
        // We handle updates silently as requested
        if (message.type === 'TICKET_CREATED' || message.type === 'TICKET_UPDATED' || message.type === 'TICKET_DELETED') {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
        }
        if (message.type === 'COMMENT_ADDED' || message.type === 'COMMENT_UPDATED' || message.type === 'COMMENT_DELETED') {
            queryClient.invalidateQueries({ queryKey: ['ticket', message.ticket_id] })
        }
        if (message.type === 'BOARD_UPDATED') {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
        }
        if (message.type === 'BOARD_DELETED') {
            router.push('/boards')
            toast.error("This board has been deleted")
        }
    })

    const { data: board, isLoading: isBoardLoading, error: boardError } = useQuery({
        queryKey: ['board', boardId],
        queryFn: async () => {
            const res = await api.get(`/boards/${boardId}`)
            return res.data
        }
    })

    const { data: currentUser } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: async () => {
            const res = await api.get('/users/me')
            return res.data
        }
    })

    const createTicketMutation = useMutation({
        mutationFn: async (data: typeof newTicket) => {
            return await api.post(`/boards/${boardId}/tickets`, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
            setIsCreateTicketOpen(false)
            setNewTicket({ title: "", description: "", priority: "medium", status_column_id: "" })
            toast.success("Ticket created!")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to create ticket")
        }
    })

    const deleteBoardMutation = useMutation({
        mutationFn: async () => {
            return await api.delete(`/boards/${boardId}`)
        },
        onSuccess: () => {
            router.push('/boards')
            toast.success("Board deleted successfully")
        }
    })

    const handleCreateTicket = () => {
        if (!newTicket.title || !newTicket.status_column_id) {
            toast.error("Please fill in the title and status")
            return
        }
        createTicketMutation.mutate(newTicket)
    }

    if (isBoardLoading) {
        return (
            <div className="flex flex-col h-screen">
                <header className="border-b h-16 flex items-center px-6">
                    <Skeleton className="h-8 w-48" />
                </header>
                <main className="flex-1 p-6 flex gap-6 overflow-hidden">
                    <Skeleton className="h-full w-80" />
                    <Skeleton className="h-full w-80" />
                    <Skeleton className="h-full w-80" />
                </main>
            </div>
        )
    }

    if (boardError || !board) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <h1 className="text-2xl font-bold">Board not found</h1>
                <Button onClick={() => router.push('/boards')}>Back to Boards</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <header className="border-b h-16 flex items-center justify-between px-6 shrink-0 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold tracking-tight">{board.name}</h1>
                    <div className="hidden md:flex items-center bg-muted/40 rounded-lg p-1 gap-1">
                        <Button
                            variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('board')}
                            className="h-8 px-3 rounded-md transition-all sm:flex hidden"
                        >
                            <Layout className="h-4 w-4 mr-2" />
                            Board
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="h-8 px-3 rounded-md transition-all sm:flex hidden"
                        >
                            <ListIcon className="h-4 w-4 mr-2" />
                            List
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 rounded-full px-5 h-9">
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">New Ticket</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Create New Ticket</DialogTitle>
                                <DialogDescription>
                                    Add a new ticket to your board.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <Label>Title <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={newTicket.title}
                                        onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                        placeholder="What needs to be done?"
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        placeholder="Add more details..."
                                        className="min-h-[120px] resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select
                                            value={newTicket.priority}
                                            onValueChange={(val) => setNewTicket({ ...newTicket, priority: val })}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status <span className="text-destructive">*</span></Label>
                                        <Select
                                            value={newTicket.status_column_id}
                                            onValueChange={(val) => setNewTicket({ ...newTicket, status_column_id: val })}
                                        >
                                            <SelectTrigger className="h-11">
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
                                <Button onClick={handleCreateTicket} disabled={createTicketMutation.isPending} className="w-full sm:w-auto h-11 px-8 rounded-full">
                                    {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {currentUser && currentUser.id === board.owner_id && (
                        <Settings onClick={() => setIsSettingsOpen(true)} className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                    )}

                    <UserProfile />
                    <div className="md:hidden">
                        <MobileNav isLoggedIn={true} />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-x-auto bg-muted/5 glass dark:glass-dark">
                <div className="h-full">
                    {viewMode === 'board' ? (
                        <KanbanBoard initialBoard={board} key={board.updated_at ? String(board.updated_at) : 'board'} />
                    ) : (
                        <div className="container mx-auto p-4">
                            <ListView board={board} />
                        </div>
                    )}
                </div>
            </main>

            <BoardSettingsDialog
                boardId={boardId}
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <ConfirmationDialog
                open={isDeleteBoardDialogOpen}
                onOpenChange={setIsDeleteBoardDialogOpen}
                title="Delete Board?"
                description="This action cannot be undone. This will permanently delete your board and all associated tickets."
                variant="destructive"
                actionLabel="Delete"
                onConfirm={() => deleteBoardMutation.mutate()}
            />
        </div>
    )
}

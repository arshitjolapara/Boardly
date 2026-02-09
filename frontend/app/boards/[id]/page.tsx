"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, ArrowLeft, MoreVertical, Trash2, Pencil, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "@/components/board/KanbanBoard"
import { BoardSettingsDialog } from "@/components/board/BoardSettingsDialog"
import { ListView } from "@/components/board/ListView"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/ThemeToggle"
import { UserProfile } from "@/components/UserProfile"
import { toast } from "sonner"
import { api } from "@/lib/api"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

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
    updated_at: string
    owner_id: string
}

export default function BoardDetailPage() {
    const params = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const boardId = params.id as string

    const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false)
    const [viewMode, setViewMode] = useState("board")
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isDeleteBoardDialogOpen, setIsDeleteBoardDialogOpen] = useState(false)

    const [newTicket, setNewTicket] = useState({
        title: "",
        description: "",
        priority: "medium",
        status_column_id: "",
        assignee_id: "",
        created_by_id: ""
    })

    // Fetch board members for assignee dropdown
    const { data: members } = useQuery({
        queryKey: ['board', boardId, 'members'],
        queryFn: async () => {
            const res = await api.get(`/boards/${boardId}/members`)
            return res.data
        },
        enabled: isTicketDialogOpen
    })

    // Fetch current user
    const { data: currentUser } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: async () => {
            const res = await api.get('/users/me')
            return res.data
        }
    })

    // Default assignee and reporter to current user when dialog opens
    useEffect(() => {
        if (isTicketDialogOpen && currentUser) {
            setNewTicket(prev => ({
                ...prev,
                assignee_id: prev.assignee_id || currentUser.id,
                created_by_id: prev.created_by_id || currentUser.id
            }))
        }
    }, [isTicketDialogOpen, currentUser])

    // Reuse existing queries
    const { data: board, isLoading } = useQuery<BoardDetail>({
        queryKey: ['board', boardId],
        queryFn: async () => {
            const res = await api.get(`/boards/${boardId}`)
            return res.data
        }
    })

    const createTicketMutation = useMutation({
        mutationFn: async (ticketData: { title: string; description: string; priority: string; status_column_id: string; assignee_id?: string; created_by_id?: string }) => {
            const payload: any = {
                ...ticketData,
                board_id: boardId
            }
            // Only include assignee_id if it's set
            if (ticketData.assignee_id) {
                payload.assignee_id = ticketData.assignee_id
            }
            if (ticketData.created_by_id) {
                payload.created_by_id = ticketData.created_by_id
            }
            return await api.post("/tickets/", payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
            setIsTicketDialogOpen(false)
            toast.success("✅ Ticket created successfully")
            setNewTicket({
                title: "",
                description: "",
                priority: "medium",
                status_column_id: "",
                assignee_id: currentUser?.id || "",
                created_by_id: currentUser?.id || ""
            })
        },
        onError: (error: any) => {
            toast.error(`❌ ${error.response?.data?.detail || "Failed to create ticket"}`)
        }
    })

    const deleteBoardMutation = useMutation({
        mutationFn: async () => {
            return await api.delete(`/boards/${boardId}`)
        },
        onSuccess: () => {
            toast.error("🗑️ Board deleted", {
                description: "The board and all its tickets have been permanently removed",
                style: { background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }
            })
            router.push('/boards')
        }
    })

    const handleCreateTicket = () => {
        // Validate all required fields
        const missingFields: string[] = []

        if (!newTicket.title.trim()) missingFields.push("Title")
        if (!newTicket.description.trim()) missingFields.push("Description")
        if (!newTicket.status_column_id) missingFields.push("Status")
        if (!newTicket.assignee_id) missingFields.push("Assignee")

        if (missingFields.length > 0) {
            toast.error(`❌ Missing required fields`, {
                description: `Please fill in: ${missingFields.join(", ")}`,
                duration: 5000
            })
            return
        }

        createTicketMutation.mutate(newTicket)
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

                    <Tabs value={viewMode} onValueChange={setViewMode} className="ml-4">
                        <TabsList>
                            <TabsTrigger value="board">Board</TabsTrigger>
                            <TabsTrigger value="list">List</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex items-center gap-2">
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
                                    <Label htmlFor="title">
                                        Title <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        value={newTicket.title}
                                        onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                        placeholder="Enter ticket title"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="desc">
                                        Description <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="desc"
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        placeholder="Enter ticket description"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>
                                        Assignee <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={newTicket.assignee_id}
                                        onValueChange={(val) => setNewTicket({ ...newTicket, assignee_id: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {members?.map((member: any) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.full_name || member.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Reporter</Label>
                                    <Select
                                        value={newTicket.created_by_id}
                                        onValueChange={(val) => setNewTicket({ ...newTicket, created_by_id: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select reporter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {members?.map((member: any) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.full_name || member.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>
                                            Priority <span className="text-destructive">*</span>
                                        </Label>
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
                                        <Label>
                                            Status <span className="text-destructive">*</span>
                                        </Label>
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

                    {currentUser && currentUser.id === board.owner_id && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                                    <Settings className="mr-2 h-4 w-4" /> Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setIsDeleteBoardDialogOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Board
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    <div className="h-6 w-px bg-border mx-1" />
                    <ThemeToggle />
                    <UserProfile />

                </div>
            </header>


            <main className="flex-1 overflow-auto bg-muted/10 p-4">
                {viewMode === 'board' ? (
                    <KanbanBoard initialBoard={board} key={board.updated_at ? String(board.updated_at) : 'board'} />
                ) : (
                    <ListView board={board} />
                )}
            </main>

            <BoardSettingsDialog
                boardId={boardId}
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            {/* Delete Board Confirmation */}
            <ConfirmationDialog
                open={isDeleteBoardDialogOpen}
                onOpenChange={setIsDeleteBoardDialogOpen}
                title="Delete Board?"
                description="This action cannot be undone. This will permanently delete your board and all associated tickets. Only the owner can delete the board."
                variant="destructive"
                actionLabel="Delete"
                onConfirm={() => deleteBoardMutation.mutate()}
            />
        </div>
    )
}

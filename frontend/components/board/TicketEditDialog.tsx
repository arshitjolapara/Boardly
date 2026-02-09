"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Button } from "@/components/ui/button"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ticket } from "./board.types"
import { CommentSection } from "./CommentSection"
import { HistoryTab } from "./HistoryTab"
import { WatcherList } from "./WatcherList"

interface TicketEditDialogProps {
    ticket: Ticket
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TicketEditDialog({ ticket, open, onOpenChange }: TicketEditDialogProps) {
    const queryClient = useQueryClient()
    const [editTicket, setEditTicket] = useState({
        title: ticket.title,
        description: ticket.description || "",
        priority: ticket.priority,
        assignee_id: ticket.assignee_id || "unassigned",
        created_by_id: ticket.reporter?.id || ""
    })

    // Fetch current user
    const { data: currentUser } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: async () => {
            const res = await api.get('/users/me')
            return res.data
        }
    })

    // Fetch members
    const { data: members } = useQuery({
        queryKey: ['board', ticket.board_id, 'members'],
        queryFn: async () => {
            const res = await api.get(`/boards/${ticket.board_id}/members`)
            return res.data
        },
        enabled: open
    })

    // Auto-update reporter to current user when edit dialog opens
    useEffect(() => {
        if (open && currentUser) {
            setEditTicket(prev => ({
                ...prev,
                title: ticket.title,
                description: ticket.description || "",
                priority: ticket.priority,
                assignee_id: ticket.assignee_id || "unassigned",
                created_by_id: ticket.reporter?.id || ""
            }))
        }
    }, [open, currentUser, ticket])

    const updateTicketMutation = useMutation({
        mutationFn: async (data: typeof editTicket) => {
            const payload = {
                ...data,
                assignee_id: data.assignee_id === "unassigned" ? null : data.assignee_id,
            }
            return await api.put(`/tickets/${ticket.id}`, payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', ticket.board_id] })
            onOpenChange(false)
            toast.success("✅ Ticket updated successfully")
        },
        onError: (error: any) => {
            toast.error(`❌ ${error.response?.data?.detail || "Failed to update ticket"}`)
        }
    })

    const handleUpdateTicket = () => {
        const missingFields: string[] = []
        if (!editTicket.title.trim()) missingFields.push("Title")
        if (!editTicket.description.trim()) missingFields.push("Description")
        if (!editTicket.assignee_id || editTicket.assignee_id === "unassigned") missingFields.push("Assignee")

        if (missingFields.length > 0) {
            toast.error(`❌ Missing required fields`, {
                description: `Please fill in: ${missingFields.join(", ")}`,
                duration: 5000
            })
            return
        }

        updateTicketMutation.mutate(editTicket)
    }

    // Fetch board
    const { data: board } = useQuery({
        queryKey: ['board', ticket.board_id],
        queryFn: async () => {
            const res = await api.get(`/boards/${ticket.board_id}`)
            return res.data
        },
        enabled: open
    })

    const isBoardOwner = currentUser?.id === board?.owner_id

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Edit Ticket</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details & Comments</TabsTrigger>
                        <TabsTrigger value="watchers">Watchers</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>
                                    Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    value={editTicket.title}
                                    onChange={(e) => setEditTicket({ ...editTicket, title: e.target.value })}
                                    placeholder="Enter ticket title"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    Description <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    value={editTicket.description}
                                    onChange={(e) => setEditTicket({ ...editTicket, description: e.target.value })}
                                    placeholder="Enter ticket description"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>
                                        Priority <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={editTicket.priority}
                                        onValueChange={(val) => setEditTicket({ ...editTicket, priority: val })}
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
                                        Assignee <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={editTicket.assignee_id}
                                        onValueChange={(val) => setEditTicket({ ...editTicket, assignee_id: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {members?.map((member: any) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.full_name || member.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2 col-span-2">
                                    <Label>Reporter</Label>
                                    <Select
                                        value={editTicket.created_by_id}
                                        onValueChange={(val) => setEditTicket({ ...editTicket, created_by_id: val })}
                                        disabled
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
                            </div>

                            <CommentSection ticketId={ticket.id} currentUser={currentUser} />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleUpdateTicket} disabled={updateTicketMutation.isPending}>
                                {updateTicketMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="watchers" className="py-4">
                        {currentUser && (
                            <WatcherList
                                ticketId={ticket.id}
                                boardId={ticket.board_id}
                                currentUserId={currentUser.id}
                                isOwner={isBoardOwner}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="history">
                        <HistoryTab ticketId={ticket.id} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

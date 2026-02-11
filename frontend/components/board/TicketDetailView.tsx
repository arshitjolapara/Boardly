"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
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
import { CommentSection } from "./CommentSection"
import { HistoryTab } from "./HistoryTab"
import { WatcherList } from "./WatcherList"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, Calendar, User, Tag, Clock } from "lucide-react"
import Link from "next/link"

interface TicketDetailViewProps {
    ticketId: string
    onClose?: () => void
}

export function TicketDetailView({ ticketId, onClose }: TicketDetailViewProps) {
    const queryClient = useQueryClient()

    // Fetch Ticket
    const { data: ticket, isLoading: isTicketLoading } = useQuery({
        queryKey: ['ticket', ticketId],
        queryFn: async () => {
            const res = await api.get(`/tickets/${ticketId}`)
            return res.data
        }
    })

    const [editTicket, setEditTicket] = useState({
        title: "",
        description: "",
        priority: "medium",
        assignee_id: "unassigned",
        created_by_id: ""
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
        queryKey: ['board', ticket?.board_id, 'members'],
        queryFn: async () => {
            const res = await api.get(`/boards/${ticket.board_id}/members`)
            return res.data
        },
        enabled: !!ticket?.board_id
    })

    // Fetch board
    const { data: board } = useQuery({
        queryKey: ['board', ticket?.board_id],
        queryFn: async () => {
            const res = await api.get(`/boards/${ticket.board_id}`)
            return res.data
        },
        enabled: !!ticket?.board_id
    })

    useEffect(() => {
        if (ticket) {
            setEditTicket({
                title: ticket.title,
                description: ticket.description || "",
                priority: ticket.priority,
                assignee_id: ticket.assignee_id || "unassigned",
                created_by_id: ticket.reporter?.id || ""
            })
        }
    }, [ticket])

    const updateTicketMutation = useMutation({
        mutationFn: async (data: typeof editTicket) => {
            const payload = {
                ...data,
                assignee_id: data.assignee_id === "unassigned" ? null : data.assignee_id,
            }
            return await api.put(`/tickets/${ticketId}`, payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
            queryClient.invalidateQueries({ queryKey: ['board', ticket?.board_id] })
            toast.success("✅ Ticket updated successfully")
        },
        onError: (error: any) => {
            toast.error(`❌ ${error.response?.data?.detail || "Failed to update ticket"}`)
        }
    })

    const handleUpdateTicket = () => {
        if (!editTicket.title.trim()) {
            toast.error("❌ Title is required")
            return
        }
        updateTicketMutation.mutate(editTicket)
    }

    if (isTicketLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <div className="flex gap-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-32 w-full" />
                <div className="space-y-4 pt-8">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        )
    }

    if (!ticket) return <div className="p-8 text-center text-muted-foreground">Ticket not found</div>

    const isBoardOwner = currentUser?.id === board?.owner_id

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden lg:flex-row">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 border-r">
                <div className="max-w-4xl mx-auto space-y-10">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        <Link href="/boards" className="hover:text-primary transition-colors">Boards</Link>
                        <ChevronRight className="h-3 w-3" />
                        <Link href={`/boards/${ticket.board_id}`} className="hover:text-primary transition-colors">{board?.name || "..."}</Link>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-primary/70">TKT-{ticketId.slice(0, 4)}</span>
                    </div>

                    {/* Title Section */}
                    <div className="space-y-4">
                        <Input
                            className="text-3xl lg:text-4xl font-extrabold tracking-tight border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-auto leading-tight"
                            value={editTicket.title}
                            onChange={(e) => setEditTicket({ ...editTicket, title: e.target.value })}
                            onBlur={handleUpdateTicket}
                            placeholder="Enter ticket title..."
                        />
                    </div>

                    {/* Action Bar / Status */}
                    <div className="flex items-center gap-3 py-2 border-y border-border/50">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
                            <Clock className="h-3.5 w-3.5" />
                            {ticket.column?.name}
                        </div>
                        {/* More actions could go here (e.g. status transition dropdown) */}
                    </div>

                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
                            <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-sm font-semibold tracking-tight uppercase">Description</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-sm font-semibold tracking-tight uppercase">History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="pt-8 space-y-12">
                            <div className="space-y-4 group">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">Description</Label>
                                <div className="relative">
                                    <Textarea
                                        className="min-h-[250px] text-base leading-relaxed resize-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-muted/5 border-none p-4 rounded-2xl shadow-inner transition-all hover:bg-muted/10"
                                        value={editTicket.description}
                                        onChange={(e) => setEditTicket({ ...editTicket, description: e.target.value })}
                                        onBlur={handleUpdateTicket}
                                        placeholder="Add a detailed description..."
                                    />
                                    <div className="absolute top-4 right-4 text-[10px] text-muted-foreground/40 font-mono italic">
                                        Last saved: {new Date(ticket.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-12 border-t border-dashed">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground block mb-8">Activity & Discussion</Label>
                                <CommentSection ticketId={ticketId} currentUser={currentUser} />
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="pt-8">
                            <HistoryTab ticketId={ticketId} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Sidebar Metadata */}
            <aside className="w-full lg:w-[360px] bg-muted/5 glass-dark p-6 lg:p-10 space-y-12 overflow-y-auto shrink-0">
                {/* Status/Priority Section */}
                <div className="space-y-8">
                    <div className="space-y-6">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Details</Label>

                        <div className="grid gap-6">
                            {/* Priority */}
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-2">
                                    <Tag className="h-3 w-3" /> Priority
                                </span>
                                <Select
                                    value={editTicket.priority}
                                    onValueChange={(val) => {
                                        setEditTicket(prev => ({ ...prev, priority: val }))
                                        updateTicketMutation.mutate({ ...editTicket, priority: val })
                                    }}
                                >
                                    <SelectTrigger className="w-full h-10 text-sm border-muted-foreground/10 bg-muted/20 hover:bg-muted/30 transition-all rounded-xl capitalize font-semibold shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-muted">
                                        <SelectItem value="low" className="text-blue-500 font-medium">Low</SelectItem>
                                        <SelectItem value="medium" className="text-amber-500 font-medium">Medium</SelectItem>
                                        <SelectItem value="high" className="text-red-500 font-medium">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Assignee */}
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-2">
                                    <User className="h-3 w-3" /> Assignee
                                </span>
                                <Select
                                    value={editTicket.assignee_id}
                                    onValueChange={(val) => {
                                        setEditTicket(prev => ({ ...prev, assignee_id: val }))
                                        updateTicketMutation.mutate({ ...editTicket, assignee_id: val })
                                    }}
                                >
                                    <SelectTrigger className="w-full h-10 text-sm border-muted-foreground/10 bg-muted/20 hover:bg-muted/30 transition-all rounded-xl shadow-sm overflow-hidden">
                                        <SelectValue placeholder="Unassigned" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-muted">
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {members?.map((member: any) => (
                                            <SelectItem key={member.id} value={member.id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-primary/20 text-[8px] flex items-center justify-center font-bold">
                                                        {member.full_name?.[0] || member.email?.[0]}
                                                    </span>
                                                    {member.full_name || member.email}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* People Section */}
                    <div className="space-y-6 pt-8 border-t border-border/50">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">People</Label>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between group">
                                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Reporter</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold">{ticket.reporter?.full_name || ticket.reporter?.email}</span>
                                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] uppercase font-bold text-muted-foreground">
                                        {ticket.reporter?.full_name?.[0] || ticket.reporter?.email?.[0]}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dates Section */}
                    <div className="space-y-6 pt-8 border-t border-border/50">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Dates</Label>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs transition-colors hover:bg-muted/10 p-1 rounded-lg">
                                <span className="text-muted-foreground flex items-center gap-2 italic">
                                    <Calendar className="h-3 w-3" /> Created
                                </span>
                                <span className="font-mono text-[11px] font-semibold text-primary/80">
                                    {new Date(ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs transition-colors hover:bg-muted/10 p-1 rounded-lg">
                                <span className="text-muted-foreground flex items-center gap-2 italic">
                                    <Clock className="h-3 w-3" /> Updated
                                </span>
                                <span className="font-mono text-[11px] font-semibold text-primary/80">
                                    {new Date(ticket.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Watchers Section */}
                    <div className="space-y-6 pt-8 border-t border-border/50">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Watchers</Label>
                        {currentUser && (
                            <WatcherList
                                ticketId={ticketId}
                                boardId={ticket.board_id}
                                currentUserId={currentUser.id}
                                isOwner={isBoardOwner}
                            />
                        )}
                    </div>
                </div>

                {onClose && (
                    <div className="pt-12">
                        <Button
                            variant="secondary"
                            className="w-full text-[10px] font-black uppercase tracking-widest rounded-full py-6 h-auto transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-95"
                            onClick={onClose}
                        >
                            Close View
                        </Button>
                    </div>
                )}
            </aside>
        </div>
    )
}

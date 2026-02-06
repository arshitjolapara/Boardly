"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { TicketActionsMenu } from "./TicketActionsMenu"
import { useState, useMemo } from "react"
import { ArrowUpDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

function ListViewRow({ ticket }: { ticket: any }) {
    const priorityColors: Record<string, string> = {
        low: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        high: "bg-red-100 text-red-800 hover:bg-red-100"
    }

    return (
        <TableRow>
            <TableCell className="font-medium">
                <div className="flex flex-col">
                    <span>{ticket.title}</span>
                    <span className="text-xs text-muted-foreground font-mono">#{ticket.id.slice(0, 4)}</span>
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="outline">{ticket.status}</Badge>
            </TableCell>
            <TableCell>
                <Badge className={priorityColors[ticket.priority as string] || "bg-muted text-muted-foreground"}>
                    {ticket.priority}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    {ticket.assignee ? (
                        <>
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={ticket.assignee.avatar_url} />
                                <AvatarFallback>{ticket.assignee.full_name?.[0] || ticket.assignee.email[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{ticket.assignee.full_name || ticket.assignee.email}</span>
                        </>
                    ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                    )}
                </div>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </TableCell>
            <TableCell>
                <TicketActionsMenu ticket={ticket} />
            </TableCell>
        </TableRow>
    )
}

export function ListView({ board }: { board: any }) {
    if (!board) return null

    const [searchQuery, setSearchQuery] = useState("")
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [priorityFilter, setPriorityFilter] = useState<string>("all")
    const [assigneeFilter, setAssigneeFilter] = useState<string>("all")

    // Flatten tickets
    const allTickets = useMemo(() => {
        return board.columns.flatMap((col: any) =>
            col.tickets.map((t: any) => ({ ...t, status: col.name, statusId: col.id }))
        )
    }, [board])

    // Get unique assignees for filter
    const assignees = useMemo(() => {
        const unique = new Map()
        allTickets.forEach((t: any) => {
            if (t.assignee) {
                unique.set(t.assignee.id, t.assignee)
            }
        })
        return Array.from(unique.values())
    }, [allTickets])

    // Filter and Sort
    const filteredTickets = useMemo(() => {
        let result = [...allTickets]

        // Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase()
            result = result.filter((t: any) =>
                t.title.toLowerCase().includes(lowerQuery) ||
                (t.description && t.description.toLowerCase().includes(lowerQuery))
            )
        }

        // Status Filter
        if (statusFilter !== "all") {
            result = result.filter((t: any) => t.status === statusFilter)
        }

        // Priority Filter
        if (priorityFilter !== "all") {
            result = result.filter((t: any) => t.priority === priorityFilter)
        }

        // Assignee Filter
        if (assigneeFilter === "unassigned") {
            result = result.filter((t: any) => !t.assignee)
        } else if (assigneeFilter !== "all") {
            result = result.filter((t: any) => t.assignee?.id === assigneeFilter)
        }

        // Sort
        if (sortConfig) {
            result.sort((a: any, b: any) => {
                let aValue = a[sortConfig.key]
                let bValue = b[sortConfig.key]

                // Handle nested assignee/status if needed, but for now simple keys
                if (sortConfig.key === 'assignee') {
                    aValue = a.assignee?.full_name || ""
                    bValue = b.assignee?.full_name || ""
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return result
    }, [allTickets, searchQuery, statusFilter, priorityFilter, assigneeFilter, sortConfig])

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return current.direction === 'asc' ? { key, direction: 'desc' } : null
            }
            return { key, direction: 'asc' }
        })
    }

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-md border shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tickets..."
                        className="pl-9 h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9 w-[130px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {board.columns.map((col: any) => (
                                <SelectItem key={col.id} value={col.name}>{col.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Priority Filter */}
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="h-9 w-[120px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Assignee Filter */}
                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                        <SelectTrigger className="h-9 w-[140px]">
                            <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Assignees</SelectItem>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {assignees.map((user: any) => (
                                <SelectItem key={user.id} value={user.id}>{user.full_name || user.email}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Clear Filters (if any set) */}
                    {(statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all' || searchQuery) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-2 text-muted-foreground"
                            onClick={() => {
                                setStatusFilter('all');
                                setPriorityFilter('all');
                                setAssigneeFilter('all');
                                setSearchQuery('');
                            }}
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('title')}>
                                <div className="flex items-center gap-1">
                                    Title
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>
                                <div className="flex items-center gap-1">
                                    Status
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('priority')}>
                                <div className="flex items-center gap-1">
                                    Priority
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('assignee')}>
                                <div className="flex items-center gap-1">
                                    Assignee
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort('created_at')}>
                                <div className="flex items-center justify-end gap-1">
                                    Created
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTickets.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                    No tickets found matching your filters.
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredTickets.map((ticket: any) => (
                            <ListViewRow key={ticket.id} ticket={ticket} />
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="text-xs text-muted-foreground text-center">
                Showing {filteredTickets.length} of {allTickets.length} tickets
            </div>
        </div>
    )
}

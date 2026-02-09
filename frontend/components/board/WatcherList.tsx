'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Plus, X, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { TicketWatcher, User } from './types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useState } from 'react'
import { toast } from 'sonner'

interface WatcherListProps {
    ticketId: string
    boardId: string
    currentUserId: string
    isOwner: boolean
}

export function WatcherList({ ticketId, boardId, currentUserId, isOwner }: WatcherListProps) {
    const queryClient = useQueryClient()
    const [addOpen, setAddOpen] = useState(false)

    // Fetch watchers
    const { data: watchers = [], isLoading } = useQuery<TicketWatcher[]>({
        queryKey: ['ticket-watchers', ticketId],
        queryFn: async () => {
            const response = await api.get(`/tickets/${ticketId}/watchers`)
            return response.data
        }
    })

    // Fetch board members for adding watchers
    const { data: members = [] } = useQuery<User[]>({
        queryKey: ['board-members', boardId],
        queryFn: async () => {
            const response = await api.get(`/boards/${boardId}/members`)
            return response.data
        }
    })

    // Add watcher mutation
    const addWatcher = useMutation({
        mutationFn: async (userId: string) => {
            const response = await api.post(`/tickets/${ticketId}/watchers`, { user_id: userId })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket-watchers', ticketId] })
            queryClient.invalidateQueries({ queryKey: ['ticket-history', ticketId] })
            setAddOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to add watcher')
        }
    })

    // Remove watcher mutation
    const removeWatcher = useMutation({
        mutationFn: async (userId: string) => {
            const response = await api.delete(`/tickets/${ticketId}/watchers/${userId}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket-watchers', ticketId] })
            queryClient.invalidateQueries({ queryKey: ['ticket-history', ticketId] })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to remove watcher')
        }
    })

    const isCurrentUserWatching = watchers.some(w => w.user_id === currentUserId)
    const availableMembers = members.filter(m => !watchers.some(w => w.user_id === m.id))

    const canRemove = (watcherUserId: string) => {
        return watcherUserId === currentUserId || isOwner
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading watchers...</span>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Watchers ({watchers.length})</h4>
                <div className="flex items-center gap-2">
                    {/* Watch/Unwatch button */}
                    <Button
                        variant={isCurrentUserWatching ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                            if (isCurrentUserWatching) {
                                removeWatcher.mutate(currentUserId)
                            } else {
                                addWatcher.mutate(currentUserId)
                            }
                        }}
                        disabled={addWatcher.isPending || removeWatcher.isPending}
                    >
                        {isCurrentUserWatching ? (
                            <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Unwatch
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4 mr-1" />
                                Watch
                            </>
                        )}
                    </Button>

                    {/* Add watcher dropdown */}
                    <Popover open={addOpen} onOpenChange={setAddOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0" align="end">
                            <Command>
                                <CommandInput placeholder="Search members..." />
                                <CommandList>
                                    <CommandEmpty>No members available</CommandEmpty>
                                    <CommandGroup>
                                        {availableMembers.map(member => (
                                            <CommandItem
                                                key={member.id}
                                                onSelect={() => addWatcher.mutate(member.id)}
                                            >
                                                <Avatar className="h-6 w-6 mr-2">
                                                    <AvatarImage src={member.avatar_url} />
                                                    <AvatarFallback>
                                                        {(member.full_name || member.email)?.[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>{member.full_name || member.email}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Watcher list */}
            {watchers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No one is watching this ticket</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {watchers.map(watcher => (
                        <div
                            key={watcher.id}
                            className="flex items-center gap-1 bg-muted rounded-full pl-1 pr-2 py-1"
                        >
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={watcher.user.avatar_url} />
                                <AvatarFallback>
                                    {(watcher.user.full_name || watcher.user.email)?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{watcher.user.full_name || watcher.user.email}</span>
                            {canRemove(watcher.user_id) && (
                                <button
                                    onClick={() => removeWatcher.mutate(watcher.user_id)}
                                    className="ml-1 text-muted-foreground hover:text-destructive"
                                    disabled={removeWatcher.isPending}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

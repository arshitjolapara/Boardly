"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Send } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

import { CommentItem } from "./CommentItem"
import { Comment, User } from "./board.types"

interface CommentSectionProps {
    ticketId: string
    currentUser: User | null
}

export function CommentSection({ ticketId, currentUser }: CommentSectionProps) {
    const queryClient = useQueryClient()
    const [newComment, setNewComment] = useState("")

    const { data: comments, isLoading } = useQuery({
        queryKey: ['comments', ticketId],
        queryFn: async () => {
            const res = await api.get(`/tickets/${ticketId}/comments`)
            return res.data as Comment[]
        }
    })

    const createCommentMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await api.post(`/tickets/${ticketId}/comments`, { content })
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', ticketId] })
            queryClient.invalidateQueries({ queryKey: ['ticket-history', ticketId] })
            setNewComment("")
            toast.success("Comment added")
        },
        onError: () => {
            toast.error("Failed to add comment")
        }
    })

    const handleSubmit = () => {
        if (!newComment.trim()) return
        createCommentMutation.mutate(newComment)
    }

    if (isLoading) {
        return (
            <div className="space-y-4 mt-6">
                <h3 className="font-semibold text-sm">Comments</h3>
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 mt-6 pt-6 border-t">
            <h3 className="font-semibold text-sm flex items-center gap-2">
                Comments
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {comments?.length || 0}
                </span>
            </h3>

            <div className="space-y-6">
                {comments?.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        currentUser={currentUser}
                    />
                ))}

                {comments?.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-md">
                        No comments yet. Be the first to share your thoughts!
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-2">
                <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={currentUser?.avatar_url} />
                    <AvatarFallback>{currentUser?.full_name?.[0] || currentUser?.email[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit()
                            }
                        }}
                    />
                    <div className="flex justify-end">
                        <Button
                            disabled={!newComment.trim() || createCommentMutation.isPending}
                            onClick={handleSubmit}
                            size="sm"
                        >
                            {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

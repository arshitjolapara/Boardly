"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MoreHorizontal, Pencil, Trash2, X, Check } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Comment, User } from "./board.types"

interface CommentItemProps {
    comment: Comment
    currentUser: User | null
}

export function CommentItem({ comment, currentUser }: CommentItemProps) {
    const queryClient = useQueryClient()
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(comment.content)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    const isAuthor = currentUser?.id === comment.author_id

    const updateCommentMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await api.put(`/comments/${comment.id}`, { content })
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', comment.ticket_id] })
            queryClient.invalidateQueries({ queryKey: ['ticket-history', comment.ticket_id] })
            setIsEditing(false)
            toast.success("Comment updated")
        },
        onError: () => {
            toast.error("Failed to update comment")
        }
    })

    const deleteCommentMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/comments/${comment.id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', comment.ticket_id] })
            queryClient.invalidateQueries({ queryKey: ['ticket-history', comment.ticket_id] })
            setShowDeleteDialog(false)
            toast.success("Comment deleted")
        },
        onError: () => {
            toast.error("Failed to delete comment")
        }
    })

    const handleSaveEdit = () => {
        if (!editContent.trim()) return
        if (editContent === comment.content) {
            setIsEditing(false)
            return
        }
        updateCommentMutation.mutate(editContent)
    }

    return (
        <div className="flex gap-3 group">
            <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={comment.author.avatar_url} />
                <AvatarFallback>{comment.author.full_name?.[0] || comment.author.email[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{comment.author.full_name || comment.author.email}</span>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.is_edited && (
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">(edited)</span>
                        )}
                    </div>

                    {isAuthor && !isEditing && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setShowDeleteDialog(true)}>
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-2">
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[80px]"
                        />
                        <div className="flex items-center gap-2">
                            <Button size="sm" onClick={handleSaveEdit} disabled={updateCommentMutation.isPending}>
                                {updateCommentMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-foreground/90 whitespace-pre-wrap">
                        {comment.content}
                    </div>
                )}
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCommentMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, GripVertical, X, Check, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BoardSettingsDialogProps {
    boardId: string
    isOpen: boolean
    onClose: () => void
}

interface Column {
    id: string
    name: string
    order: number
}

function SortableColumnItem({ column, onRename, onDelete }: { column: Column, onRename: (id: string, name: string) => void, onDelete: (id: string) => void }) {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(column.name)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const handleSave = () => {
        if (editName.trim() && editName !== column.name) {
            onRename(column.id, editName.trim())
        }
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditName(column.name)
        setIsEditing(false)
    }

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 border rounded-md bg-card">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            {isEditing ? (
                <>
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave()
                            if (e.key === 'Escape') handleCancel()
                        }}
                        className="flex-1"
                        autoFocus
                        onBlur={handleSave}
                    />
                    <Button variant="ghost" size="sm" onClick={handleSave}>
                        <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </>
            ) : (
                <>
                    <span className="flex-1 font-medium">{column.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(column.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </>
            )}
        </div>
    )
}

export function BoardSettingsDialog({ boardId, isOpen, onClose }: BoardSettingsDialogProps) {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState("general")
    const [localColumns, setLocalColumns] = useState<Column[]>([])
    const [columnToDelete, setColumnToDelete] = useState<string | null>(null)
    const [memberToRemove, setMemberToRemove] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Fetch Board Details
    const { data: board, isLoading: isBoardLoading } = useQuery({
        queryKey: ['board', boardId],
        queryFn: async () => {
            const res = await api.get(`/boards/${boardId}`)
            return res.data
        },
        enabled: isOpen
    })

    // Sync local columns when board data changes
    useEffect(() => {
        if (board?.columns) {
            setLocalColumns([...board.columns].sort((a, b) => a.order - b.order))
        }
    }, [board?.columns])

    // Fetch Members
    const { data: members } = useQuery({
        queryKey: ['board', boardId, 'members'],
        queryFn: async () => {
            const res = await api.get(`/boards/${boardId}/members`)
            return res.data
        },
        enabled: isOpen
    })

    const [generalForm, setGeneralForm] = useState({ name: "", description: "" })
    const [newMemberEmail, setNewMemberEmail] = useState("")
    const [newColumnName, setNewColumnName] = useState("")

    const updateBoardMutation = useMutation({
        mutationFn: async (data: { name: string, description: string }) => {
            return await api.put(`/boards/${boardId}`, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
            queryClient.invalidateQueries({ queryKey: ['boards'] })
            toast.success("Board updated")
        },
        onError: () => toast.error("Failed to update board")
    })

    const addMemberMutation = useMutation({
        mutationFn: async (email: string) => {
            return await api.post(`/boards/${boardId}/members`, { email })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId, 'members'] })
            setNewMemberEmail("")
            toast.success("✅ Member added successfully")
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || "Failed to add member"
            if (message.includes("not found")) {
                toast.error("❌ User not found with the given email")
            } else {
                toast.error(`❌ ${message}`)
            }
        }
    })

    const removeMemberMutation = useMutation({
        mutationFn: async (userId: string) => {
            return await api.delete(`/boards/${boardId}/members/${userId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId, 'members'] })
            setMemberToRemove(null)
            toast.error("🚫 Member access removed", {
                description: "User can no longer access this board",
                style: { background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }
            })
        },
        onError: (error: any) => {
            toast.error(`❌ ${error.response?.data?.detail || "Failed to remove member"}`)
        }
    })

    const createColumnMutation = useMutation({
        mutationFn: async (data: { name: string, order: number }) => {
            return await api.post(`/boards/${boardId}/columns`, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
            setNewColumnName("")
            toast.success("✅ Column added successfully")
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || "Failed to add column"
            if (message.includes("already exists")) {
                toast.error("❌ Column with this name already exists")
            } else {
                toast.error(`❌ ${message}`)
            }
        }
    })

    const updateColumnMutation = useMutation({
        mutationFn: async ({ columnId, name, order }: { columnId: string, name: string, order: number }) => {
            return await api.put(`/columns/${columnId}`, { name, order })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
            toast.success("✅ Column updated successfully")
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || "Failed to update column"
            if (message.includes("already exists")) {
                toast.error("❌ Column with this name already exists")
            } else {
                toast.error(`❌ ${message}`)
            }
        }
    })

    const deleteColumnMutation = useMutation({
        mutationFn: async (columnId: string) => {
            return await api.delete(`/columns/${columnId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
            setColumnToDelete(null)
            toast.error("🗑️ Column deleted", {
                description: "The column has been permanently removed",
                style: { background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }
            })
        },
        onError: (error: any) => {
            toast.error(`❌ ${error.response?.data?.detail || "Failed to delete column"}`)
        }
    })

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setLocalColumns((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)
                const newItems = arrayMove(items, oldIndex, newIndex)

                // Update order on backend
                newItems.forEach((col, index) => {
                    if (col.order !== index) {
                        updateColumnMutation.mutate({ columnId: col.id, name: col.name, order: index })
                    }
                })

                return newItems.map((col, index) => ({ ...col, order: index }))
            })
        }
    }

    const handleRenameColumn = (columnId: string, name: string) => {
        const column = localColumns.find(c => c.id === columnId)
        if (column) {
            updateColumnMutation.mutate({ columnId, name, order: column.order })
        }
    }

    const handleDeleteColumn = (columnId: string) => {
        setColumnToDelete(columnId)
    }

    const confirmDeleteColumn = () => {
        if (columnToDelete) {
            deleteColumnMutation.mutate(columnToDelete)
        }
    }

    const handleRemoveMember = (userId: string) => {
        setMemberToRemove(userId)
    }

    const confirmRemoveMember = () => {
        if (memberToRemove) {
            removeMemberMutation.mutate(memberToRemove)
        }
    }

    if (!isOpen) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Board Settings</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="columns">Columns</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general" className="flex-1 overflow-y-auto pt-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Board Name</Label>
                            <Input
                                defaultValue={board?.name}
                                onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
                                placeholder="Board Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                defaultValue={board?.description}
                                onChange={(e) => setGeneralForm({ ...generalForm, description: e.target.value })}
                                placeholder="Description"
                            />
                        </div>
                        <div className="pt-4">
                            <Button onClick={() => {
                                const name = generalForm.name || board?.name
                                const desc = generalForm.description !== "" ? generalForm.description : board?.description
                                updateBoardMutation.mutate({ name, description: desc })
                            }}>
                                Save Changes
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Columns Tab */}
                    <TabsContent value="columns" className="flex-1 overflow-y-auto pt-4 space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="New Column Name"
                                value={newColumnName}
                                onChange={(e) => setNewColumnName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newColumnName.trim()) {
                                        const maxOrder = localColumns.length > 0
                                            ? Math.max(...localColumns.map(c => c.order))
                                            : -1
                                        createColumnMutation.mutate({ name: newColumnName.trim(), order: maxOrder + 1 })
                                    }
                                }}
                            />
                            <Button disabled={!newColumnName.trim()} onClick={() => {
                                const maxOrder = localColumns.length > 0
                                    ? Math.max(...localColumns.map(c => c.order))
                                    : -1
                                createColumnMutation.mutate({ name: newColumnName.trim(), order: maxOrder + 1 })
                            }}>Add</Button>
                        </div>

                        <div className="space-y-2">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={localColumns.map(c => c.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {localColumns.map((col) => (
                                        <SortableColumnItem
                                            key={col.id}
                                            column={col}
                                            onRename={handleRenameColumn}
                                            onDelete={handleDeleteColumn}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    </TabsContent>

                    {/* Members Tab */}
                    <TabsContent value="members" className="flex-1 overflow-y-auto pt-4 space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Invite by email"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newMemberEmail.trim()) {
                                        addMemberMutation.mutate(newMemberEmail.trim())
                                    }
                                }}
                            />
                            <Button disabled={!newMemberEmail.trim()} onClick={() => addMemberMutation.mutate(newMemberEmail.trim())}>Invite</Button>
                        </div>

                        <div className="space-y-2">
                            {members?.map((member: any) => {
                                const isOwner = board?.owner_id === member.id

                                return (
                                    <div key={member.id} className={`flex items-center justify-between p-3 border rounded-md ${isOwner ? 'bg-secondary/20' : 'bg-card'}`}>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={member.avatar_url} />
                                                <AvatarFallback>{member.full_name?.[0] || member.email[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{member.full_name || member.email}</span>
                                                    {isOwner && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                            Owner
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">{member.email}</span>
                                            </div>
                                        </div>

                                        {!isOwner && (
                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                open={columnToDelete !== null}
                onOpenChange={(open) => !open && setColumnToDelete(null)}
                title="Delete Column?"
                description="Are you sure you want to delete this column? All tickets in this column will also be deleted. This action cannot be undone."
                variant="destructive"
                actionLabel="Delete Column"
                onConfirm={confirmDeleteColumn}
            />

            <ConfirmationDialog
                open={memberToRemove !== null}
                onOpenChange={(open) => !open && setMemberToRemove(null)}
                title="Remove Member?"
                description="Are you sure you want to remove this member's access to the board? They will no longer be able to view or edit this board."
                variant="destructive"
                actionLabel="Remove Access"
                onConfirm={confirmRemoveMember}
            />
        </Dialog>
    )
}

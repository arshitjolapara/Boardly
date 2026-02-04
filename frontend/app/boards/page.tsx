"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Layout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { api } from "@/lib/axios"

interface Board {
    id: string
    name: string
    description: string
    created_at: string
}

export default function BoardsPage() {
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newBoardName, setNewBoardName] = useState("")

    const { data: boards, isLoading } = useQuery<Board[]>({
        queryKey: ['boards'],
        queryFn: async () => {
            const res = await api.get("/boards/")
            return res.data
        }
    })

    const createBoardMutation = useMutation({
        mutationFn: async (name: string) => {
            return await api.post("/boards/", { name })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boards'] })
            setIsDialogOpen(false)
            setNewBoardName("")
        }
    })

    const handleCreateBoard = () => {
        if (newBoardName.trim()) {
            createBoardMutation.mutate(newBoardName)
        }
    }

    if (isLoading) return <div className="flex justify-center p-10">Loading boards...</div>

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Your Boards</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Board
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a new board</DialogTitle>
                            <DialogDescription>
                                Add a new board to your workspace.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateBoard} disabled={createBoardMutation.isPending}>
                                {createBoardMutation.isPending ? "Creating..." : "Create Board"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {boards?.map((board) => (
                    <Link href={`/boards/${board.id}`} key={board.id}>
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Layout className="mr-2 h-5 w-5 text-primary" />
                                    {board.name}
                                </CardTitle>
                                <CardDescription>{board.description || "No description"}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <p className="text-xs text-muted-foreground">
                                    Created {new Date(board.created_at).toLocaleDateString()}
                                </p>
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
            </div>

            {boards?.length === 0 && (
                <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">No boards found. Create your first one!</p>
                </div>
            )}
        </div>
    )
}

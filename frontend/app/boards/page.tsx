"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Layout, CheckCircle } from "lucide-react"
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
import { api } from "@/lib/api"
import { ThemeToggle } from "@/components/ThemeToggle"
import { UserProfile } from "@/components/UserProfile"

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
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Your Boards</h1>
                    <p className="text-muted-foreground mt-1">Manage and organize your team workspaces.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex-1 md:flex-none h-11 rounded-full shadow-lg shadow-primary/20">
                                <Plus className="mr-2 h-5 w-5" /> Create Board
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">New Workspace</DialogTitle>
                                <DialogDescription>
                                    Give your board a name to get started.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Board Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Marketing Campaign"
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateBoard} disabled={createBoardMutation.isPending} className="w-full sm:w-auto h-11">
                                    {createBoardMutation.isPending ? "Creating..." : "Create Board"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <div className="hidden sm:flex items-center gap-2 ml-2">
                        <div className="h-8 w-px bg-border mx-1" />
                        <ThemeToggle />
                        <UserProfile />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {boards?.map((board) => (
                    <Link href={`/boards/${board.id}`} key={board.id} className="group">
                        <Card className="hover:border-primary/50 transition-all duration-300 cursor-pointer h-full relative overflow-hidden group-hover:shadow-xl group-hover:-translate-y-1">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center text-xl">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-3 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Layout className="h-5 w-5" />
                                    </div>
                                    <span className="truncate">{board.name}</span>
                                </CardTitle>
                                <CardDescription className="line-clamp-2 mt-2">{board.description || "No description provided for this workspace."}</CardDescription>
                            </CardHeader>
                            <CardFooter className="pt-0 flex justify-between items-center text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" /> Active
                                </span>
                                <span>{new Date(board.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </CardFooter>
                            {/* Decorative accent */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                        </Card>
                    </Link>
                ))}
            </div>

            {boards?.length === 0 && (
                <div className="text-center py-24 bg-muted/20 rounded-2xl border border-dashed flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Layout className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-bold">No boards yet</h3>
                    <p className="text-muted-foreground mt-1 max-w-[250px]">Create your first workspace to start managing tasks.</p>
                    <Button variant="outline" className="mt-6 rounded-full" onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Create First Board
                    </Button>
                </div>
            )}
        </div>
    )
}

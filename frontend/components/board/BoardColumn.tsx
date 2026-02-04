"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Ticket {
    id: string
    title: string
    priority: "low" | "medium" | "high"
}

interface ColumnProps {
    id: string
    title: string
    tickets: Ticket[]
}

export function BoardColumn({ title, tickets }: ColumnProps) {
    return (
        <div className="flex flex-col w-80 shrink-0">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">{title}</h3>
                <Badge variant="secondary" className="rounded-full px-2">
                    {tickets.length}
                </Badge>
            </div>

            <div className="flex flex-col gap-3 min-h-[500px] bg-muted/20 rounded-lg p-2 border border-border/50">
                {tickets.map((ticket) => (
                    <Card key={ticket.id} className="cursor-grab hover:shadow-md transition-shadow">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium">{ticket.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                            <Badge variant={ticket.priority === 'high' ? 'destructive' : 'outline'} className="text-xs scale-90 origin-left">
                                {ticket.priority}
                            </Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

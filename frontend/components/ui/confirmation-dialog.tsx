"use client"

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

interface ConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    actionLabel?: string
    cancelLabel?: string
    variant?: "default" | "destructive"
    onConfirm: () => void
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    actionLabel = "Continue",
    cancelLabel = "Cancel",
    variant = "default",
    onConfirm,
}: ConfirmationDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        variant={variant}
                    >
                        {actionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

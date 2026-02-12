import { AppNavbar } from "@/components/AppNavbar"

export default function BoardsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <AppNavbar />
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    )
}

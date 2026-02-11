export default function BoardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative flex flex-col h-screen overflow-hidden">
            {children}
        </div>
    )
}

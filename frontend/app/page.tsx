"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-6 h-16 flex items-center border-b">
        <div className="font-bold text-2xl bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
          Boardly
        </div>
        <nav className="ml-auto flex gap-4">
          <Link href="/auth/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Sign up</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Manage your projects with <span className="text-primary">clarity</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            A modern, fast, and intuitive issue tracking system for high-performance teams.
            Organize tasks, track progress, and ship faster.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/auth/signup">
              <Button size="lg" className="h-12 px-8 text-lg rounded-full">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full">
                Live Demo
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 w-full max-w-5xl rounded-xl border bg-card p-4 shadow-2xl">
          <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center border border-dashed">
            <p className="text-muted-foreground">Dashboard Preview</p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © 2024 Boardly. Open Source Issue Tracker.
      </footer>
    </div>
  )
}

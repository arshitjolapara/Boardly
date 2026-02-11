"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Layout, CheckCircle, Plus } from "lucide-react"
import { MobileNav } from "@/components/MobileNav"
import { UserProfile } from "@/components/UserProfile"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsLoggedIn(false)
        return
      }

      try {
        // Import api here or at top level. lib/api.ts is既に imported as api in other files
        // Let's use the api instance from @/lib/api
        const { api } = await import("@/lib/api")
        await api.get("/users/me")
        setIsLoggedIn(true)
      } catch (err) {
        setIsLoggedIn(false)
        localStorage.removeItem("token")
      }
    }

    checkAuth()
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl transition-all">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="md:hidden flex items-center mr-2">
              <MobileNav isLoggedIn={isLoggedIn} />
            </div>
            <div className="font-extrabold text-2xl tracking-tighter bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer">
              Boardly
            </div>
          </div>
          <nav className="flex items-center gap-1 sm:gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link href="/boards" className="hidden sm:block">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <UserProfile />
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-sm sm:text-base">Log in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="rounded-full px-5 shadow-lg shadow-primary/20">Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-3 duration-1000">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Beta is now live
            </div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              Ship products <span className="text-primary italic">faster</span> <br className="hidden md:block" /> with visual clarity
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-300">
              Boardly brings your team together in a high-performance environment. Organize tasks,
              track progress with ease, and focus on what matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-450">
              {isLoggedIn ? (
                <Link href="/boards">
                  <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/25">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signup">
                    <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/25">
                      Get Started for Free
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full hover:bg-muted/50">
                      View Demo
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Decorative background blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full" />
        </section>

        {/* Dashboard Preview */}
        <section className="pb-24">
          <div className="container mx-auto px-4">
            <div className="relative mx-auto max-w-5xl group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative rounded-xl border bg-card p-2 shadow-2xl overflow-hidden">
                <div className="aspect-[16/10] sm:aspect-video rounded-lg bg-muted/30 flex flex-col items-center justify-center border border-dashed border-muted-foreground/20">
                  <Layout className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">Interactive Dashboard Interface</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 uppercase tracking-widest">Coming Soon in Full Preview</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything you need to scale</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Built by developers for high-performing teams who care about simplicity and speed.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Kanban Boards", desc: "Drag and drop simplicity. Move tasks from idea to done with zero friction.", icon: Layout },
                { title: "Team Synergy", desc: "Invite your teammates, assign roles, and collaborate in real-time.", icon: Plus },
                { title: "Audit Trails", desc: "Never lose track of a change. Full history for every single ticket.", icon: CheckCircle }
              ].map((feature, i) => (
                <div key={i} className="group p-8 rounded-2xl bg-card border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <div className="font-bold text-xl mb-6">Boardly</div>
          <p className="text-sm text-muted-foreground mb-8 group cursor-default">
            Built with ❤️ using <span className="group-hover:text-primary transition-colors">Next.js & FastAPI</span>
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground mb-8">
            <Link href="#" className="hover:underline">Privacy Policy</Link>
            <Link href="#" className="hover:underline">Terms of Service</Link>
            <Link href="#" className="hover:underline">Contact Us</Link>
          </div>
          <div className="text-xs text-muted-foreground/60">
            © 2024 Boardly. Open Source Issue Tracker.
          </div>
        </div>
      </footer>
    </div>
  )
}

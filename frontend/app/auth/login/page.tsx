"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GoogleLogin } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (localStorage.getItem("token")) {
            router.push("/boards")
        }
    }, [router])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // Need to use URLSearchParams for OAuth2PasswordRequestForm in FastAPI
            const formData = new URLSearchParams()
            formData.append('username', email)
            formData.append('password', password)

            const response = await api.post("/login/access-token", formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })

            localStorage.setItem("token", response.data.access_token)
            router.push("/boards")
        } catch (err: unknown) {
            console.error(err)
            setError("Invalid email or password")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/20">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-primary">Welcome Back</CardTitle>
                    <CardDescription className="text-center">
                        Sign in to access your boards
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>

                    <div className="mt-4 relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-center w-full">
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                if (credentialResponse.credential) {
                                    try {
                                        setLoading(true);
                                        const res = await api.post("/login/google", {
                                            token: credentialResponse.credential
                                        });
                                        localStorage.setItem("token", res.data.access_token);
                                        router.push("/boards");
                                    } catch (err) {
                                        console.error("Google Login Error", err);
                                        setError("Google Login failed");
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            }}
                            onError={() => {
                                console.error('Login Failed');
                                setError("Google Login Failed");
                            }}
                            useOneTap
                            width="100%"
                        />
                    </div>

                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/signup" className="text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

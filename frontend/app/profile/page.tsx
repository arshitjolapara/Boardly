"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { User, UserPreferences, ThemePreference } from "@/components/board/board.types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { ArrowLeft, Save, User as UserIcon, Settings as SettingsIcon, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function ProfilePage() {
    const queryClient = useQueryClient()
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') || 'profile'
    const { setTheme } = useTheme()

    // Fetch User
    const { data: user, isLoading: userLoading } = useQuery<User>({
        queryKey: ['user', 'me'],
        queryFn: async () => {
            const res = await api.get('/users/me')
            return res.data
        }
    })

    // Fetch Preferences
    const { data: prefs, isLoading: prefsLoading } = useQuery<UserPreferences>({
        queryKey: ['user', 'preferences'],
        queryFn: async () => {
            const res = await api.get('/users/me/preferences')
            return res.data
        }
    })

    // Form States
    const [displayName, setDisplayName] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")
    const [timezone, setTimezone] = useState("")

    useEffect(() => {
        if (user) {
            setDisplayName(user.display_name || user.full_name || "")
            setAvatarUrl(user.avatar_url || "")
            setTimezone(user.timezone || "")
        }
    }, [user])

    // Update Profile Mutation
    const updateProfile = useMutation({
        mutationFn: async (data: Partial<User>) => {
            const res = await api.put('/users/me', data)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
            toast.success("Profile updated successfully")
        },
        onError: () => toast.error("Failed to update profile")
    })

    // Update Preferences Mutation
    const updatePrefs = useMutation({
        mutationFn: async (data: Partial<UserPreferences>) => {
            const res = await api.put('/users/me/preferences', data)
            return res.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] })
            // Immediate theme switch
            if (data.theme_preference) {
                setTheme(data.theme_preference)
            }
            toast.success("Preferences saved")
        },
        onError: () => toast.error("Failed to save preferences")
    })

    if (userLoading || prefsLoading) {
        return (
            <div className="container max-w-4xl py-10 space-y-8">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }

    if (!user || !prefs) return null

    const initials = (user.display_name || user.full_name || user.email)[0].toUpperCase()

    return (
        <div className="container max-w-4xl py-10 px-4">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                </div>
            </div>

            <Tabs defaultValue={initialTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="flex items-center gap-2">
                        <SettingsIcon className="h-4 w-4" />
                        Preferences
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Public Profile</CardTitle>
                            <CardDescription>
                                Manage how you appear to others on Boardly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex flex-col items-center gap-4">
                                    <Avatar className="h-24 w-24 border-2">
                                        <AvatarImage src={avatarUrl} />
                                        <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">{user.email}</p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {user.auth_provider} account
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    <div className="space-y-2">
                                        <Label htmlFor="display-name">Display Name</Label>
                                        <Input
                                            id="display-name"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Enter your display name"
                                        />
                                        <p className="text-[10px] text-muted-foreground text-right italic">Previously: {user.full_name}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="avatar-url">Avatar URL</Label>
                                        <Input
                                            id="avatar-url"
                                            value={avatarUrl}
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            placeholder="https://example.com/avatar.png"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Timezone</Label>
                                        <Select value={timezone} onValueChange={setTimezone}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select timezone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="UTC">UTC</SelectItem>
                                                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                                <SelectItem value="Europe/London">London</SelectItem>
                                                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                                                <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4 flex justify-end">
                            <Button
                                onClick={() => updateProfile.mutate({
                                    display_name: displayName,
                                    avatar_url: avatarUrl,
                                    timezone: timezone
                                })}
                                disabled={updateProfile.isPending}
                            >
                                {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Profile
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="preferences">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Preferences</CardTitle>
                            <CardDescription>
                                Customize your experience and notifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <Label>Appearance</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    {['light', 'dark', 'system'].map((t) => (
                                        <div
                                            key={t}
                                            onClick={() => updatePrefs.mutate({ theme_preference: t as ThemePreference })}
                                            className={`
                                                cursor-pointer rounded-md border-2 p-4 text-center transition-all hover:bg-accent
                                                ${prefs.theme_preference === t ? 'border-primary ring-1 ring-primary' : 'border-muted'}
                                            `}
                                        >
                                            <p className="text-sm font-medium capitalize">{t}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <Label>Notifications</Label>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>In-app Notifications</Label>
                                            <p className="text-xs text-muted-foreground">Receive alerts within the application</p>
                                        </div>
                                        <Switch
                                            checked={prefs.in_app_notifications_enabled}
                                            onCheckedChange={(checked: boolean) => updatePrefs.mutate({ in_app_notifications_enabled: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Email Notifications</Label>
                                            <p className="text-xs text-muted-foreground">Receive digest of updates via email</p>
                                        </div>
                                        <Switch
                                            checked={prefs.email_notifications_enabled}
                                            onCheckedChange={(checked: boolean) => updatePrefs.mutate({ email_notifications_enabled: checked })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

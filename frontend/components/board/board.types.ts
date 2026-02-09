export interface User {
    id: string
    email: string
    full_name?: string
    display_name?: string
    avatar_url?: string
    timezone?: string
    auth_provider?: 'email' | 'google'
    updated_at?: string
    preferences?: UserPreferences
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface UserPreferences {
    id: string
    user_id: string
    theme_preference: ThemePreference
    email_notifications_enabled: boolean
    in_app_notifications_enabled: boolean
    created_at: string
    updated_at: string
}

export interface Comment {
    id: string
    ticket_id: string
    author_id: string
    content: string
    created_at: string
    updated_at?: string | null
    is_edited: boolean
    author: User
}

export enum TicketActionType {
    TICKET_CREATED = "TICKET_CREATED",
    TICKET_UPDATED = "TICKET_UPDATED",
    STATUS_CHANGED = "STATUS_CHANGED",
    ASSIGNEE_CHANGED = "ASSIGNEE_CHANGED",
    PRIORITY_CHANGED = "PRIORITY_CHANGED",
    TICKET_DELETED = "TICKET_DELETED",
    COMMENT_ADDED = "COMMENT_ADDED",
    COMMENT_EDITED = "COMMENT_EDITED",
    COMMENT_DELETED = "COMMENT_DELETED",
    WATCHER_ADDED = "WATCHER_ADDED",
    WATCHER_REMOVED = "WATCHER_REMOVED"
}

export interface TicketHistory {
    id: string
    ticket_id: string
    actor_id: string
    action_type: TicketActionType
    field_name?: string
    old_value?: string
    new_value?: string
    created_at: string
    actor: User
}

export interface TicketWatcher {
    id: string
    ticket_id: string
    user_id: string
    added_by: string
    created_at: string
    user: User
}

export interface Ticket {
    id: string
    title: string
    description?: string
    priority: "low" | "medium" | "high" | string
    board_id: string
    status_column_id: string
    assignee_id?: string | null
    assignee?: User
    reporter?: User
    created_at?: string
}

export interface Column {
    id: string
    name: string
    order: number
    tickets: Ticket[]
}

export interface Board {
    id: string
    columns: Column[]
}


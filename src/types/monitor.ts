export interface Monitor {
    id:  string;
    name: string;
    url: string;
    method: "GET" | "POST" | "HEAD";
    interval_seconds: number;
    timeout_ms: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateMonitorInput {
    name:  string;
    url: string;
    method: "GET"| "POST" | "HEAD";
    interval_seconds: number;
    timeout_ms: number;
}

export interface UpdateMonitorInput {
    name?: string;
    url?: string;
    method?: "GET"| "POST" | "HEAD";
    interval_seconds?: number;
    timeout_ms?: number;
    is_active?: boolean;
}
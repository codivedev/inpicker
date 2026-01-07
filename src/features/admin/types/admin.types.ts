// Types pour le panel Admin

export interface AdminStats {
    totals: {
        users: number;
        drawings: number;
        pencils: number;
    };
    userStats: UserWithStats[];
    recentDrawings: DrawingWithUser[];
    weeklyActivity: { date: string; count: number }[];
}

export interface UserWithStats {
    id: string;
    name: string;
    is_admin: boolean;
    created_at: string;
    last_login_at: string | null;
    drawings_count: number;
    pencils_count: number;
}

export interface DrawingWithUser {
    id: number;
    title: string;
    image_r2_key: string | null;
    created_at: string;
    user_id: string;
    user_name: string;
}

export interface CreateUserPayload {
    id: string;
    name: string;
    pin: string;
    isAdmin?: boolean;
}

export interface UpdateUserPayload {
    id: string;
    name?: string;
    pin?: string;
    isAdmin?: boolean;
}

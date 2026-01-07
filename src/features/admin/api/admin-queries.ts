import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cloudflareApi } from '@/lib/cloudflare-api';
import type { AdminStats, UserWithStats, DrawingWithUser, CreateUserPayload, UpdateUserPayload } from '../types/admin.types';

// ========== QUERIES ==========

export function useAdminStats() {
    return useQuery<AdminStats>({
        queryKey: ['admin', 'stats'],
        queryFn: () => cloudflareApi.getAdminStats(),
        retry: false
    });
}

export function useAdminUsers() {
    return useQuery<UserWithStats[]>({
        queryKey: ['admin', 'users'],
        queryFn: () => cloudflareApi.getAdminUsers(),
        retry: false
    });
}

export function useAdminDrawings() {
    return useQuery<DrawingWithUser[]>({
        queryKey: ['admin', 'drawings'],
        queryFn: () => cloudflareApi.getAdminDrawings(),
        retry: false
    });
}

// ========== MUTATIONS ==========

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserPayload) => cloudflareApi.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
        }
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateUserPayload) => cloudflareApi.updateUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
        }
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => cloudflareApi.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
        }
    });
}

export function useDeleteAdminDrawing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => cloudflareApi.deleteAdminDrawing(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
        }
    });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import type { FavoriteColor } from '@/lib/db';

export function useFavorites() {
    const queryClient = useQueryClient();

    // Récupérer tous les favoris
    const { data: favorites = [], isLoading } = useQuery({
        queryKey: ['favorites'],
        queryFn: async () => {
            return db.favorites.toArray();
        },
    });

    // Mutation pour ajouter un favori
    const addFavorite = useMutation({
        mutationFn: async (color: Omit<FavoriteColor, 'createdAt'>) => {
            const newFavorite: FavoriteColor = {
                ...color,
                createdAt: Date.now(),
            };
            await db.favorites.put(newFavorite);
            return newFavorite;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });

    // Mutation pour supprimer un favori
    const removeFavorite = useMutation({
        mutationFn: async (hex: string) => {
            await db.favorites.delete(hex);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });

    const isFavorite = (hex: string) => {
        return favorites.some(f => f.id === hex || f.hex === hex);
    };

    return {
        favorites,
        loading: isLoading,
        addFavorite: addFavorite.mutateAsync,
        removeFavorite: removeFavorite.mutateAsync,
        isFavorite,
    };
}

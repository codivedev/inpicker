import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cloudflareApi } from '@/lib/cloudflare-api';

export interface Drawing {
    id: number;
    title: string;
    image_r2_key: string | null;
    created_at: string;
    pencilIds: string[];
}

export function useDrawings() {
    const queryClient = useQueryClient();

    // Récupérer tous les dessins
    const { data: drawings = [], isLoading } = useQuery({
        queryKey: ['drawings'],
        queryFn: () => cloudflareApi.getDrawings() as Promise<Drawing[]>,
        staleTime: 0,
    });

    // Mutation pour créer un dessin
    const createMutation = useMutation({
        mutationFn: async ({ title, imageFile }: { title: string; imageFile: File | null }) => {
            return cloudflareApi.createDrawing(title, imageFile);
        },
        onSuccess: (newDrawing) => {
            queryClient.setQueryData<Drawing[]>(['drawings'], (old = []) => [newDrawing, ...old]);
            queryClient.invalidateQueries({ queryKey: ['drawings'] });
        }
    });

    // Mutation pour supprimer un dessin
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return cloudflareApi.deleteDrawing(id);
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['drawings'] });
            const previous = queryClient.getQueryData<Drawing[]>(['drawings']);
            queryClient.setQueryData<Drawing[]>(['drawings'], (old = []) =>
                old.filter(d => d.id !== id)
            );
            return { previous };
        },
        onError: (_err, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['drawings'], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['drawings'] });
        }
    });

    // Mutation pour mettre à jour un dessin
    const updateMutation = useMutation({
        mutationFn: async ({ id, title, imageFile }: { id: number; title?: string; imageFile?: File }) => {
            return cloudflareApi.updateDrawing(id, { title, imageFile });
        },
        onSuccess: (_result, variables) => {
            // Mettre à jour le cache
            queryClient.setQueryData<Drawing[]>(['drawings'], (old = []) =>
                old.map(d => d.id === variables.id ? { ...d, title: variables.title || d.title } : d)
            );
            queryClient.invalidateQueries({ queryKey: ['drawing', variables.id] });
        }
    });

    // Mutation pour ajouter un crayon à un dessin
    const addPencilMutation = useMutation({
        mutationFn: async ({ drawingId, pencilId }: { drawingId: number; pencilId: string }) => {
            return cloudflareApi.addPencilToDrawing(drawingId, pencilId);
        },
        onMutate: async ({ drawingId, pencilId }) => {
            await queryClient.cancelQueries({ queryKey: ['drawing', drawingId] });
            await queryClient.cancelQueries({ queryKey: ['drawings'] });

            // Mise à jour optimiste dans la liste
            queryClient.setQueryData<Drawing[]>(['drawings'], (old = []) =>
                old.map(d => d.id === drawingId
                    ? { ...d, pencilIds: [...d.pencilIds, pencilId] }
                    : d
                )
            );

            // Mise à jour optimiste du dessin individuel
            queryClient.setQueryData<Drawing>(['drawing', drawingId], (old) =>
                old ? { ...old, pencilIds: [...old.pencilIds, pencilId] } : old
            );
        },
        onSettled: (_data, _error, { drawingId }) => {
            queryClient.invalidateQueries({ queryKey: ['drawings'] });
            queryClient.invalidateQueries({ queryKey: ['drawing', drawingId] });
        }
    });

    // Mutation pour retirer un crayon d'un dessin
    const removePencilMutation = useMutation({
        mutationFn: async ({ drawingId, pencilId }: { drawingId: number; pencilId: string }) => {
            return cloudflareApi.removePencilFromDrawing(drawingId, pencilId);
        },
        onMutate: async ({ drawingId, pencilId }) => {
            await queryClient.cancelQueries({ queryKey: ['drawing', drawingId] });
            await queryClient.cancelQueries({ queryKey: ['drawings'] });

            // Mise à jour optimiste dans la liste
            queryClient.setQueryData<Drawing[]>(['drawings'], (old = []) =>
                old.map(d => d.id === drawingId
                    ? { ...d, pencilIds: d.pencilIds.filter(p => p !== pencilId) }
                    : d
                )
            );

            // Mise à jour optimiste du dessin individuel
            queryClient.setQueryData<Drawing>(['drawing', drawingId], (old) =>
                old ? { ...old, pencilIds: old.pencilIds.filter(p => p !== pencilId) } : old
            );
        },
        onSettled: (_data, _error, { drawingId }) => {
            queryClient.invalidateQueries({ queryKey: ['drawings'] });
            queryClient.invalidateQueries({ queryKey: ['drawing', drawingId] });
        }
    });

    // Fonctions helper pour une API simple
    const createDrawing = async (title: string, imageFile: File | null = null) => {
        const result = await createMutation.mutateAsync({ title, imageFile });
        return result.id;
    };

    const deleteDrawing = (id: number) => {
        deleteMutation.mutate(id);
    };

    const updateDrawing = (id: number, title?: string, imageFile?: File) => {
        updateMutation.mutate({ id, title, imageFile });
    };

    const addPencilToDrawing = (drawingId: number, pencilId: string) => {
        addPencilMutation.mutate({ drawingId, pencilId });
    };

    const removePencilFromDrawing = (drawingId: number, pencilId: string) => {
        removePencilMutation.mutate({ drawingId, pencilId });
    };

    // Fonction pour mettre à jour l'image (conversion base64 -> File)
    const updateDrawingImage = async (drawingId: number, imageBase64: string) => {
        // Convertir base64 en File
        const response = await fetch(imageBase64);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: blob.type });
        updateMutation.mutate({ id: drawingId, imageFile: file });
    };

    return {
        drawings,
        loading: isLoading,
        createDrawing,
        deleteDrawing,
        updateDrawing,
        addPencilToDrawing,
        removePencilFromDrawing,
        updateDrawingImage
    };
}

// Hook pour un seul dessin
export function useDrawing(drawingId: number) {
    return useQuery({
        queryKey: ['drawing', drawingId],
        queryFn: () => cloudflareApi.getDrawing(drawingId) as Promise<Drawing>,
        enabled: drawingId > 0,
        staleTime: 0,
    });
}

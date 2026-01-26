import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cloudflareApi } from '@/lib/cloudflare-api';
import pencilsData from '@/data/pencils.json';
import type { Pencil, PencilBrand } from '@/types/pencil';

interface InventoryItem {
    id: string;
    brand: string;
    number: string;
    is_owned: number;
}

interface CustomPencilItem {
    id: string;
    brand: string;
    name: string;
    number: string;
    hex: string;
}

export function useInventory() {
    const queryClient = useQueryClient();

    // Récupérer l'inventaire depuis l'API Cloudflare D1
    const { data: inventoryData = [], isLoading: loadingInventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: () => cloudflareApi.getInventory() as Promise<InventoryItem[]>,
        staleTime: 0, // Toujours refetch pour garantir la fraîcheur
    });

    // Récupérer les crayons personnalisés depuis l'API
    const { data: customPencilsData = [], isLoading: loadingCustom } = useQuery({
        queryKey: ['custom-pencils'],
        queryFn: () => cloudflareApi.getCustomPencils() as Promise<CustomPencilItem[]>,
        staleTime: 0,
    });

    // Mutation pour toggle un crayon
    const toggleMutation = useMutation({
        mutationFn: async (pencil: Pencil) => {
            const id = `${pencil.brand}|${pencil.id}`;
            const isCurrentlyOwned = inventoryData.some(
                (item) => item.id === id && item.is_owned === 1
            );

            return cloudflareApi.updatePencil({
                id,
                brand: pencil.brand,
                number: pencil.id,
                isOwned: !isCurrentlyOwned
            });
        },
        onMutate: async (pencil) => {
            // Annuler les requêtes en cours
            await queryClient.cancelQueries({ queryKey: ['inventory'] });

            // Snapshot de l'état précédent
            const previousInventory = queryClient.getQueryData<InventoryItem[]>(['inventory']);

            // Mise à jour optimiste
            const id = `${pencil.brand}|${pencil.id}`;
            const isCurrentlyOwned = previousInventory?.some(
                (item) => item.id === id && item.is_owned === 1
            );

            queryClient.setQueryData<InventoryItem[]>(['inventory'], (old = []) => {
                if (isCurrentlyOwned) {
                    // Retirer de la liste
                    return old.filter(item => item.id !== id);
                } else {
                    // Ajouter à la liste
                    return [...old, { id, brand: pencil.brand, number: pencil.id, is_owned: 1 }];
                }
            });

            return { previousInventory };
        },
        onError: (_err, _pencil, context) => {
            // Rollback en cas d'erreur
            if (context?.previousInventory) {
                queryClient.setQueryData(['inventory'], context.previousInventory);
            }
        },
        onSettled: () => {
            // Refetch pour s'assurer de la cohérence
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        }
    });

    // Mutation pour ajouter un crayon personnalisé
    const addCustomMutation = useMutation({
        mutationFn: async ({ brand, name, number, hex }: { brand: string; name: string; number: string; hex: string }) => {
            return cloudflareApi.createCustomPencil(brand, name, number, hex);
        },
        onSuccess: () => {
            // Rafraîchir les deux listes
            queryClient.invalidateQueries({ queryKey: ['custom-pencils'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        }
    });

    const togglePencil = (pencil: Pencil) => {
        toggleMutation.mutate(pencil);
    };

    const addCustomPencil = async (brand: string, name: string, number: string, hex: string) => {
        await addCustomMutation.mutateAsync({ brand, name, number, hex });
    };

    const isOwned = (pencil: Pencil): boolean => {
        const id = `${pencil.brand}|${pencil.id}`;
        return inventoryData.some((item) => item.id === id && item.is_owned === 1);
    };

    // Convertir les crayons personnalisés en format Pencil
    const customPencils: Pencil[] = customPencilsData.map((cp) => {
        // Conversion Hex -> RGB
        const r = parseInt(cp.hex.slice(1, 3), 16);
        const g = parseInt(cp.hex.slice(3, 5), 16);
        const b = parseInt(cp.hex.slice(5, 7), 16);

        return {
            id: cp.number,
            name: cp.name,
            brand: cp.brand as PencilBrand,
            hex: cp.hex,
            rgb: { r, g, b }
        };
    });

    // Fusionner les catalogues (Statique + Custom) et trier par ID naturellement
    const allPencils = [...(pencilsData as Pencil[]), ...customPencils].sort((a, b) => {
        return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Grouper les données par marque
    const pencilsByBrand = allPencils.reduce((acc, pencil) => {
        if (!acc[pencil.brand]) acc[pencil.brand] = [];
        acc[pencil.brand].push(pencil);
        return acc;
    }, {} as Record<string, Pencil[]>);

    // Calculer le nombre de crayons possédés
    const ownedCount = inventoryData.filter(item => item.is_owned === 1).length;

    return {
        loading: loadingInventory || loadingCustom,
        pencilsByBrand,
        ownedPencils: inventoryData,
        togglePencil,
        addCustomPencil,
        isOwned,
        ownedCount,
        totalCount: allPencils.length
    };
}

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import pencilsData from '@/data/pencils.json';
import type { Pencil } from '@/types/pencil';
import { useLiveQuery } from 'dexie-react-hooks';

export function useInventory() {
    const [loading, setLoading] = useState(true);

    // Sync initial: Si DB vide, on l'initialise avec tout "non possédé" ?
    // Ou on ne stocke que les "possédés" ?
    // Mieux : Stocker l'état "isOwned" pour chaque crayon combiné au JSON statique.

    // Pour la performance et la simplicité : 
    // On lit le JSON statique (source de vérité pour les données techniques).
    // On lit la DB (source de vérité pour "isOwned").
    // On merge les deux.

    useEffect(() => {
        const initDb = async () => {
            const count = await db.pencils.count();
            if (count === 0) {
                // Optionnel : ne rien faire, par défaut isOwned = false.
                // Si on veut pré-cocher des choses, c'est ici.
            }
            setLoading(false);
        };
        initDb();
    }, []);

    // Récupérer les crayons personnalisés
    const customPencilsDefinition = useLiveQuery(() => db.customPencils.toArray(), []) || [];

    // Récupérer tous les crayons possédés de la DB
    const ownedPencils = useLiveQuery(() => db.pencils.toArray(), []);

    const togglePencil = async (pencil: Pencil) => {
        const id = `${pencil.brand}|${pencil.id}`;
        const existing = await db.pencils.get(id);

        if (existing) {
            await db.pencils.delete(id);
        } else {
            await db.pencils.add({
                id,
                brand: pencil.brand,
                number: pencil.id,
                isOwned: true
            });
        }
    };

    const addCustomPencil = async (brand: string, name: string, number: string, hex: string) => {
        const id = `${brand}|${number}`;

        // 1. Ajouter la définition
        // Note: On pourrait utiliser une fonction utilitaire pour hexToRgb ici si on l'avait importée
        // Pour l'instant on fait une conversion simple ou on importe la lib si nécessaire.
        // On va supposer que hex est valide.

        // Conversion rapide Hex -> RGB
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        await db.customPencils.put({
            id,
            brand,
            name,
            number,
            hex,
            rgb: { r, g, b }
        });

        // 2. Marquer comme possédé automatiquement
        await db.pencils.put({
            id,
            brand,
            number,
            isOwned: true
        });
    };

    const isOwned = (pencil: Pencil) => {
        if (!ownedPencils) return false;
        return ownedPencils.some(p => p.id === `${pencil.brand}|${pencil.id}`);
    };

    // Fusionner les catalogues (Statique + Custom)
    const allPencils = [...(pencilsData as Pencil[]), ...(customPencilsDefinition as unknown as Pencil[])];

    // Grouper les données par marque
    const pencilsByBrand = allPencils.reduce((acc, pencil) => {
        if (!acc[pencil.brand]) acc[pencil.brand] = [];
        acc[pencil.brand].push(pencil);
        return acc;
    }, {} as Record<string, Pencil[]>);

    return {
        loading,
        pencilsByBrand,
        ownedPencils,
        togglePencil,
        addCustomPencil,
        isOwned,
        ownedCount: ownedPencils?.length || 0,
        totalCount: allPencils.length
    };
}

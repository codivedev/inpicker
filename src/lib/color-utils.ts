import {
    differenceCiede2000,
    parse,
    type Rgb
} from 'culori';
import type { Pencil, PencilBrand } from '@/types/pencil';
import pencilsData from '@/data/pencils.json';

// Fonction de distance Delta E 2000 (standard de l'industrie)
const deltaE = differenceCiede2000();

// Types de retour
export interface MatchResult {
    pencil: Pencil;
    distance: number; // Delta E (0 = identique, > 100 = très différent)
    confidence: number; // 0-100%
    isOwned?: boolean;
}

/**
 * Convertit une couleur Hex en RGB object
 */
export function hexToRgb(hex: string): { r: number, g: number, b: number } {
    const c = parse(hex) as Rgb;
    if (!c) return { r: 0, g: 0, b: 0 };
    return {
        r: Math.round((c.r || 0) * 255),
        g: Math.round((c.g || 0) * 255),
        b: Math.round((c.b || 0) * 255)
    };
}

/**
 * Trouve les N meilleurs matches pour une couleur donnée
 */
export function findTopMatches(
    targetHex: string,
    limit: number = 5,
    options: {
        allowedBrands?: PencilBrand[],
        ownedPencilsIds?: string[],
        prioritizeOwned?: boolean,
        allPencils?: Pencil[]
    } = {}
): MatchResult[] {
    const targetColor = parse(targetHex);
    if (!targetColor) return [];

    const { allowedBrands, ownedPencilsIds, prioritizeOwned, allPencils } = options;

    // 1. Obtenir tous les candidats possibles
    const candidates = allPencils || (pencilsData as Pencil[]);
    const allCandidates = candidates.filter(p => {
        if (allowedBrands && allowedBrands.length > 0 && !allowedBrands.includes(p.brand)) {
            return false;
        }
        return true;
    });

    // 2. Calculer les distances pour tous
    const allResults: MatchResult[] = allCandidates.map(pencil => {
        const pencilColor = parse(pencil.hex);
        const distance = pencilColor ? deltaE(targetColor, pencilColor) : Infinity;
        const id = getPencilId(pencil);
        return {
            pencil,
            distance,
            confidence: calculateConfidence(distance),
            isOwned: ownedPencilsIds ? ownedPencilsIds.includes(id) : false
        };
    });

    // 3. Trier par distance
    allResults.sort((a, b) => a.distance - b.distance);

    // 4. Priorisation de la collection
    if (prioritizeOwned && ownedPencilsIds && ownedPencilsIds.length > 0) {
        const ownedResults = allResults.filter(r => r.isOwned);
        const bestOwned = ownedResults[0];
        const absoluteBest = allResults[0];

        // Seuil d'acceptabilité pour un crayon possédé (Delta E < 10)
        // Si le meilleur possédé est "correct", on le met en premier
        if (bestOwned && bestOwned !== absoluteBest && bestOwned.distance < 10) {
            const others = allResults.filter(r => r !== bestOwned);
            return [bestOwned, ...others].slice(0, limit);
        }
    }

    return allResults.slice(0, limit);
}

/**
 * Trouve le crayon le plus proche dans une liste donnée (ou tous les crayons)
 */
export function findBestMatch(
    targetHex: string,
    allowedBrands?: PencilBrand[],
    ownedPencilsIds?: string[]
): MatchResult | null {
    const matches = findTopMatches(targetHex, 1, { allowedBrands, ownedPencilsIds });
    return matches.length > 0 ? matches[0] : null;
}

/**
 * Calcule un pourcentage de confiance basé sur le Delta E
 * Delta E < 1.0 : Indiscernable (100%)
 * Delta E < 2.0 : Très bon (95-99%)
 * Delta E > 10.0 : Mauvais (< 50%)
 */
function calculateConfidence(deltaE: number): number {
    if (deltaE <= 1.0) return 99; // Ne jamais dire 100% sauf mathématique pure
    if (deltaE >= 20) return 10;

    // Formule empirique simple
    // 1 -> 99
    // 5 -> 80
    // 10 -> 50
    // 20 -> 10
    return Math.max(10, Math.round(100 - (deltaE * 4.5)));
}

/**
 * Retourne l'ID unique (Brand-ID)
 */
export function getPencilId(p: Pencil): string {
    return `${p.brand}-${p.id}`;
}

export function getAllPencils(): Pencil[] {
    return pencilsData as Pencil[];
}

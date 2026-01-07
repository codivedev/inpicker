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
}

/**
 * Convertit une couleur Hex en RGB object
 */
export function hexToRgb(hex: string): { r: number, g: number, b: number } {
    const c = parse(hex) as Rgb;
    return {
        r: Math.round(c.r * 255),
        g: Math.round(c.g * 255),
        b: Math.round(c.b * 255)
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
        ownedPencilsIds?: string[]
    } = {}
): MatchResult[] {
    const targetColor = parse(targetHex);
    if (!targetColor) return [];

    const { allowedBrands, ownedPencilsIds } = options;

    // Filtrer les candidats
    const candidates = (pencilsData as Pencil[]).filter(p => {
        if (allowedBrands && allowedBrands.length > 0 && !allowedBrands.includes(p.brand)) {
            return false;
        }
        if (ownedPencilsIds && !ownedPencilsIds.includes(getPencilId(p))) {
            return false;
        }
        return true;
    });

    // Calculer les distances
    const results: MatchResult[] = candidates.map(pencil => {
        const pencilColor = parse(pencil.hex);
        const distance = pencilColor ? deltaE(targetColor, pencilColor) : Infinity;
        return {
            pencil,
            distance,
            confidence: calculateConfidence(distance)
        };
    });

    // Trier par distance et limiter
    return results
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
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
 * Retourne l'ID unique (Brand|ID)
 */
export function getPencilId(p: Pencil): string {
    return `${p.brand}|${p.id}`;
}

export function getAllPencils(): Pencil[] {
    return pencilsData as Pencil[];
}

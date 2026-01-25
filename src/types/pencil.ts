export type PencilBrand =
    | 'Faber-Castell Polychromos'
    | "Caran d'Ache Luminance"
    | "Caran d'Ache Pablo"
    | 'Derwent Coloursoft'
    | 'BRUTFUNER';

export interface Pencil {
    id: string; // ex: "PC938", "101"
    brand: PencilBrand;
    name: string; // ex: "White"
    rgb: {
        r: number;
        g: number;
        b: number;
    };
    hex: string; // ex: "#FFFFFF"
}

export interface UserInventory {
    ownedPencils: string[]; // liste des IDs (ou composite brand+id car ID peut collisionner ?)
    // Mieux vaut composite : "Brand:ID"
}

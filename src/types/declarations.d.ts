declare module 'culori' {
    export function converter(mode: string): (color: any) => any;
    export function differenceCiede2000(kL?: number, kC?: number, kH?: number): (c1: any, c2: any) => number;
    export function parse(color: string): any;
    // Ajouter d'autres définitions si nécessaire
    export type Color = any;
    export type Hsl = any;
    export type Rgb = { r: number; g: number; b: number; mode: 'rgb' };
    export function formatHex(color: any): string;
}

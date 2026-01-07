import Dexie, { type Table } from 'dexie';

export interface UserPencil {
    id: string; // Composite key: "Brand|Number" (ex: "Prismacolor Premier|PC901")
    brand: string;
    number: string;
    isOwned: boolean;
}

export interface AppSettings {
    id: string; // 'user_settings'
    theme: 'light' | 'dark' | 'system';
    language: string;
}

export interface LoginAttempt {
    id: number; // timestamp
    ip: string; // 'local' pour client-side
    success: boolean;
}

export interface CustomPencil {
    id: string; // brand|number
    brand: string;
    name: string;
    number: string;
    hex: string;
    rgb: { r: number; g: number; b: number };
}

export interface Drawing {
    id: number; // timestamp
    title: string;
    imageBase64: string | null;
    pencilIds: string[]; // List of used pencils
    createdAt: number;
}

class InpickerDatabase extends Dexie {
    pencils!: Table<UserPencil>;
    customPencils!: Table<CustomPencil>;
    settings!: Table<AppSettings>;
    loginAttempts!: Table<LoginAttempt>;
    drawings!: Table<Drawing>;

    constructor() {
        super('InpickerDB');
        this.version(1).stores({
            pencils: 'id, brand, isOwned',
            settings: 'id',
            loginAttempts: 'id, success'
        });

        // Version 2: Ajout des crayons personnalisés
        this.version(2).stores({
            customPencils: 'id, brand'
        });

        // Version 3: Mes Dessins
        this.version(3).stores({
            drawings: 'id, title, createdAt'
        });
    }
}

export const db = new InpickerDatabase();

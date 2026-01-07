export const cloudflareApi = {
    // ========== AUTH ==========
    async verifyPin(pin: string): Promise<boolean> {
        const res = await fetch('/api/auth/verify-pin', {
            method: 'POST',
            body: JSON.stringify({ pin }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // Important pour les cookies
        });
        return res.ok;
    },

    // ========== INVENTORY ==========
    async getInventory() {
        const res = await fetch('/api/inventory', {
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la récupération de l\'inventaire');
        return res.json();
    },

    async updatePencil(pencil: { id: string, brand: string, number: string, isOwned: boolean }) {
        const res = await fetch('/api/inventory', {
            method: 'POST',
            body: JSON.stringify(pencil),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la mise à jour');
        return res.json();
    },

    // ========== CUSTOM PENCILS ==========
    async getCustomPencils() {
        const res = await fetch('/api/custom-pencils', {
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la récupération des crayons personnalisés');
        return res.json();
    },

    async createCustomPencil(brand: string, name: string, number: string, hex: string) {
        const res = await fetch('/api/custom-pencils', {
            method: 'POST',
            body: JSON.stringify({ brand, name, number, hex }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la création du crayon');
        return res.json();
    },

    // ========== DRAWINGS ==========
    async getDrawings() {
        const res = await fetch('/api/drawings', {
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la récupération des dessins');
        return res.json();
    },

    async createDrawing(title: string, imageFile: File | null) {
        const formData = new FormData();
        formData.append('title', title);
        if (imageFile) formData.append('image', imageFile);

        const res = await fetch('/api/drawings', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la création du dessin');
        return res.json();
    },

    async deleteDrawing(id: number) {
        const res = await fetch(`/api/drawings?id=${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la suppression');
        return res.json();
    },

    // ========== IMAGES (R2) ==========
    async uploadImage(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de l\'upload');
        return res.json(); // { key, url }
    },

    getImageUrl(key: string): string {
        return `/api/images/${key}`;
    }
};


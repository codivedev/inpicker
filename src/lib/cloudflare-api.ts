// Utilisateurs pour le mode développement local (même config que functions/api/auth/verify-pin.ts)
const LOCAL_USERS: Record<string, { pin: string; name: string; isAdmin?: boolean }> = {
    "yaelle": { pin: "141116", name: "Yaëlle" },
    "renaud": { pin: "246809", name: "Renaud", isAdmin: true },
};

export const cloudflareApi = {
    // ========== AUTH ==========
    async verifyPin(pin: string): Promise<{ id: string, name: string, isAdmin?: boolean } | null> {
        try {
            const res = await fetch('/api/auth/verify-pin', {
                method: 'POST',
                body: JSON.stringify({ pin }),
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                return data.user;
            }

            // Si 401, le PIN est invalide
            if (res.status === 401) {
                return null;
            }

            // Autre erreur → fallback local
            throw new Error('API non disponible');
        } catch {
            // Fallback local pour le développement
            console.warn('[DEV] API non disponible, utilisation du fallback local');
            const userEntry = Object.entries(LOCAL_USERS).find(([, user]) => user.pin === pin);

            if (userEntry) {
                const [userId, user] = userEntry;
                return { id: userId, name: user.name, isAdmin: user.isAdmin };
            }
            return null;
        }
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

    async updateCustomPencil(oldId: string, data: { brand: string, name: string, number: string, hex: string }) {
        const res = await fetch('/api/custom-pencils', {
            method: 'PUT',
            body: JSON.stringify({ oldId, ...data }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la modification du crayon');
        return res.json();
    },

    async deleteCustomPencil(id: string) {
        const res = await fetch(`/api/custom-pencils?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la suppression du crayon');
        return res.json();
    },

    // ========== BRANDS ==========
    async getCustomBrands() {
        const res = await fetch('/api/brands', {
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la récupération des marques');
        return res.json();
    },

    async createCustomBrand(name: string) {
        const res = await fetch('/api/brands', {
            method: 'POST',
            body: JSON.stringify({ name }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la création de la marque');
        return res.json();
    },

    async deleteCustomBrand(id: string) {
        const res = await fetch(`/api/brands?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la suppression de la marque');
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

    async getDrawing(id: number) {
        const res = await fetch(`/api/drawings?id=${id}`, {
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la récupération du dessin');
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

    async updateDrawing(id: number, data: { title?: string; imageFile?: File }) {
        const formData = new FormData();
        formData.append('id', id.toString());
        if (data.title) formData.append('title', data.title);
        if (data.imageFile) formData.append('image', data.imageFile);

        const res = await fetch('/api/drawings', {
            method: 'PUT',
            body: formData,
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la mise à jour');
        return res.json();
    },

    async addPencilToDrawing(drawingId: number, pencilId: string) {
        const res = await fetch('/api/drawings-pencils', {
            method: 'POST',
            body: JSON.stringify({ drawingId, pencilId }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de l\'ajout du crayon');
        return res.json();
    },

    async removePencilFromDrawing(drawingId: number, pencilId: string) {
        const res = await fetch(`/api/drawings-pencils?drawingId=${drawingId}&pencilId=${encodeURIComponent(pencilId)}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors du retrait du crayon');
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
    },

    // ========== ADMIN ==========
    async getAdminStats() {
        const res = await fetch('/api/admin/stats', {
            credentials: 'include'
        });
        if (!res.ok) {
            if (res.status === 401) throw new Error('Session expirée');
            if (res.status === 403) throw new Error('Accès refusé');

            let errorMessage = `Erreur serveur (${res.status})`;
            try {
                const errorData = await res.json();
                if (errorData && errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                // Ignore json parse error
            }
            throw new Error(errorMessage);
        }
        return res.json();
    },

    async getAdminUsers() {
        const res = await fetch('/api/admin/users', {
            credentials: 'include'
        });
        if (!res.ok) {
            if (res.status === 401) throw new Error('Session expirée');
            if (res.status === 403) throw new Error('Accès refusé');

            let errorMessage = `Erreur serveur (${res.status})`;
            try {
                const errorData = await res.json();
                if (errorData && errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                // Ignore json parse error
            }
            throw new Error(errorMessage);
        }
        return res.json();
    },

    async createUser(data: { id: string, name: string, pin: string, isAdmin?: boolean }) {
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Erreur lors de la création');
        }
        return res.json();
    },

    async updateUser(data: { id: string, name?: string, pin?: string, isAdmin?: boolean }) {
        const res = await fetch('/api/admin/users', {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Erreur lors de la modification');
        }
        return res.json();
    },

    async deleteUser(id: string) {
        const res = await fetch(`/api/admin/users?id=${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Erreur lors de la suppression');
        }
        return res.json();
    },

    async getAdminDrawings() {
        const res = await fetch('/api/admin/drawings', {
            credentials: 'include'
        });
        if (!res.ok) {
            if (res.status === 403) throw new Error('Accès refusé');
            throw new Error('Erreur lors de la récupération des dessins');
        }
        return res.json();
    },

    async deleteAdminDrawing(id: number) {
        const res = await fetch(`/api/admin/drawings?id=${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Erreur lors de la suppression');
        return res.json();
    }
};

export const cloudflareApi = {
    // Inventaire (D1)
    async getInventory() {
        const res = await fetch('/api/inventory');
        return res.json();
    },

    async updatePencil(pencil: { id: string, brand: string, number: string, isOwned: boolean, userId: string }) {
        return fetch('/api/inventory', {
            method: 'POST',
            body: JSON.stringify(pencil),
            headers: { 'Content-Type': 'application/json' }
        });
    },

    // Stockage (R2)
    async uploadImage(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        return res.json(); // { key, url }
    }
};

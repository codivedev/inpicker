import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export function useDrawings() {
    const drawings = useLiveQuery(() => db.drawings.orderBy('createdAt').reverse().toArray(), []);

    const createDrawing = async (title: string, imageBase64: string | null = null) => {
        const id = Date.now();
        await db.drawings.add({
            id,
            title,
            imageBase64,
            pencilIds: [],
            createdAt: id
        });
        return id;
    };

    const deleteDrawing = async (id: number) => {
        await db.drawings.delete(id);
    };

    const addPencilToDrawing = async (drawingId: number, pencilId: string) => {
        const drawing = await db.drawings.get(drawingId);
        if (drawing && !drawing.pencilIds.includes(pencilId)) {
            await db.drawings.update(drawingId, {
                pencilIds: [...drawing.pencilIds, pencilId]
            });
        }
    };

    const removePencilFromDrawing = async (drawingId: number, pencilId: string) => {
        const drawing = await db.drawings.get(drawingId);
        if (drawing) {
            await db.drawings.update(drawingId, {
                pencilIds: drawing.pencilIds.filter(id => id !== pencilId)
            });
        }
    };

    const updateDrawingImage = async (drawingId: number, imageBase64: string) => {
        await db.drawings.update(drawingId, { imageBase64 });
    };

    return {
        drawings,
        createDrawing,
        deleteDrawing,
        addPencilToDrawing,
        removePencilFromDrawing,
        updateDrawingImage
    };
}

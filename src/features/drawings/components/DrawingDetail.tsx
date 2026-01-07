import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Pencil, Camera, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDrawings } from '../hooks/useDrawings';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import pencilsData from '@/data/pencils.json';
import { PencilPicker } from './PencilPicker';

export function DrawingDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const drawingId = parseInt(id || '0', 10);

    const { deleteDrawing, removePencilFromDrawing, updateDrawingImage, addPencilToDrawing } = useDrawings();
    const drawing = useLiveQuery(() => db.drawings.get(drawingId), [drawingId]);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPencilPicker, setShowPencilPicker] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    if (!drawing) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Dessin introuvable</p>
                    <button
                        onClick={() => navigate('/mes-dessins')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl"
                    >
                        Retour aux dessins
                    </button>
                </div>
            </div>
        );
    }

    // Récupérer les infos des crayons associés (supporte les deux formats: brand-id et brand|id)
    const pencilsInDrawing = drawing.pencilIds.map(pencilId => {
        // Essayer d'abord avec le tiret (nouveau format)
        let lastSepIndex = pencilId.lastIndexOf('-');

        // Si pas de tiret, essayer avec pipe (ancien format)
        if (lastSepIndex === -1) {
            lastSepIndex = pencilId.lastIndexOf('|');
        }

        if (lastSepIndex === -1) return null;

        const brand = pencilId.substring(0, lastSepIndex);
        const number = pencilId.substring(lastSepIndex + 1);
        return pencilsData.find(p => p.brand === brand && p.id === number);
    }).filter(Boolean);

    const handleDelete = async () => {
        await deleteDrawing(drawingId);
        navigate('/mes-dessins');
    };

    const handleRemovePencil = async (pencilId: string) => {
        await removePencilFromDrawing(drawingId, pencilId);
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            if (ev.target?.result) {
                await updateDrawingImage(drawingId, ev.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleTitleSave = async () => {
        if (editedTitle.trim()) {
            await db.drawings.update(drawingId, { title: editedTitle.trim() });
        }
        setIsEditingTitle(false);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
                <button
                    onClick={() => navigate('/mes-dessins')}
                    className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>

                {isEditingTitle ? (
                    <input
                        autoFocus
                        value={editedTitle}
                        onChange={e => setEditedTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
                        className="text-lg font-bold bg-transparent border-b-2 border-primary outline-none text-center"
                    />
                ) : (
                    <h1
                        className="text-lg font-bold cursor-pointer hover:text-primary transition-colors"
                        onClick={() => {
                            setEditedTitle(drawing.title);
                            setIsEditingTitle(true);
                        }}
                    >
                        {drawing.title}
                    </h1>
                )}

                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 -mr-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Image de référence */}
            <div className="p-4">
                <label className="relative aspect-video rounded-2xl bg-secondary/30 border border-dashed border-border overflow-hidden flex items-center justify-center cursor-pointer group">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />

                    {drawing.imageBase64 ? (
                        <>
                            <img
                                src={drawing.imageBase64}
                                alt={drawing.title}
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera size={32} className="text-white" />
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Toucher pour ajouter une image</p>
                        </div>
                    )}
                </label>
            </div>

            {/* Liste des crayons */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">
                        Crayons ({pencilsInDrawing.length})
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowPencilPicker(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-xl text-sm font-medium transition-colors"
                            title="Rechercher un crayon"
                        >
                            <Search size={16} />
                            Manuel
                        </button>
                        <button
                            onClick={() => navigate('/scanner-couleur', {
                                state: {
                                    drawingId,
                                    initialImage: drawing.imageBase64
                                }
                            })}
                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                        >
                            <Plus size={16} />
                            Scanner
                        </button>
                    </div>
                </div>

                {pencilsInDrawing.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <Pencil size={48} className="mx-auto mb-3 opacity-50" />
                        <p>Aucun crayon dans ce projet.</p>
                        <p className="text-sm">Utilisez le scanner de couleur pour ajouter des crayons.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {drawing.pencilIds.map((storedPencilId, index) => {
                            const pencil = pencilsInDrawing[index];
                            if (!pencil) return null;
                            return (
                                <motion.div
                                    key={storedPencilId}
                                    layout
                                    className="flex items-center gap-3 p-3 bg-card border rounded-xl"
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg border shadow-sm"
                                        style={{ backgroundColor: pencil.hex }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate">{pencil.name}</h4>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {pencil.brand} • {pencil.id}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRemovePencil(storedPencilId)}
                                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de confirmation de suppression */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteConfirm(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl border"
                        >
                            <h3 className="text-xl font-bold mb-2 text-red-500">Supprimer ce dessin ?</h3>
                            <p className="text-muted-foreground mb-6">
                                Cette action est irréversible. Le dessin "{drawing.title}" sera définitivement supprimé.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-3 rounded-xl font-medium hover:bg-secondary transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal sélection de crayon */}
            <PencilPicker
                isOpen={showPencilPicker}
                onClose={() => setShowPencilPicker(false)}
                onSelect={async (pencilId) => {
                    await addPencilToDrawing(drawingId, pencilId);
                    setShowPencilPicker(false);
                }}
                excludedPencilIds={drawing.pencilIds}
            />
        </div>
    );
}

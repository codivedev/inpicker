import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Image as ImageIcon, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDrawings } from '../hooks/useDrawings';
import { cloudflareApi } from '@/lib/cloudflare-api';
import { useState } from 'react';

interface SelectedDrawing {
    id: number;
    title: string;
    imageUrl: string;
}

export function DrawingsManager() {
    const navigate = useNavigate();
    const { drawings, createDrawing } = useDrawings();
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [selectedDrawing, setSelectedDrawing] = useState<SelectedDrawing | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle) return;

        await createDrawing(newTitle);
        setNewTitle('');
        setIsCreating(false);
    };

    const handleThumbnailClick = (drawing: typeof drawings[0]) => {
        if (drawing.image_r2_key) {
            setSelectedDrawing({
                id: drawing.id,
                title: drawing.title,
                imageUrl: cloudflareApi.getImageUrl(drawing.image_r2_key)
            });
        } else {
            // Pas d'image, naviguer directement vers les détails
            navigate(`/dessins/${drawing.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 relative">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
                <button
                    onClick={() => navigate('/tableau-de-bord')}
                    className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold">Mes Dessins</h1>
                <div className="w-8" />
            </div>

            {/* Empty State */}
            {drawings && drawings.length === 0 && (
                <div className="flex flex-col items-center justify-center p-10 text-center opacity-50 mt-20">
                    <ImageIcon size={64} className="mb-4 text-muted-foreground" />
                    <p>Aucun dessin pour le moment.</p>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                {drawings?.map(drawing => (
                    <motion.div
                        key={drawing.id}
                        layoutId={`drawing-${drawing.id}`}
                        onClick={() => handleThumbnailClick(drawing)}
                        className="aspect-square rounded-xl bg-secondary/30 border border-border overflow-hidden relative group cursor-pointer"
                    >
                        {drawing.image_r2_key ? (
                            <img
                                src={cloudflareApi.getImageUrl(drawing.image_r2_key)}
                                alt={drawing.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-secondary">
                                <ImageIcon className="text-muted-foreground/50" />
                            </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent pt-6">
                            <h3 className="text-white font-medium truncate text-sm">{drawing.title}</h3>
                            <p className="text-white/60 text-xs">{drawing.pencilIds.length} crayon{drawing.pencilIds.length !== 1 ? 's' : ''}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* FAB */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreating(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-40"
            >
                <Plus size={28} />
            </motion.button>

            {/* Modal Création */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreating(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl border"
                        >
                            <h3 className="text-xl font-bold mb-4">Nouveau Projet</h3>
                            <form onSubmit={handleCreate}>
                                <input
                                    autoFocus
                                    placeholder="Titre du dessin..."
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className="w-full p-4 rounded-xl bg-secondary/50 border-none outline-none focus:ring-2 focus:ring-primary/50 text-lg mb-6"
                                />
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 py-3 rounded-xl font-medium hover:bg-secondary transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                                    >
                                        Créer
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Visualisation Image */}
            <AnimatePresence>
                {selectedDrawing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDrawing(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />

                        {/* Boutons en haut */}
                        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
                            <button
                                onClick={() => setSelectedDrawing(null)}
                                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedDrawing(null);
                                    navigate(`/dessins/${selectedDrawing.id}`);
                                }}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
                            >
                                <ExternalLink size={18} />
                                Détails
                            </button>
                        </div>

                        {/* Image en qualité réelle */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative z-10 max-w-[90vw] max-h-[80vh] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <img
                                src={selectedDrawing.imageUrl}
                                alt={selectedDrawing.title}
                                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                            />
                        </motion.div>

                        {/* Titre en bas */}
                        <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                            <h3 className="text-white text-xl font-bold drop-shadow-lg">{selectedDrawing.title}</h3>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


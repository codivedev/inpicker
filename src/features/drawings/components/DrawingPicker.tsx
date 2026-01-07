import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Image as ImageIcon, Check } from 'lucide-react';
import { useDrawings } from '@/features/drawings/hooks/useDrawings';

interface DrawingPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (drawingId: number) => void;
    pencilId: string;
}

export function DrawingPicker({ isOpen, onClose, onSelect, pencilId }: DrawingPickerProps) {
    const { drawings, createDrawing, addPencilToDrawing } = useDrawings();
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    const handleSelect = async (drawingId: number) => {
        await addPencilToDrawing(drawingId, pencilId);
        onSelect(drawingId);
        onClose();
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        const newId = await createDrawing(newTitle.trim());
        await addPencilToDrawing(newId, pencilId);
        setNewTitle('');
        setIsCreating(false);
        onSelect(newId);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-card w-full max-w-lg rounded-t-3xl p-6 relative z-10 shadow-2xl border-t max-h-[70vh] overflow-hidden flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Ajouter à un dessin</h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-secondary rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Bouton créer nouveau */}
                        <AnimatePresence mode="wait">
                            {isCreating ? (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    onSubmit={handleCreate}
                                    className="mb-4"
                                >
                                    <input
                                        autoFocus
                                        placeholder="Titre du nouveau dessin..."
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-secondary/50 border-none outline-none focus:ring-2 focus:ring-primary/50 mb-2"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreating(false)}
                                            className="flex-1 py-2 rounded-xl font-medium hover:bg-secondary transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl font-bold"
                                        >
                                            Créer & Ajouter
                                        </button>
                                    </div>
                                </motion.form>
                            ) : (
                                <motion.button
                                    key="button"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsCreating(true)}
                                    className="w-full p-4 mb-4 border-2 border-dashed border-primary/30 rounded-2xl flex items-center justify-center gap-2 text-primary font-medium hover:bg-primary/5 transition-colors"
                                >
                                    <Plus size={20} />
                                    Créer un nouveau dessin
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Liste des dessins */}
                        <div className="flex-1 overflow-y-auto space-y-2 -mx-2 px-2">
                            {drawings?.length === 0 && (
                                <div className="text-center text-muted-foreground py-8">
                                    <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>Aucun dessin existant</p>
                                </div>
                            )}

                            {drawings?.map(drawing => {
                                const alreadyHas = drawing.pencilIds.includes(pencilId);
                                return (
                                    <button
                                        key={drawing.id}
                                        onClick={() => !alreadyHas && handleSelect(drawing.id)}
                                        disabled={alreadyHas}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${alreadyHas
                                                ? 'bg-green-500/10 border border-green-500/20 cursor-not-allowed'
                                                : 'bg-secondary/30 hover:bg-secondary/50 border border-transparent'
                                            }`}
                                    >
                                        {drawing.imageBase64 ? (
                                            <img
                                                src={drawing.imageBase64}
                                                alt={drawing.title}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                                                <ImageIcon size={20} className="text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium truncate">{drawing.title}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                {drawing.pencilIds.length} crayon{drawing.pencilIds.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        {alreadyHas && (
                                            <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                                                <Check size={14} />
                                                Ajouté
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

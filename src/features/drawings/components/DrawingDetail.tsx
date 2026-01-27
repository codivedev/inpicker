import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Pencil, Search, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDrawings, useDrawing } from '../hooks/useDrawings';
import { cloudflareApi } from '@/lib/cloudflare-api';
import { findTopMatches } from '@/lib/color-utils';
import { PencilPicker } from './PencilPicker';
import { ZoomableImage } from './ZoomableImage';
import { X } from 'lucide-react';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import type { Pencil as PencilType } from '@/types/pencil';


export function DrawingDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const drawingId = parseInt(id || '0', 10);

    const { deleteDrawing, removePencilFromDrawing, updateDrawingImage, addPencilToDrawing, updateDrawing } = useDrawings();
    const { data: drawing, isLoading, error } = useDrawing(drawingId);
    const { pencilsByBrand } = useInventory();

    const allPencils = useMemo(() => Object.values(pencilsByBrand).flat(), [pencilsByBrand]);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPencilPicker, setShowPencilPicker] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    // Mettre à jour le titre édité quand le dessin est chargé
    useEffect(() => {
        if (drawing) {
            setEditedTitle(drawing.title);
        }
    }, [drawing?.title]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (error || !drawing) {
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
        // Essayer d'abord avec le pipe (nouveau format)
        let lastSepIndex = pencilId.lastIndexOf('|');

        // Si pas de pipe, essayer avec tiret (ancien format)
        if (lastSepIndex === -1) {
            lastSepIndex = pencilId.lastIndexOf('-');
        }

        if (lastSepIndex === -1) return null;

        const brand = pencilId.substring(0, lastSepIndex);
        const number = pencilId.substring(lastSepIndex + 1);
        return allPencils.find((p: PencilType) => p.brand === brand && p.id === number);
    }).filter(Boolean);


    const handleDelete = async () => {
        deleteDrawing(drawingId);
        navigate('/mes-dessins');
    };

    const handleRemovePencil = (pencilId: string) => {
        removePencilFromDrawing(drawingId, pencilId);
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

    const handleTitleSave = () => {
        if (editedTitle.trim() && editedTitle.trim() !== drawing.title) {
            updateDrawing(drawingId, editedTitle.trim());
        }
        setIsEditingTitle(false);
    };

    // Construire l'URL de l'image
    const imageUrl = drawing.image_r2_key ? cloudflareApi.getImageUrl(drawing.image_r2_key) : null;

    const handleColorPick = (hex: string) => {
        const matches = findTopMatches(hex, 1, { allPencils });
        if (matches.length > 0) {
            setPickedColor({ hex, matchedPencil: matches[0].pencil });
        }
    };

    // State pour la couleur pipetée
    const [pickedColor, setPickedColor] = useState<{ hex: string, matchedPencil: any } | null>(null);

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




            {/* Zone Image avec Zoom & Pipette */}
            <div className="p-4 relative z-0">
                {imageUrl ? (
                    <ZoomableImage
                        src={imageUrl}
                        alt={drawing.title}
                        onColorPick={handleColorPick}
                        className="aspect-video w-full rounded-2xl shadow-sm border"
                    />
                ) : (
                    <label className="relative aspect-video rounded-2xl bg-secondary/30 border border-dashed border-border overflow-hidden flex items-center justify-center cursor-pointer group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <div className="text-center text-muted-foreground">
                            <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Toucher pour ajouter une image</p>
                        </div>
                    </label>
                )}
            </div>

            {/* Résultat Pipette (Mini-Drawer) */}
            <AnimatePresence>
                {pickedColor && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
                        {/* Pas de backdrop bloquant pour permettre de continuer à pipeter si on veut, 
                            mais on doit pouvoir fermer. On met un backdrop transparent interactif qui ferme */}
                        <div className="absolute inset-0 pointer-events-auto" onClick={() => setPickedColor(null)} />

                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            className="bg-card w-full max-w-md m-4 p-4 rounded-2xl shadow-2xl border pointer-events-auto relative"
                        >
                            <button
                                onClick={() => setPickedColor(null)}
                                className="absolute top-2 right-2 p-1 text-muted-foreground hover:bg-muted rounded-full"
                            >
                                <X size={16} />
                            </button>

                            <div className="flex gap-4">
                                <div className="space-y-2">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Couleur pointée</div>
                                    <div
                                        className="w-16 h-16 rounded-xl shadow-inner border"
                                        style={{ backgroundColor: pickedColor.hex }}
                                    />
                                    <div className="text-center font-mono text-xs">{pickedColor.hex}</div>
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Crayon suggéré</div>
                                    <div className="flex items-center gap-3 p-2 bg-secondary/30 rounded-xl">
                                        <div
                                            className="w-10 h-10 rounded-lg shadow-sm border"
                                            style={{ backgroundColor: pickedColor.matchedPencil.hex }}
                                        />
                                        <div className="min-w-0">
                                            <div className="font-bold truncate">{pickedColor.matchedPencil.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {pickedColor.matchedPencil.brand} • {pickedColor.matchedPencil.id}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const pencilId = `${pickedColor.matchedPencil.brand}|${pickedColor.matchedPencil.id}`;
                                            addPencilToDrawing(drawingId, pencilId);
                                            setPickedColor(null);
                                        }}
                                        className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all"
                                    >
                                        Ajouter au dessin
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                                    initialImage: imageUrl
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
                onSelect={(pencilIds) => {
                    // Ajouter tous les crayons sélectionnés au dessin
                    pencilIds.forEach(pencilId => {
                        addPencilToDrawing(drawingId, pencilId);
                    });
                    setShowPencilPicker(false);
                }}
                excludedPencilIds={drawing.pencilIds}
            />
        </div >
    );
}

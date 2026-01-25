import { useState } from 'react';
import { ArrowLeft, Image as ImageIcon, Save, History, Loader2, X, Check, Plus, Pipette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrawings } from '@/features/drawings/hooks/useDrawings';
import { cloudflareApi } from '@/lib/cloudflare-api';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useImagePicker } from '../hooks/useImagePicker';
import { ColorResult } from './ColorResult';

interface LocationState {
    drawingId?: number;
    initialImage?: string;
}

export function PickerCanvas() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

    const { drawings, createDrawing, loading: drawingsLoading } = useDrawings();

    // États pour l'enregistrement
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [saveTitle, setSaveTitle] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [activeDrawingId, setActiveDrawingId] = useState<number | null>(state?.drawingId || null);

    const {
        imageSrc,
        transform,
        pickedColor,
        loupe,
        matchResult,
        alternatives,
        handleImageUpload,
        bindGestures,
        refs,
        onImageLoad,
        isPipetteMode,
        togglePipetteMode,
        resetView
    } = useImagePicker({ initialImage: state?.initialImage });

    // Patch temporaire car useImagePicker ne retourne pas encore imageFile dans la version actuelle
    // Il faut que je sois sûr que useImagePicker retourne bien imageFile si je veux l'utiliser ici.
    // D'après ma lecture précédente de useImagePicker.ts, il ne le retourne PAS.
    // Je ne modifie pas useImagePicker pour l'instant pour éviter de trop toucher.
    // Je vais plutôt gérer un file localement lors de l'upload. dans handleImageUpload local wrapper.

    // MAUVAISE PISTE : Je ne peux pas capturer le file *après* coup si je passe l'event direct.
    // Je dois modifier le hook useImagePicker pour qu'il expose le file, OU réimplémenter l'upload ici.
    // Le plus propre est de modifier useImagePicker pour exposer `imageFile` state si je veux faire ça proprement.
    // MAIS, je peux feinter : si l'utilisateur a uploadé une image, je ne l'ai qu'en DataURL dans `imageSrc`.
    // Pour l'envoyer au serveur, je devrai convertir le DataURL en Blob/File. C'est possible.

    const handleSaveDrawing = async () => {
        if (!imageSrc || !saveTitle.trim() || isSaving) return;

        setIsSaving(true);
        try {
            // Conversion DataURL -> File
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            const fileToUpload = new File([blob], "scan_image.png", { type: blob.type });

            const drawingId = await createDrawing(saveTitle.trim(), fileToUpload);
            setActiveDrawingId(drawingId);
            setShowSaveForm(false);
            setSaveTitle('');
            // Feedback ?
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const loadDrawingImage = (drawing: any) => {
        if (drawing.image_r2_key) {
            // Mise à jour de l'URL pour passer le nouveau state.
            // Le hook détectera le changement de `state?.initialImage` et resettera le canvas.
            navigate('/scanner-couleur', { state: { drawingId: drawing.id, initialImage: cloudflareApi.getImageUrl(drawing.image_r2_key) }, replace: true });
            setShowHistory(false);
        }
    };

    // Navigation retour intelligente
    const handleBack = () => {
        if (state?.drawingId) {
            navigate(`/dessins/${state.drawingId}`);
        } else {
            navigate('/tableau-de-bord');
        }
    };

    return (
        <div className="fixed inset-0 bg-background text-foreground touch-none overflow-hidden select-none">
            {/* Header (Transparent) */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
                <button
                    onClick={handleBack}
                    className="p-3 bg-background/50 backdrop-blur-md rounded-full text-foreground border border-border pointer-events-auto hover:bg-background/80 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="flex items-center gap-3 pointer-events-auto">
                    {/* Bouton Save (Uniquement si image chargée et pas déjà un dessin enregistré) */}
                    {imageSrc && !activeDrawingId && (
                        <button
                            onClick={() => setShowSaveForm(true)}
                            className="p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
                            title="Enregistrer en tant que dessin"
                        >
                            <Save size={20} />
                        </button>
                    )}

                    {/* Bouton Historique */}
                    <button
                        onClick={() => setShowHistory(true)}
                        className="p-3 bg-background/50 backdrop-blur-md rounded-full text-foreground border border-border hover:bg-background/80 transition-colors"
                        title="Charger un dessin"
                    >
                        <History size={24} />
                    </button>
                </div>
            </div>

            {/* Toolbar Buttons (Pipette & Reset) */}
            {imageSrc && (
                <div className="absolute top-20 right-4 z-20 flex flex-col gap-3 pointer-events-auto">
                    <button
                        onClick={togglePipetteMode}
                        className={cn(
                            "p-3 rounded-full shadow-lg transition-all duration-200 backdrop-blur-md flex items-center justify-center",
                            isPipetteMode
                                ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 scale-110"
                                : "bg-background/60 hover:bg-background/80 text-foreground border border-border"
                        )}
                        title={isPipetteMode ? "Désactiver la pipette" : "Activer la pipette"}
                    >
                        <Pipette size={24} className={cn("transition-transform", isPipetteMode ? "scale-110" : "")} />
                    </button>

                    {transform.scale > 1.1 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={resetView}
                            className="p-3 bg-background/60 hover:bg-background/80 text-foreground rounded-full shadow-lg backdrop-blur-md transition-colors border border-border"
                            title="Réinitialiser la vue"
                        >
                            <Loader2 size={24} className="rotate-0 transition-transform active:rotate-180" />
                        </motion.button>
                    )}
                </div>
            )}

            {/* Pipette Mode Indicator */}
            <AnimatePresence>
                {isPipetteMode && !loupe && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-md flex items-center gap-2"
                        >
                            <Pipette size={16} /> Mode Pipette
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* Zone Canvas / Image */}
            <div
                ref={refs.containerRef}
                {...bindGestures()}
                className={cn(
                    "w-full h-full flex items-center justify-center touch-none",
                    isPipetteMode ? "cursor-crosshair" : "cursor-move"
                )}
            >
                {!imageSrc ? (
                    <div className="text-center text-muted-foreground space-y-4 px-4">
                        <ImageIcon size={64} className="mx-auto opacity-50" />
                        <p>Aucune image chargée.</p>
                        <label className="inline-block px-6 py-3 bg-primary rounded-xl text-white font-semibold cursor-pointer pointer-events-auto hover:bg-primary/90 transition-transform active:scale-95 shadow-lg">
                            Importer une Photo
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                ) : (
                    <div
                        style={{
                            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                            touchAction: 'none'
                        }}
                        className="origin-center will-change-transform flex items-center justify-center"
                    >
                        <img
                            ref={refs.imageRef}
                            src={imageSrc}
                            alt="Work"
                            className="shadow-2xl pointer-events-none select-none display-block"
                            style={{
                                maxHeight: '80vh',
                                maxWidth: '90vw',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'fill' // "fill" ici car l'élément lui-même a déjà le bon aspect-ratio via auto/auto
                            }}
                            onLoad={onImageLoad}
                            draggable={false}
                        />
                    </div>
                )}
            </div>

            {/* Canvas Offscreen pour pixel reading */}
            <canvas ref={refs.canvasRef} className="hidden" />

            {/* Loupe Procreate Style */}
            <AnimatePresence>
                {loupe && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        style={{
                            left: loupe.x,
                            top: loupe.y, // loupe.y contient déjà l'offset (mouvement par rapport au doigt)
                        }}
                        className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                    >
                        <div className="relative">
                            <div className="w-28 h-28 rounded-full border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden bg-white">
                                <div className="w-full h-full" style={{ backgroundColor: loupe.color }} />
                            </div>
                            {/* Crosshair central */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Plus className="text-black/30" size={16} strokeWidth={4} />
                                <Plus className="absolute text-white/70" size={16} strokeWidth={2} />
                            </div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs font-mono px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                                {loupe.color}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Résultat */}
            <ColorResult
                color={pickedColor}
                match={matchResult}
                alternatives={alternatives}
                drawingId={activeDrawingId || undefined}
            />

            {/* Modale d'enregistrement */}
            <AnimatePresence>
                {showSaveForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm pointer-events-auto">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4"
                        >
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold">Enregistrer le scan</h3>
                                <p className="text-sm text-muted-foreground">Crée un dessin pour retrouver cette image plus tard.</p>
                            </div>

                            <input
                                autoFocus
                                value={saveTitle}
                                onChange={e => setSaveTitle(e.target.value)}
                                placeholder="Nom du dessin..."
                                className="w-full p-3 rounded-xl bg-secondary/50 border-none outline-none focus:ring-2 focus:ring-primary/50"
                                onKeyDown={e => e.key === 'Enter' && handleSaveDrawing()}
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowSaveForm(false)}
                                    className="flex-1 py-3 text-sm font-medium hover:bg-secondary rounded-xl transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSaveDrawing}
                                    disabled={!saveTitle.trim() || isSaving}
                                    className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    Sauvegarder
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modale Historique */}
            <AnimatePresence>
                {showHistory && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowHistory(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-card w-full max-w-lg rounded-t-[2rem] p-6 relative z-10 shadow-2xl border-t border-white/5 flex flex-col max-h-[80vh]"
                        >
                            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Charger une image</h3>
                                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pb-8 scrollbar-hide">
                                {drawingsLoading ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="animate-spin text-muted-foreground" />
                                    </div>
                                ) : drawings.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-10">Aucun dessin disponible.</p>
                                ) : (
                                    drawings.map((d: any) => (
                                        <button
                                            key={d.id}
                                            onClick={() => loadDrawingImage(d)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all",
                                                activeDrawingId === d.id
                                                    ? "bg-primary/5 border-primary/30"
                                                    : "bg-secondary/20 border-transparent hover:bg-secondary/40"
                                            )}
                                        >
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                {d.image_r2_key ? (
                                                    <img
                                                        src={cloudflareApi.getImageUrl(d.image_r2_key)}
                                                        alt={d.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : <ImageIcon className="m-auto text-muted-foreground" size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm truncate">{d.title}</h4>
                                                <p className="text-[10px] text-muted-foreground">{d.pencilIds.length} crayons</p>
                                            </div>
                                            {activeDrawingId === d.id && <Check size={16} className="text-primary" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

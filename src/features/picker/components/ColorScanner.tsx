import { useState } from 'react';
import { Camera, Check, X, Save, History, Loader2, Image as ImageIcon } from 'lucide-react';
import { useDrawings } from '@/features/drawings/hooks/useDrawings';
import { cloudflareApi } from '@/lib/cloudflare-api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Pipette, RotateCcw, Plus } from 'lucide-react';
import { useImagePicker } from '../hooks/useImagePicker';
import { ColorResult } from './ColorResult';


interface ColorScannerProps {
    onColorSelected: (hex: string) => void;
    onCancel: () => void;
}

export function ColorScanner({ onColorSelected, onCancel }: ColorScannerProps) {
    console.log('ColorScanner component rendered'); // Debug

    const { drawings, createDrawing, loading: drawingsLoading } = useDrawings();
    
    // États pour l'enregistrement
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [saveTitle, setSaveTitle] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [activeDrawingId, setActiveDrawingId] = useState<number | null>(null);

    // États pour la détection automatique
    const [isAutoCentering, setIsAutoCentering] = useState(false);
    const [showAutoCenterButton, setShowAutoCenterButton] = useState(false);

    // Utiliser le hook useImagePicker pour la logique de picking
    const {
        imageSrc,
        imageFile,
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
    } = useImagePicker();

    const handleImageUploadWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleImageUpload(e);
        setActiveDrawingId(null);
    };

    const handleSaveDrawing = async () => {
        if (!imageFile || !saveTitle.trim() || isSaving) return;

        setIsSaving(true);
        try {
            const drawingId = await createDrawing(saveTitle.trim(), imageFile);
            setActiveDrawingId(drawingId);
            setShowSaveForm(false);
            setSaveTitle('');
            // Feedback de succès ?
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const loadDrawingImage = (drawing: any) => {
        if (drawing.image_r2_key) {
            // Update using the hook's image state through navigation
            const url = cloudflareApi.getImageUrl(drawing.image_r2_key);
            window.location.href = `/scanner-couleur?drawingId=${drawing.id}&initialImage=${encodeURIComponent(url)}`;
        }
    };

    // Simplified handleImageLoad delegation
    const handleImageLoadWrapper = () => {
        onImageLoad();
        setTimeout(() => {
            detectDrawingBounds();
        }, 100);
    };

    // Détection automatique des contours du dessin
    const detectDrawingBounds = () => {
        if (!refs.canvasRef.current || !refs.imageRef.current) return;

        console.log('Detecting drawing bounds...'); // Debug

        const canvas = refs.canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        let hasContent = false;
        let contentPixels = 0;

        // Analyser les pixels pour trouver les contours
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];

                // Détecter les pixels non-blancs avec un seuil plus permissif
                if (a > 0 && (r < 250 || g < 250 || b < 250)) {
                    hasContent = true;
                    contentPixels++;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        const totalPixels = canvas.width * canvas.height;
        const contentRatio = contentPixels / totalPixels;

        console.log('Detection result:', {
            hasContent,
            contentPixels,
            totalPixels,
            contentRatio: (contentRatio * 100).toFixed(2) + '%',
            bounds: { minX, minY, maxX, maxY },
            canvasSize: { width: canvas.width, height: canvas.height }
        }); // Debug

        // Si on a détecté un dessin et qu'il occupe moins de 70% de l'image
        if (hasContent && contentRatio < 0.7) {
            const padding = Math.max(20, Math.min(canvas.width, canvas.height) * 0.02);
            const cropWidth = maxX - minX + padding * 2;
            const cropHeight = maxY - minY + padding * 2;

            // Si la zone détectée est significativement plus petite que l'image
            if (cropWidth < canvas.width * 0.9 || cropHeight < canvas.height * 0.9) {
                console.log('Showing auto center button - content too small'); // Debug
                setShowAutoCenterButton(true);
                return; // Sortir pour éviter de masquer le bouton
            }
        }

        // Masquer le bouton si le dessin occupe assez d'espace
        setShowAutoCenterButton(false);
    };

    // Recentre automatiquement sur le dessin détecté
    const autoCenterDrawing = async () => {
        if (!refs.canvasRef.current || !refs.imageRef.current) return;

        setIsAutoCentering(true);

        try {
            const canvas = refs.canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
            let hasContent = false;

            // Trouver les limites exactes du dessin
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const idx = (y * canvas.width + x) * 4;
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];
                    const a = data[idx + 3];

                    if (a > 0 && (r < 240 || g < 240 || b < 240)) {
                        hasContent = true;
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            if (hasContent) {
                const padding = Math.max(30, Math.min(canvas.width, canvas.height) * 0.05);
                const cropX = Math.max(0, minX - padding);
                const cropY = Math.max(0, minY - padding);
                const cropWidth = Math.min(canvas.width - cropX, maxX - minX + padding * 2);
                const cropHeight = Math.min(canvas.height - cropY, maxY - minY + padding * 2);

                // Créer un canvas temporaire pour le crop
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = cropWidth;
                tempCanvas.height = cropHeight;
                const tempCtx = tempCanvas.getContext('2d');

                if (tempCtx) {
                    tempCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

                    // Redimensionner le canvas principal
                    canvas.width = cropWidth;
                    canvas.height = cropHeight;
                    ctx.drawImage(tempCanvas, 0, 0);

                    // Mettre à jour l'image affichée
                    const croppedImageUrl = canvas.toDataURL();
                    // This would need to be handled through the hook's state
                    console.log('Cropped image generated', croppedImageUrl);
                }
            }
        } catch (error) {
            console.error('Erreur lors du recentrage automatique:', error);
        } finally {
            setIsAutoCentering(false);
        }
    };

    const confirmColor = () => {
        if (pickedColor) {
            onColorSelected(pickedColor);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
            {/* Header */}
            <div className="p-4 flex justify-between items-center text-white bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10 border-b border-white/5">
                <button onClick={onCancel} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <X size={24} />
                </button>
                <div className="text-sm font-bold uppercase tracking-widest text-white/70">Scanner</div>
                <div className="flex items-center gap-2">
                    {imageFile && !activeDrawingId && (
                        <button
                            onClick={() => setShowSaveForm(true)}
                            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            title="Enregistrer"
                        >
                            <Save size={20} />
                        </button>
                    )}
                    <button
                        onClick={() => setShowHistory(true)}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        title="Mes Dessins"
                    >
                        <History size={24} />
                    </button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-black/95 relative">
                {!imageSrc ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8 p-10 max-w-sm mx-auto"
                    >
                        <div className="relative mx-auto w-32 h-32">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                            <div className="absolute inset-2 bg-primary/20 rounded-full animate-ping" />
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
                                <Camera size={54} className="text-white" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-white">Scanner une couleur</h3>
                            <p className="text-white/50 text-base leading-relaxed">Prenez une photo de votre crayon ou de votre œuvre pour isoler une teinte précise.</p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <label className="flex items-center justify-center gap-3 w-full py-4 bg-white text-black font-bold rounded-2xl shadow-xl cursor-pointer hover:bg-white/90 active:scale-95 transition-all">
                                <Camera size={20} />
                                Ouvrir l'appareil photo
                                <input type="file" accept="image/*" onChange={handleImageUploadWrapper} className="hidden" />
                            </label>

                            <button
                                onClick={() => setShowHistory(true)}
                                className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 text-white/80 font-semibold rounded-2xl border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
                            >
                                <History size={20} />
                                Utiliser un dessin existant
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div
                        ref={refs.containerRef}
                        className="relative w-full h-full flex items-center justify-center touch-none overflow-hidden"
                        {...bindGestures()}
                    >
                        {/* Toolbar - Below Header */}
                        <div className="absolute top-20 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
                            <button
                                onClick={togglePipetteMode}
                                className={cn(
                                    "p-3 rounded-full shadow-lg transition-all duration-200 backdrop-blur-md",
                                    isPipetteMode
                                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                                        : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                )}
                                title={isPipetteMode ? "Désactiver la pipette" : "Activer la pipette"}
                            >
                                <Pipette size={20} />
                            </button>

                            {transform.scale > 1.1 && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={resetView}
                                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full shadow-lg backdrop-blur-md transition-colors border border-white/10"
                                    title="Réinitialiser la vue"
                                >
                                    <RotateCcw size={20} />
                                </motion.button>
                            )}
                        </div>

                        {/* Scanner Button (Float bottom) only in Pipette Mode */}
                        <AnimatePresence>
                            {isPipetteMode && (
                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 20, opacity: 0 }}
                                        className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/10 text-sm font-medium shadow-lg"
                                    >
                                        Mode Scanner actif
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* LOUPE */}
                        <AnimatePresence>
                            {loupe && isPipetteMode && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    style={{
                                        left: loupe.x,
                                        top: loupe.y - 40, // On remonte encore un peu la bulle par rapport au point de pick
                                    }}
                                    className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                                >
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden bg-white">
                                            <div className="w-full h-full" style={{ backgroundColor: loupe.color }} />
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Plus className="text-black/50 drop-shadow-sm" size={12} strokeWidth={3} />
                                            <Plus className="absolute text-white/50 drop-shadow-sm" size={12} strokeWidth={2} />
                                        </div>
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs font-mono px-2 py-1 rounded-md whitespace-nowrap">
                                            {loupe.color}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <img
                            ref={refs.imageRef}
                            src={imageSrc}
                            alt="Scan target"
                            className="max-w-full max-h-full object-contain select-none shadow-2xl pointer-events-none"
                            style={{
                                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                                touchAction: 'none'
                            }}
                            onLoad={handleImageLoadWrapper}
                            crossOrigin="anonymous"
                        />

                        {/* Canvas caché pour lecture */}
                        <canvas ref={refs.canvasRef} className="hidden" />

                        {/* Bouton de recentrage automatique */}
                        {showAutoCenterButton && (
                            <button
                                onClick={autoCenterDrawing}
                                disabled={isAutoCentering}
                                className="absolute top-4 left-4 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 border border-white/20"
                            >
                                {isAutoCentering ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <Camera size={16} />
                                )}
                                Recentrer le dessin
                            </button>
                        )}

                        {/* Bouton de détection manuelle pour debug */}
                        <button
                            onClick={() => detectDrawingBounds()}
                            className="absolute top-4 right-4 bg-blue-500/20 backdrop-blur-md text-white px-3 py-2 rounded-lg hover:bg-blue-500/30 transition-all text-xs border border-blue-500/30"
                        >
                            🎯 Détecter
                        </button>
                    </div>
                )}
            </div>

            {/* Save Form Dialog */}
            <AnimatePresence>
                {showSaveForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card w-full max-w-sm rounded-3xl p-8 border shadow-2xl space-y-6"
                        >
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">Enregistrer le dessin</h3>
                                <p className="text-sm text-muted-foreground">Donnez un titre à cette image pour la retrouver plus tard.</p>
                            </div>

                            <input
                                autoFocus
                                value={saveTitle}
                                onChange={e => setSaveTitle(e.target.value)}
                                placeholder="Nom du dessin..."
                                className="w-full p-4 rounded-xl bg-secondary/50 border-none outline-none focus:ring-2 focus:ring-primary/50 text-lg"
                                onKeyDown={e => e.key === 'Enter' && handleSaveDrawing()}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSaveForm(false)}
                                    className="flex-1 py-4 text-muted-foreground font-semibold hover:bg-secondary rounded-xl transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSaveDrawing}
                                    disabled={!saveTitle.trim() || isSaving}
                                    className="flex-1 py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    Enregistrer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* History Selector Dialog */}
            <AnimatePresence>
                {showHistory && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
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
                            className="bg-card w-full max-w-lg rounded-t-[2.5rem] p-8 relative z-10 shadow-2xl border-t border-white/5 flex flex-col max-h-[85vh]"
                        >
                            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-bold">Mes Dessins</h3>
                                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 -mx-2 px-2 pb-10 scrollbar-hide">
                                {drawingsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                        <Loader2 className="animate-spin mb-4" size={40} />
                                        <span>Chargement...</span>
                                    </div>
                                ) : drawings.length === 0 ? (
                                    <div className="text-center py-20 px-6 space-y-4">
                                        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto opacity-50">
                                            <ImageIcon size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold">Aucun dessin enregistré</p>
                                            <p className="text-sm text-muted-foreground">Enregistrez un scan pour le retrouver ici.</p>
                                        </div>
                                    </div>
                                ) : (
                                    drawings.map((d: any) => (
                                        <button
                                            key={d.id}
                                            onClick={() => loadDrawingImage(d)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all border",
                                                activeDrawingId === d.id
                                                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                                                    : "bg-secondary/20 border-transparent hover:bg-secondary/40 hover:border-white/5"
                                            )}
                                        >
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 shadow-inner">
                                                {d.image_r2_key ? (
                                                    <img
                                                        src={cloudflareApi.getImageUrl(d.image_r2_key)}
                                                        alt={d.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon size={24} className="text-muted-foreground/50" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-lg truncate">{d.title}</h4>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                    {d.pencilIds.length} Crayon{d.pencilIds.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            {activeDrawingId === d.id && (
                                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                                                    <Check size={14} className="text-primary-foreground stroke-[3px]" />
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Footer / Confirm - Only show if no match or manually hidden */}
            {pickedColor && !matchResult && (
                <div className="p-6 bg-black/80 backdrop-blur-md absolute bottom-0 left-0 right-0 pb-10 border-t border-white/10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                                style={{ backgroundColor: pickedColor }}
                            />
                            <div className="text-white font-mono text-lg">{pickedColor}</div>
                        </div>
                        <button
                            onClick={confirmColor}
                            className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Check size={20} />
                            Valider
                        </button>
                    </div>
                </div>
            )}

            {/* Color Result Component */}
            {pickedColor && matchResult && (
                <ColorResult
                    color={pickedColor}
                    match={matchResult}
                    alternatives={alternatives}
                    drawingId={activeDrawingId || undefined}
                    onConfirm={confirmColor}
                    isPicking={!!loupe}
                />
            )}
        </div>
    );
}
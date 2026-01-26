import { useState, useRef, useEffect } from 'react';
import { Camera, Check, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDrawings } from '@/features/drawings/hooks/useDrawings';
import { cloudflareApi } from '@/lib/cloudflare-api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Plus, Save, History } from 'lucide-react';
import { useImagePicker } from '../hooks/useImagePicker';
import { ColorResult } from './ColorResult';

// Composant pour le rendu zoomé de la loupe
function Magnifier({ sourceCanvas, pixelX, pixelY }: { sourceCanvas: HTMLCanvasElement | null, pixelX: number, pixelY: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!sourceCanvas || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // On dessine une zone de 11x11 pixels centrée sur pixelX, pixelY
        // pour un effet de zoom "pixel art"
        const size = 11;
        const offset = Math.floor(size / 2);
        
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 100, 100);
        ctx.drawImage(
            sourceCanvas,
            pixelX - offset, pixelY - offset, size, size,
            0, 0, 100, 100
        );
    }, [sourceCanvas, pixelX, pixelY]);

    return (
        <canvas 
            ref={canvasRef} 
            width={100} 
            height={100} 
            className="w-full h-full object-cover image-pixelated"
            style={{ imageRendering: 'pixelated' }}
        />
    );
}

interface ColorScannerProps {
    onColorSelected: (hex: string) => void;
    onCancel: () => void;
}

export function ColorScanner({ onColorSelected, onCancel }: ColorScannerProps) {
    console.log('ColorScanner component rendered'); // Debug

    const navigate = useNavigate();
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
            navigate('/scanner-couleur', { 
                state: { 
                    drawingId: drawing.id, 
                    initialImage: url 
                }, 
                replace: true 
            });
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
            <div className="p-4 flex justify-between items-center text-white bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
                <button onClick={onCancel} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
                    <X size={24} />
                </button>
                
                <div className="flex items-center gap-2">
                    {imageSrc && !activeDrawingId && (
                        <button
                            onClick={() => setShowSaveForm(true)}
                            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg backdrop-blur-md"
                            title="Enregistrer"
                        >
                            <Save size={20} />
                        </button>
                    )}
                    <button
                        onClick={() => setShowHistory(true)}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
                        title="Historique"
                    >
                        <History size={24} />
                    </button>
                    {imageSrc && (
                        <button
                            onClick={resetView}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
                            title="Réinitialiser"
                        >
                            <RotateCcw size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-black relative">
                {!imageSrc ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8 p-10 max-w-sm mx-auto"
                    >
                        <div className="relative mx-auto w-32 h-32">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
                                <Camera size={54} className="text-white" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-white">Prêt à scanner ?</h3>
                            <p className="text-white/50 text-base leading-relaxed">Importez une photo pour identifier instantanément les couleurs.</p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <label className="flex items-center justify-center gap-3 w-full py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl cursor-pointer hover:bg-primary/90 active:scale-95 transition-all">
                                <Plus size={24} />
                                CHOISIR UNE PHOTO
                                <input type="file" accept="image/*" onChange={handleImageUploadWrapper} className="hidden" />
                            </label>

                            <button
                                onClick={() => setShowHistory(true)}
                                className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 text-white/80 font-semibold rounded-2xl border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
                            >
                                <History size={20} />
                                Mes dessins récents
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div
                        ref={refs.containerRef}
                        className="relative w-full h-full flex items-center justify-center touch-none overflow-hidden"
                        {...bindGestures()}
                    >
                        {/* LOUPE */}
                        <AnimatePresence>
                            {loupe && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    style={{
                                        left: loupe.x,
                                        top: loupe.y - 20,
                                    }}
                                    className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                                >
                                    <div className="relative">
                                        {/* Magnifier glass */}
                                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden bg-black ring-4 ring-black/20">
                                            <Magnifier 
                                                sourceCanvas={refs.canvasRef.current} 
                                                pixelX={loupe.pixelX} 
                                                pixelY={loupe.pixelY} 
                                            />
                                            {/* Crosshair */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-full h-[1px] bg-white/30 absolute" />
                                                <div className="w-[1px] h-full bg-white/30 absolute" />
                                                <div className="w-2 h-2 border border-white rounded-full" />
                                            </div>
                                        </div>
                                        
                                        {/* Color label */}
                                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 whitespace-nowrap shadow-xl">
                                            {loupe.color}
                                        </div>

                                        {/* Color indicator dot */}
                                        <div 
                                            className="absolute -top-2 -right-2 w-8 h-8 rounded-full border-2 border-white shadow-lg"
                                            style={{ backgroundColor: loupe.color }}
                                        />
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

                        {/* Bouton de recentrage automatique (Plus discret) */}
                        {showAutoCenterButton && !loupe && (
                            <button
                                onClick={autoCenterDrawing}
                                disabled={isAutoCentering}
                                className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md text-white/70 p-3 rounded-full hover:bg-white/20 transition-all border border-white/10"
                            >
                                {isAutoCentering ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Camera size={20} />
                                )}
                            </button>
                        )}
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
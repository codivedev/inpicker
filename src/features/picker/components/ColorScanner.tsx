import { useState, useRef } from 'react';
import { Camera, Check, X, Save, History, Loader2, Image as ImageIcon } from 'lucide-react';
import { useDrawings } from '@/features/drawings/hooks/useDrawings';
import { cloudflareApi } from '@/lib/cloudflare-api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';


interface ColorScannerProps {
    onColorSelected: (hex: string) => void;
    onCancel: () => void;
}

export function ColorScanner({ onColorSelected, onCancel }: ColorScannerProps) {
    const { drawings, createDrawing, loading: drawingsLoading } = useDrawings();
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [pickedColor, setPickedColor] = useState<string | null>(null);

    // États pour l'enregistrement
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [saveTitle, setSaveTitle] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [activeDrawingId, setActiveDrawingId] = useState<number | null>(null);

    // Refs pour le canvas et l'image
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setImageSrc(ev.target.result as string);
                    setActiveDrawingId(null);
                }
            };
            reader.readAsDataURL(file);
        }
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
            const url = cloudflareApi.getImageUrl(drawing.image_r2_key);
            setImageSrc(url);
            setActiveDrawingId(drawing.id);
            setImageFile(null); // Plus besoin du fichier local
            setShowHistory(false);
            setPickedColor(null);
        }
    };

    const handleImageLoad = () => {
        if (imageRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const img = imageRef.current;
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
        }
    };

    const handleTouch = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current || !imageRef.current || !containerRef.current || !imageSrc) return;

        const img = imageRef.current;
        const rect = img.getBoundingClientRect();

        // Dimensions naturelles de l'image
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        // Calculer la taille réelle de l'image affichée avec object-contain
        const containerAspect = rect.width / rect.height;
        const imageAspect = naturalWidth / naturalHeight;

        let displayedWidth: number;
        let displayedHeight: number;
        let offsetX: number;
        let offsetY: number;

        if (imageAspect > containerAspect) {
            // L'image est plus large que le conteneur → limitée par la largeur
            displayedWidth = rect.width;
            displayedHeight = rect.width / imageAspect;
            offsetX = 0;
            offsetY = (rect.height - displayedHeight) / 2;
        } else {
            // L'image est plus haute que le conteneur → limitée par la hauteur
            displayedHeight = rect.height;
            displayedWidth = rect.height * imageAspect;
            offsetX = (rect.width - displayedWidth) / 2;
            offsetY = 0;
        }

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        // Position relative au conteneur img
        const xInContainer = clientX - rect.left;
        const yInContainer = clientY - rect.top;

        // Position relative à l'image affichée (en enlevant les offsets de centrage)
        const xInImage = xInContainer - offsetX;
        const yInImage = yInContainer - offsetY;

        // Vérifier si le clic est dans la zone de l'image visible
        if (xInImage < 0 || xInImage > displayedWidth || yInImage < 0 || yInImage > displayedHeight) {
            return; // Clic en dehors de l'image visible
        }

        // Ratio pour obtenir la position sur le canvas original
        const scaleX = naturalWidth / displayedWidth;
        const scaleY = naturalHeight / displayedHeight;

        const sourceX = Math.floor(xInImage * scaleX);
        const sourceY = Math.floor(yInImage * scaleY);

        // Validation des limites
        if (sourceX < 0 || sourceX >= naturalWidth || sourceY < 0 || sourceY >= naturalHeight) {
            return;
        }

        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Moyenne des pixels environnants pour plus de stabilité (3x3)
        let r = 0, g = 0, b = 0, count = 0;
        const radius = 1;

        try {
            const startX = Math.max(0, sourceX - radius);
            const startY = Math.max(0, sourceY - radius);
            const endX = Math.min(naturalWidth, sourceX + radius + 1);
            const endY = Math.min(naturalHeight, sourceY + radius + 1);

            const pixelData = ctx.getImageData(startX, startY, endX - startX, endY - startY).data;

            for (let i = 0; i < pixelData.length; i += 4) {
                if (pixelData[i + 3] > 0) { // Ignorer les pixels transparents
                    r += pixelData[i];
                    g += pixelData[i + 1];
                    b += pixelData[i + 2];
                    count++;
                }
            }

            if (count > 0) {
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
            } else {
                // Fallback sur un seul pixel
                const p = ctx.getImageData(sourceX, sourceY, 1, 1).data;
                r = p[0];
                g = p[1];
                b = p[2];
            }
        } catch {
            // Fallback en cas d'erreur
            const p = ctx.getImageData(sourceX, sourceY, 1, 1).data;
            r = p[0];
            g = p[1];
            b = p[2];
        }

        // Hex conversion
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        setPickedColor(hex);
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
                <button
                    onClick={() => setShowHistory(true)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    title="Mes Dessins"
                >
                    <History size={24} />
                </button>
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
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
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
                        ref={containerRef}
                        className="relative w-full h-full flex items-center justify-center touch-none"
                    >
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Scan target"
                            className="max-w-full max-h-full object-contain select-none shadow-2xl crosshair-cursor"
                            onLoad={handleImageLoad}
                            crossOrigin="anonymous" // Important pour les images R2
                            onClick={handleTouch}
                        />

                        {/* Bouton Save floating si pas encore de dessin actif */}
                        {imageFile && !activeDrawingId && (
                            <div className="absolute top-20 right-4 z-20">
                                <button
                                    onClick={() => setShowSaveForm(true)}
                                    className="p-3 bg-primary text-primary-foreground rounded-full shadow-2xl active:scale-90 transition-all border border-white/20"
                                    title="Enregistrer ce dessin"
                                >
                                    <Save size={24} />
                                </button>
                            </div>
                        )}

                        {/* Canvas caché pour lecture */}
                        <canvas ref={canvasRef} className="hidden" />
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

            {/* Footer / Confirm */}
            {pickedColor && (
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
        </div>
    );
}

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

    // États pour le zoom
    const [zoomLevel, setZoomLevel] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // États pour la détection automatique
    const [isAutoCentering, setIsAutoCentering] = useState(false);
    const [showAutoCenterButton, setShowAutoCenterButton] = useState(false);

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
            
            // Vérifier si l'image a besoin d'un recentrage automatique
            detectDrawingBounds();
        }
    };

    // Détection automatique des contours du dessin
    const detectDrawingBounds = () => {
        if (!canvasRef.current || !imageRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        let hasContent = false;

        // Analyser les pixels pour trouver les contours
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];

                // Détecter les pixels non-blancs avec un certain seuil
                if (a > 0 && (r < 240 || g < 240 || b < 240)) {
                    hasContent = true;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        // Si on a détecté un dessin qui n'occupe pas tout l'espace
        if (hasContent) {
            const padding = 20; // Marge de sécurité
            const cropWidth = maxX - minX + padding * 2;
            const cropHeight = maxY - minY + padding * 2;
            
            // Si la zone détectée est significativement plus petite que l'image
            if (cropWidth < canvas.width * 0.8 || cropHeight < canvas.height * 0.8) {
                setShowAutoCenterButton(true);
            }
        }
    };

    // Recentre automatiquement sur le dessin détecté
    const autoCenterDrawing = async () => {
        if (!canvasRef.current || !imageRef.current) return;

        setIsAutoCentering(true);
        
        try {
            const canvas = canvasRef.current;
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
                    setImageSrc(croppedImageUrl);
                    
                    // Réinitialiser le zoom et la position
                    setZoomLevel(1);
                    setPosition({ x: 0, y: 0 });
                    setShowAutoCenterButton(false);
                }
            }
        } catch (error) {
            console.error('Erreur lors du recentrage automatique:', error);
        } finally {
            setIsAutoCentering(false);
        }
    };

    // Gestion du zoom avec la molette
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        
        if (!containerRef.current || !imageRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        
        // Calculer le point de zoom relatif à l'image
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Ajuster le zoom
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.min(Math.max(0.5, zoomLevel * delta), 5);
        
        if (newZoom !== zoomLevel) {
            // Calculer la nouvelle position pour garder le point sous la souris
            const zoomRatio = newZoom / zoomLevel;
            const newX = x - (x - position.x) * zoomRatio;
            const newY = y - (y - position.y) * zoomRatio;
            
            setZoomLevel(newZoom);
            setPosition({ x: newX, y: newY });
        }
    };

    // Gestion du drag pour déplacer l'image zoomée
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoomLevel > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Gestion du pincement sur mobile
    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            setLastTouchDistance(distance);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDistance !== null) {
            e.preventDefault();
            
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const scale = distance / lastTouchDistance;
            const newZoom = Math.min(Math.max(0.5, zoomLevel * scale), 5);
            
            setZoomLevel(newZoom);
            setLastTouchDistance(distance);
        }
    };

    const handleTouchEnd = () => {
        setLastTouchDistance(null);
    };

    const handleTouch = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current || !imageRef.current || !containerRef.current || !imageSrc) return;

        // Ignorer si c'est un événement de zoom ou de drag
        if ('touches' in e && e.touches.length === 2) return;
        if (isDragging) return;

        const img = imageRef.current;
        const rect = containerRef.current.getBoundingClientRect();
        
        // Position tenant compte du zoom et du déplacement
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const actualX = clientX - rect.left;
        const actualY = clientY - rect.top;
        
        // Position relative à l'image zoomée et déplacée
        const xInZoomedImage = (actualX - position.x) / zoomLevel;
        const yInZoomedImage = (actualY - position.y) / zoomLevel;

        // Dimensions naturelles de l'image
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        // Dimensions de l'image affichée (sans zoom)
        const containerAspect = rect.width / rect.height;
        const imageAspect = naturalWidth / naturalHeight;

        let baseWidth: number, baseHeight: number, baseOffsetX: number, baseOffsetY: number;

        if (imageAspect > containerAspect) {
            baseWidth = rect.width;
            baseHeight = rect.width / imageAspect;
            baseOffsetX = 0;
            baseOffsetY = (rect.height - baseHeight) / 2;
        } else {
            baseHeight = rect.height;
            baseWidth = rect.height * imageAspect;
            baseOffsetX = (rect.width - baseWidth) / 2;
            baseOffsetY = 0;
        }

        // Vérifier si le clic est dans la zone de l'image
        if (xInZoomedImage < baseOffsetX || xInZoomedImage > baseOffsetX + baseWidth || 
            yInZoomedImage < baseOffsetY || yInZoomedImage > baseOffsetY + baseHeight) {
            return;
        }

        // Position relative à l'image elle-même (sans les offsets)
        const xInImage = xInZoomedImage - baseOffsetX;
        const yInImage = yInZoomedImage - baseOffsetY;

        // Ratio pour obtenir la position sur le canvas original
        const scaleX = naturalWidth / baseWidth;
        const scaleY = naturalHeight / baseHeight;

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
                        className="relative w-full h-full flex items-center justify-center touch-none overflow-hidden"
                        onWheel={handleWheel}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Scan target"
                            className="max-w-full max-h-full object-contain select-none shadow-2xl crosshair-cursor cursor-pointer"
                            style={{
                                transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                            }}
                            onLoad={handleImageLoad}
                            crossOrigin="anonymous" // Important pour les images R2
                            onClick={handleTouch}
                            onMouseDown={handleMouseDown}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        />

                        {/* Canvas caché pour lecture */}
                        <canvas ref={canvasRef} className="hidden" />

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

                        {/* Indicateurs de zoom */}
                        {zoomLevel !== 1 && (
                            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md text-white px-3 py-1 rounded-lg text-sm border border-white/20">
                                {Math.round(zoomLevel * 100)}%
                            </div>
                        )}

                        {/* Instructions de zoom */}
                        <div className="absolute bottom-20 left-4 bg-white/5 backdrop-blur-sm text-white/60 text-xs px-3 py-2 rounded-lg border border-white/10">
                            <div>🖱️ Molette pour zoomer</div>
                            <div>📱 Pincement pour zoomer</div>
                            <div>✋ Déplacer l'image zoomée</div>
                        </div>
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

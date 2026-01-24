import { useRef, useState, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pipette, RotateCcw, Crosshair, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoomableImageProps {
    src: string;
    alt: string;
    onColorPick?: (color: string) => void;
    className?: string;
}

export function ZoomableImage({ src, alt, onColorPick, className }: ZoomableImageProps) {
    const [isPipetteMode, setIsPipetteMode] = useState(false);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialiser le canvas quand l'image est chargée
    useEffect(() => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!image || !canvas) return;

        const handleLoad = () => {
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(image, 0, 0);
            }
        };

        if (image.complete) {
            handleLoad();
        } else {
            image.addEventListener('load', handleLoad);
        }

        return () => {
            image.removeEventListener('load', handleLoad);
        };
    }, [src]);

    const resetView = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const [loupe, setLoupe] = useState<{ x: number, y: number, color: string } | null>(null);

    const getPixelColor = (clientX: number, clientY: number) => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!image || !canvas) return null;

        const rect = image.getBoundingClientRect();

        // Coordonnées relatives au conteneur (pour l'affichage de la loupe)
        // Mais pour le canvas, il faut compenser les transforms CSS

        const centerX = image.naturalWidth / 2;
        const centerY = image.naturalHeight / 2;

        // Position de la souris par rapport au centre de l'élément transformé
        const domCenterX = rect.left + rect.width / 2;
        const domCenterY = rect.top + rect.height / 2;

        const relativeToCenterX = clientX - domCenterX;
        const relativeToCenterY = clientY - domCenterY;

        // On compense le scale pour revenir aux coords natives
        const unscaledX = relativeToCenterX / scale;
        const unscaledY = relativeToCenterY / scale;

        const pixelX = Math.floor(centerX + unscaledX);
        const pixelY = Math.floor(centerY + unscaledY);

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
            const safeX = Math.max(0, Math.min(pixelX, image.naturalWidth - 1));
            const safeY = Math.max(0, Math.min(pixelY, image.naturalHeight - 1));
            const pixelData = ctx.getImageData(safeX, safeY, 1, 1).data;
            return `#${[pixelData[0], pixelData[1], pixelData[2]]
                .map(x => x.toString(16).padStart(2, '0'))
                .join('')}`;
        }
        return null;
    };

    const pickColorAtCenter = () => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!image || !canvas || !onColorPick) return;

        // Le centre de l'écran (reticle) correspond au centre du conteneur.
        // L'image est centrée par défaut (flex center).
        // La transformation est : translate(pos) scale(scale) appliquée au centre de l'image.
        // Donc le point sous le centre de l'écran est simplement l'inverse de la translation, déséchelée.

        // Coordonnées du centre de l'image native
        const centerX = image.naturalWidth / 2;
        const centerY = image.naturalHeight / 2;

        // Décalage du centre dû au pan (position), corrigé par le scale
        const offsetX = -position.x / scale;
        const offsetY = -position.y / scale;

        // Pixel ciblé
        const pixelX = Math.floor(centerX + offsetX);
        const pixelY = Math.floor(centerY + offsetY);

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Sécurité bornes
            const safeX = Math.max(0, Math.min(pixelX, image.naturalWidth - 1));
            const safeY = Math.max(0, Math.min(pixelY, image.naturalHeight - 1));

            const pixelData = ctx.getImageData(safeX, safeY, 1, 1).data;
            const hex = `#${[pixelData[0], pixelData[1], pixelData[2]]
                .map(x => x.toString(16).padStart(2, '0'))
                .join('')}`;

            onColorPick(hex);
        }
    };

    const bind = useGesture({
        onDrag: ({ last, event, offset: [ox, oy], touches }) => {
            // Empêcher le comportement par défaut (scroll, etc)
            event.preventDefault();

            // GESTION DU ZOOM/PAN (2 doigts ou mode Vue)
            if (touches > 1 || !isPipetteMode) {
                if (loupe) setLoupe(null); // Cacher la loupe si on passe à 2 doigts
                setPosition({ x: ox, y: oy });
                return;
            }

            // GESTION DE LA LOUPE (1 doigt + Mode Pipette)
            if (isPipetteMode && touches === 1) {
                // @ts-ignore
                const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
                // @ts-ignore
                const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;

                // Mettre à jour la loupe
                const color = getPixelColor(clientX, clientY);
                if (color) {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                        setLoupe({
                            x: clientX - rect.left,
                            y: clientY - rect.top,
                            color
                        });
                    }
                }

                // Si on relâche, on valide la couleur
                if (last && loupe && onColorPick) {
                    onColorPick(loupe.color);
                    setLoupe(null);
                }
            }
        },
        onPinch: ({ offset: [s], memo }) => {
            // Le pinch n'active jamais la loupe
            setLoupe(null);
            setScale(s);
            return memo;
        },
    }, {
        drag: {
            from: () => [position.x, position.y],
            filterTaps: true,
            delay: true, // Aide à distinguer click/drag
        },
        pinch: {
            scaleBounds: { min: 1, max: 8 },
        },
    });

    return (
        <div className={cn("relative overflow-hidden bg-secondary/10 rounded-xl touch-none", className)} ref={containerRef}>
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                <button
                    onClick={() => setIsPipetteMode(!isPipetteMode)}
                    className={cn(
                        "p-3 rounded-full shadow-lg transition-all duration-200 backdrop-blur-md",
                        isPipetteMode
                            ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                            : "bg-background/80 hover:bg-background text-foreground"
                    )}
                    title={isPipetteMode ? "Désactiver la pipette" : "Activer la pipette"}
                >
                    <Pipette size={20} />
                </button>

                {scale > 1.1 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={resetView}
                        className="p-3 bg-background/80 hover:bg-background rounded-full shadow-lg backdrop-blur-md transition-colors"
                        title="Réinitialiser la vue"
                    >
                        <RotateCcw size={20} />
                    </motion.button>
                )}
            </div>

            {/* Reticle & Action Button (Pipette Mode) */}
            <div className={cn(
                "absolute inset-0 z-10 pointer-events-none flex items-center justify-center transition-opacity duration-200",
                isPipetteMode ? "opacity-100" : "opacity-0"
            )}>
                {/* Viseur au centre */}
                <div className="relative">
                    <Crosshair className="text-primary drop-shadow-md" size={48} strokeWidth={1.5} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full" />
                </div>

                {/* Bouton Scanner Flottant */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={pickColorAtCenter}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full shadow-xl font-bold text-lg ring-4 ring-background/50"
                    >
                        <Pipette size={20} />
                        Scanner
                    </motion.button>
                </div>
            </div>

            {/* LOUPE PROCREATE STYLE */}
            <AnimatePresence>
                {loupe && isPipetteMode && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        style={{
                            left: loupe.x,
                            top: loupe.y - 80, // Décalé vers le haut pour voir sous le doigt
                        }}
                        className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                    >
                        <div className="relative">
                            {/* Cercle Loupe */}
                            <div
                                className="w-24 h-24 rounded-full border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden bg-white"
                            >
                                {/* Couleur actuelle (Remplissage) */}
                                <div
                                    className="w-full h-full"
                                    style={{ backgroundColor: loupe.color }}
                                />
                            </div>

                            {/* Réticule au centre de la loupe */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Plus className="text-black/50 drop-shadow-sm" size={12} strokeWidth={3} />
                                <Plus className="absolute text-white/50 drop-shadow-sm" size={12} strokeWidth={2} />
                            </div>

                            {/* Code Hex sous la loupe */}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs font-mono px-2 py-1 rounded-md whitespace-nowrap">
                                {loupe.color}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Indicator Toast (Pipette Mode Active) */}
            {isPipetteMode && !loupe && (
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                    <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-xs font-bold shadow-lg backdrop-blur-md">
                        MODE PIPETTE
                    </div>
                </div>
            )}

            {/* Image & Interaction Layer */}
            <div
                {...bind()}
                className={cn(
                    "w-full h-full flex items-center justify-center cursor-move",
                    isPipetteMode ? "cursor-crosshair" : ""
                )}
                style={{ minHeight: '300px' }}
            >
                <div
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        touchAction: 'none'
                    }}
                    className="relative transition-transform duration-75 ease-linear will-change-transform origin-center"
                >
                    <img
                        ref={imageRef}
                        src={src}
                        alt={alt}
                        className="max-w-full max-h-[70vh] object-contain pointer-events-none select-none"
                    />
                </div>
            </div>

            {/* Canvas caché pour l'analyse de pixel */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

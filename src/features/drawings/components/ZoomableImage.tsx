import { useRef, useState, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pipette, RotateCcw, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';

// Composant pour le rendu zoomé de la loupe
function Magnifier({ sourceCanvas, pixelX, pixelY }: { sourceCanvas: HTMLCanvasElement | null, pixelX: number, pixelY: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!sourceCanvas || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const size = 31;
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
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
        />
    );
}

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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

    const [loupe, setLoupe] = useState<{ x: number, y: number, color: string, pixelX: number, pixelY: number } | null>(null);

    const getPixelColor = (clientX: number, clientY: number) => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!image || !canvas) return null;

        const rect = image.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;

        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;

        const pixelX = Math.floor((relativeX / rect.width) * image.naturalWidth);
        const pixelY = Math.floor((relativeY / rect.height) * image.naturalHeight);

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
            const safeX = Math.max(0, Math.min(pixelX, image.naturalWidth - 1));
            const safeY = Math.max(0, Math.min(pixelY, image.naturalHeight - 1));
            const pixelData = ctx.getImageData(safeX, safeY, 1, 1).data;
            const hex = `#${[pixelData[0], pixelData[1], pixelData[2]]
                .map(x => x.toString(16).padStart(2, '0'))
                .join('')}`.toUpperCase();
            return { hex, pixelX: safeX, pixelY: safeY };
        }
        return null;
    };

    const pickColorAtCenter = () => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const colorData = getPixelColor(centerX, centerY);
        if (colorData && onColorPick) {
            onColorPick(colorData.hex);
        }
    };

    const bind = useGesture({
        onDrag: ({ last, event, offset: [ox, oy], touches, pinching, cancel }) => {
            if (event.cancelable) event.preventDefault();

            const realTouches = (event as TouchEvent).touches ? (event as TouchEvent).touches.length : touches;

            if (realTouches > 1 || pinching || !isPipetteMode) {
                if (loupe) setLoupe(null);
                if (isPipetteMode && realTouches > 1) cancel();

                setPosition({ x: ox, y: oy });
                return;
            }

            if (isPipetteMode && realTouches === 1) {
                // @ts-ignore
                const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
                // @ts-ignore
                const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;

                const colorData = getPixelColor(clientX, clientY);
                if (colorData) {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                        setLoupe({
                            x: clientX - rect.left,
                            y: clientY - rect.top,
                            color: colorData.hex,
                            pixelX: colorData.pixelX,
                            pixelY: colorData.pixelY
                        });
                    }
                }

                if (last && loupe && onColorPick) {
                    onColorPick(loupe.color);
                    setLoupe(null);
                }
            }
        },
        onPinch: ({ offset: [s], memo }) => {
            // Le pinch n'active jamais la loupe
            if (loupe) setLoupe(null);
            setScale(s);
            return memo;
        },
    }, {
        drag: {
            from: () => [position.x, position.y],
            filterTaps: true,
            delay: 150, // CRITIQUE : Attendre 150ms pour être sûr que ce n'est pas un début de pinch (2e doigt)
        },
        pinch: {
            scaleBounds: { min: 1, max: 8 },
        },
    });

    return (
        <div
            className={cn("relative overflow-hidden bg-secondary/10 rounded-xl", className)}
            ref={containerRef}
            style={{ touchAction: 'none' }} // Force le blocking des gestes natifs
        >
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
                            {/* Magnifier glass */}
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden bg-black ring-4 ring-black/20">
                                <Magnifier 
                                    sourceCanvas={canvasRef.current} 
                                    pixelX={loupe.pixelX} 
                                    pixelY={loupe.pixelY} 
                                />
                                {/* Crosshair central */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-[1px] bg-white/30 absolute" />
                                    <div className="w-[1px] h-full bg-white/30 absolute" />
                                    <div className="w-2 h-2 border border-white rounded-full" />
                                </div>
                            </div>
                            
                            {/* Color indicator dot */}
                            <div 
                                className="absolute -top-2 -right-2 w-8 h-8 rounded-full border-2 border-white shadow-lg"
                                style={{ backgroundColor: loupe.color }}
                            />

                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 whitespace-nowrap shadow-xl">
                                {loupe.color}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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

import { useRef, useState, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { motion } from 'framer-motion';
import { Pipette, RotateCcw, Crosshair } from 'lucide-react';
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
        onDrag: ({ offset: [x, y] }) => {
            // Pan toujours actif, même en mode pipette pour ajuster la visée
            setPosition({ x, y });
        },
        onPinch: ({ offset: [s], memo }) => {
            // Zoom toujours actif
            setScale(s);
            return memo;
        },
    }, {
        drag: {
            from: () => [position.x, position.y],
        },
        pinch: {
            scaleBounds: { min: 1, max: 8 },
            modifierKey: null,
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

            {/* Image & Interaction Layer */}
            <div
                {...bind()}
                className="w-full h-full flex items-center justify-center cursor-move"
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

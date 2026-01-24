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

    const pickColor = (clientX: number, clientY: number) => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!image || !canvas || !onColorPick) return;

        const rect = image.getBoundingClientRect();

        // Calculer la position relative dans l'image affichée


        // Convertir en coordonnées de l'image originale
        // rect.width / scale est la largeur "non-zoomée/non-transformée" affichée
        // Mais en fait, l'image est transformée par CSS.
        // Le plus simple : Ratio intrinsèque vs affiché (sans scale)
        // rect.width est la largeur affichée AVEC le scale.

        // On doit trouver le ratio entre l'image naturelle et l'image affichée (sans le scale du zoom si possible, ou en le compensant)
        // scale = current visual scale.
        // visualWidth = naturalWidth * renderedScale * scale

        // Approche plus simple :
        // 1. Coordonnée x dans le repère du conteneur transformé.
        // Le `rect` de l'image prend en compte le scale transform.

        const relativeX = (clientX - rect.left);
        const relativeY = (clientY - rect.top);

        // Ratio de position (0 à 1)
        const ratioX = relativeX / rect.width;
        const ratioY = relativeY / rect.height;

        // Pixel sur le canvas original
        const pixelX = Math.floor(ratioX * image.naturalWidth);
        const pixelY = Math.floor(ratioY * image.naturalHeight);

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
            if (isPipetteMode) return; // Pas de pan en mode pipette pour éviter confusion ? Ou alors pan à 2 doigts ?
            // On limite le pan pour ne pas perdre l'image
            setPosition({ x, y });
        },
        onPinch: ({ offset: [s], memo }) => {
            if (isPipetteMode) return;
            setScale(s);
            return memo;
        },
        onClick: ({ event }) => {
            if (isPipetteMode) {
                // @ts-ignore - event.clientX existe sur MouseEvent et TouchEvent (via useGesture normalization souvent, mais ici c'est React.MouseEvent/TouchEvent mix)
                // useGesture normalize souvent. Mais onClick est standard React ici sauf si configuré autrement.
                // On va utiliser onPointerDown pour être safe ou extraction depuis event.
                const clientX = (event as any).clientX;
                const clientY = (event as any).clientY;
                if (clientX && clientY) pickColor(clientX, clientY);
            }
        }
    }, {
        drag: {
            from: () => [position.x, position.y],
            enabled: !isPipetteMode
        },
        pinch: {
            scaleBounds: { min: 1, max: 8 },
            modifierKey: null,
            enabled: !isPipetteMode
        },
    });

    return (
        <div className={cn("relative overflow-hidden bg-secondary/10 rounded-xl", className)} ref={containerRef}>
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

            {/* Mode Indicator Toast */}
            {isPipetteMode && (
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                    <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-4">
                        <span className="flex items-center gap-2">
                            <Crosshair size={16} />
                            Touchez pour pipeter
                        </span>
                    </div>
                </div>
            )}

            {/* Image & Interaction Layer */}
            <div
                {...bind()}
                className={cn(
                    "w-full h-full flex items-center justify-center touch-none",
                    isPipetteMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
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

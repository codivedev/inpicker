import { useState, useRef, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { findTopMatches } from '@/lib/color-utils';
import type { MatchResult } from '@/lib/color-utils';
import { useInventory } from '@/features/inventory/hooks/useInventory';

interface Transform {
    x: number;
    y: number;
    scale: number;
}

interface UseImagePickerOptions {
    initialImage?: string | null;
}

export function useImagePicker(options: UseImagePickerOptions = {}) {
    const [imageSrc, setImageSrc] = useState<string | null>(options.initialImage || null);
    const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
    const [pickedColor, setPickedColor] = useState<string | null>(null); // Hex
    const [loupe, setLoupe] = useState<{ x: number, y: number, color: string } | null>(null);
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
    const [alternatives, setAlternatives] = useState<MatchResult[]>([]);

    // NOUVEAU : Mode Pipette explicite pour éviter les conflits de gestures
    const [isPipetteMode, setIsPipetteMode] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    useInventory(); // Pour plus tard si on filtre par inventaire

    // Mettre à jour l'image si initialImage change
    useEffect(() => {
        if (options.initialImage && options.initialImage !== imageSrc) {
            setImageSrc(options.initialImage);
            setTransform({ x: 0, y: 0, scale: 1 });
            setPickedColor(null);
            setMatchResult(null);
            setAlternatives([]);
            setLoupe(null);
            setIsPipetteMode(false); // Reset mode
        }
    }, [options.initialImage]);

    // Gestion de l'import image
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setImageSrc(ev.target.result as string);
                    setTransform({ x: 0, y: 0, scale: 1 }); // Reset zoom
                    setPickedColor(null);
                    setMatchResult(null);
                    setIsPipetteMode(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const getPixelColor = (clientX: number, clientY: number) => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!image || !canvas) return null;

        const rect = image.getBoundingClientRect();

        // Coordonnées relatives à l'image affichée (0 -> width)
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Ratio par rapport à la taille affichée (getBoundingClientRect contient déjà le scale)
        const xPercent = x / rect.width;
        const yPercent = y / rect.height;

        // Sécurité : si on touche en dehors de l'image (padding du container)
        if (xPercent < 0 || xPercent > 1 || yPercent < 0 || yPercent > 1) return null;

        // Coordonnées pixel dans l'image naturelle
        const pixelX = Math.floor(xPercent * image.naturalWidth);
        const pixelY = Math.floor(yPercent * image.naturalHeight);

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
            // Sécurité sup pour les bords
            const safeX = Math.max(0, Math.min(pixelX, image.naturalWidth - 1));
            const safeY = Math.max(0, Math.min(pixelY, image.naturalHeight - 1));
            const pixelData = ctx.getImageData(safeX, safeY, 1, 1).data;
            const r = pixelData[0];
            const g = pixelData[1];
            const b = pixelData[2];
            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        }
        return null;
    };

    // Bind Gestures
    const bind = useGesture({
        onDrag: ({ last, event, offset: [x, y], touches, pinching, cancel }) => {
            if (event.cancelable) event.preventDefault();

            // S'assurer qu'on utilise le nombre de doigts réel
            const realTouches = (event as TouchEvent).touches ? (event as TouchEvent).touches.length : touches;

            // CAS 1 : PAN/ZOOM (2 doigts OU pinch OU !isPipetteMode)
            // Si on n'est PAS en mode pipette, le drag à 1 doigt est un PAN.
            if (realTouches > 1 || pinching || !isPipetteMode) {
                if (loupe) setLoupe(null);
                // Si on était en mode pipette et qu'on a mis 2 doigts, on annule l'action actuelle
                if (isPipetteMode && realTouches > 1) cancel();

                setTransform(t => ({ ...t, x, y }));
                return;
            }

            // CAS 2 : LOUPE (1 doigt ET isPipetteMode)
            if (isPipetteMode && realTouches === 1) {
                // @ts-ignore
                const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
                // @ts-ignore
                const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;

                const color = getPixelColor(clientX, clientY);
                if (color) {
                    // CRITIQUE : on utilise clientX/Y directs pour l'overlay fixed
                    setLoupe({
                        x: clientX,
                        y: clientY,
                        color
                    });

                    // Feedback immédiat
                    setPickedColor(color);
                    const matches = findTopMatches(color, 6);
                    setMatchResult(matches.length > 0 ? matches[0] : null);
                    setAlternatives(matches.slice(1));
                }

                if (last) {
                    setLoupe(null);
                    setIsPipetteMode(false); // On quitte le mode pipette une fois la couleur figée
                }
            }
        },
        onPinch: ({ offset: [s], memo }) => {
            if (loupe) setLoupe(null);
            setTransform(t => ({ ...t, scale: s }));
            return memo;
        },
    }, {
        drag: {
            from: () => [transform.x, transform.y],
            delay: 150, // Anti-conflit
            filterTaps: true,
        },
        pinch: {
            scaleBounds: { min: 0.5, max: 8 },
        },
    });

    const onImageLoad = () => {
        if (imageRef.current && canvasRef.current) {
            canvasRef.current.width = imageRef.current.naturalWidth;
            canvasRef.current.height = imageRef.current.naturalHeight;
            const ctx = canvasRef.current.getContext('2d');
            ctx?.drawImage(imageRef.current, 0, 0);
        }
    };

    return {
        imageSrc,
        transform,
        pickedColor,
        loupe,
        matchResult,
        alternatives,
        handleImageUpload,
        bindGestures: bind,
        refs: { canvasRef, containerRef, imageRef },
        onImageLoad,
        // New Exports
        isPipetteMode,
        togglePipetteMode: () => setIsPipetteMode(prev => !prev),
        setPipetteMode: setIsPipetteMode,
        resetView: () => {
            setTransform({ x: 0, y: 0, scale: 1 });
            // setPipetteMode(false); // Optionnel
        }
    };
}

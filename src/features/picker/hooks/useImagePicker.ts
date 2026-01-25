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
    const [imageFile, setImageFile] = useState<File | null>(null);
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

    const { ownedPencils } = useInventory();
    const ownedPencilsIds = ownedPencils
        .filter(p => p.is_owned === 1)
        .map(p => p.id);

    // Mettre à jour l'image si initialImage change
    useEffect(() => {
        if (options.initialImage && options.initialImage !== imageSrc) {
            setImageSrc(options.initialImage);
            setImageFile(null); // On reset le file si on charge une URL
            setTransform({ x: 0, y: 0, scale: 1 });
            setPickedColor(null);
            setMatchResult(null);
            setAlternatives([]);
            setLoupe(null);
            setIsPipetteMode(false); // Reset mode
        }
    }, [options.initialImage, imageSrc]);

    // Gestion de l'import image
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
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

        // Calcul robuste basé sur le centre (Inspiré de ColorScanner)
        const centerX = image.naturalWidth / 2;
        const centerY = image.naturalHeight / 2;

        // Position par rapport au centre de l'élément transformé
        const domCenterX = rect.left + rect.width / 2;
        const domCenterY = rect.top + rect.height / 2;

        const relativeToCenterX = clientX - domCenterX;
        const relativeToCenterY = clientY - domCenterY;

        // On compense le scale et les transforms pour revenir aux coords natives
        const unscaledX = relativeToCenterX / transform.scale;
        const unscaledY = relativeToCenterY / transform.scale;

        const pixelX = Math.floor(centerX + unscaledX);
        const pixelY = Math.floor(centerY + unscaledY);

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
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

            const realTouches = (event as TouchEvent).touches ? (event as TouchEvent).touches.length : touches;

            if (realTouches > 1 || pinching || !isPipetteMode) {
                if (loupe) setLoupe(null);
                if (isPipetteMode && realTouches > 1) cancel();

                setTransform(t => ({ ...t, x, y }));
                return;
            }

            if (isPipetteMode && realTouches === 1) {
                // @ts-ignore
                const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
                // @ts-ignore
                const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;

                const PICK_OFFSET = 120; // Décalage pour voir au-dessus du doigt
                const targetY = clientY - PICK_OFFSET;

                // On pick la couleur SOUS la loupe (targetY), pas sous le doigt (clientY)
                const color = getPixelColor(clientX, targetY);
                if (color) {
                    setLoupe({
                        x: clientX,
                        y: targetY, // La loupe s'affiche au-dessus
                        color
                    });

                    setPickedColor(color);
                    const matches = findTopMatches(color, 6, {
                        ownedPencilsIds,
                        prioritizeOwned: true
                    });
                    setMatchResult(matches.length > 0 ? matches[0] : null);
                    setAlternatives(matches.slice(1));
                } else {
                    setLoupe(prev => prev ? { ...prev, x: clientX, y: targetY } : null);
                }

                if (last) {
                    setLoupe(null);
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
            delay: 150,
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
        imageFile,
        transform,
        pickedColor,
        loupe,
        matchResult,
        alternatives,
        handleImageUpload,
        bindGestures: bind,
        refs: { canvasRef, containerRef, imageRef },
        onImageLoad,
        isPipetteMode,
        togglePipetteMode: () => setIsPipetteMode(prev => !prev),
        setPipetteMode: setIsPipetteMode,
        resetView: () => {
            setTransform({ x: 0, y: 0, scale: 1 });
        }
    };
}

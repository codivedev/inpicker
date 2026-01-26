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

interface LoupeState {
    x: number;
    y: number;
    color: string;
    pixelX: number;
    pixelY: number;
}

interface UseImagePickerOptions {
    initialImage?: string | null;
}

export function useImagePicker(options: UseImagePickerOptions = {}) {
    const [imageSrc, setImageSrc] = useState<string | null>(options.initialImage || null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
    const [pickedColor, setPickedColor] = useState<string | null>(null);
    const [loupe, setLoupe] = useState<LoupeState | null>(null);
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
    const [alternatives, setAlternatives] = useState<MatchResult[]>([]);
    const [isPipetteMode, setIsPipetteMode] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    const { ownedPencils, pencilsByBrand } = useInventory();
    const ownedPencilsIds = ownedPencils
        .filter(p => p.is_owned === 1)
        .map(p => p.id);

    const allPencils = Object.values(pencilsByBrand).flat();

    useEffect(() => {
        if (options.initialImage && options.initialImage !== imageSrc) {
            setImageSrc(options.initialImage);
            setImageFile(null);
            setTransform({ x: 0, y: 0, scale: 1 });
            setPickedColor(null);
            setMatchResult(null);
            setAlternatives([]);
            setLoupe(null);
            setIsPipetteMode(false);
        }
    }, [options.initialImage, imageSrc]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setImageSrc(ev.target.result as string);
                    setTransform({ x: 0, y: 0, scale: 1 });
                    setPickedColor(null);
                    setMatchResult(null);
                    setIsPipetteMode(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const getPixelColor = (clientX: number, clientY: number): LoupeState | null => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!image || !canvas) return null;

        const rect = image.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;

        // Calculer la position relative dans l'élément affiché (incluant le zoom/pan via CSS)
        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;

        // Convertir en coordonnées réelles de l'image (0 à naturalWidth/naturalHeight)
        const percentageX = relativeX / rect.width;
        const percentageY = relativeY / rect.height;

        const pixelX = Math.floor(percentageX * image.naturalWidth);
        const pixelY = Math.floor(percentageY * image.naturalHeight);

        if (image.naturalWidth === 0 || image.naturalHeight === 0) return null;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;

        const safeX = Math.max(0, Math.min(Math.floor(pixelX), image.naturalWidth - 1));
        const safeY = Math.max(0, Math.min(Math.floor(pixelY), image.naturalHeight - 1));

        const pixelData = ctx.getImageData(safeX, safeY, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];
        const color = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

        return { x: clientX, y: clientY, color, pixelX: safeX, pixelY: safeY };
    };

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
                const touchEvent = event as TouchEvent;
                const clientX = touchEvent.changedTouches ? touchEvent.changedTouches[0].clientX : (event as any).clientX;
                const clientY = touchEvent.changedTouches ? touchEvent.changedTouches[0].clientY : (event as any).clientY;

                // Sur smartphone, on décale la loupe au dessus du doigt pour qu'elle ne soit pas cachée
                const PICK_OFFSET = 100; 
                const targetY = clientY - PICK_OFFSET;

                const pixelData = getPixelColor(clientX, targetY);
                if (pixelData) {
                    setLoupe({
                        x: clientX,
                        y: targetY,
                        color: pixelData.color,
                        pixelX: pixelData.pixelX,
                        pixelY: pixelData.pixelY
                    });

                    setPickedColor(pixelData.color);
                    const matches = findTopMatches(pixelData.color, 6, {
                        ownedPencilsIds,
                        prioritizeOwned: true,
                        allPencils
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

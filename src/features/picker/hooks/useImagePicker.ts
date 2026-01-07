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

export function useImagePicker() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
    const [pickedColor, setPickedColor] = useState<string | null>(null); // Hex
    const [loupePos, setLoupePos] = useState<{ x: number, y: number } | null>(null);
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
    const [alternatives, setAlternatives] = useState<MatchResult[]>([]);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    useInventory(); // Pour plus tard si on filtre par inventaire

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
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Bind Gestures
    const bind = useGesture({
        onDrag: ({ offset: [x, y] }) => {
            setTransform(t => ({ ...t, x, y }));
        },
        onPinch: ({ offset: [s] }) => {
            setTransform(t => ({ ...t, scale: s }));
        },
    }, {
        drag: { from: () => [transform.x, transform.y] },
        pinch: { scaleBounds: { min: 1, max: 8 }, modifierKey: null },
    });

    // Fonction de picking
    const pickColor = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
        if (!canvasRef.current || !containerRef.current || !imageRef.current) return;

        // On utilise getBoundingClientRect de l'IMAGE elle-même
        // Cela inclut déjà le scale et le translate CSS !
        const rect = imageRef.current.getBoundingClientRect();

        // Position du curseur
        const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
        const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as any).clientY;

        // Position relative à l'image affichée
        const xInImage = clientX - rect.left;
        const yInImage = clientY - rect.top;

        // Ratio entre taille naturelle et taille affichée
        const scaleX = imageRef.current.naturalWidth / rect.width;
        const scaleY = imageRef.current.naturalHeight / rect.height;

        // Coordonnées dans la source originale
        const sourceX = Math.floor(xInImage * scaleX);
        const sourceY = Math.floor(yInImage * scaleY);

        // Validation des limites
        if (sourceX < 0 || sourceX >= imageRef.current.naturalWidth ||
            sourceY < 0 || sourceY >= imageRef.current.naturalHeight) return;

        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Moyenne 3x3 pour la stabilité
        let r = 0, g = 0, b = 0, count = 0;
        const radius = 1;

        try {
            const pixelData = ctx.getImageData(sourceX - radius, sourceY - radius, radius * 2 + 1, radius * 2 + 1).data;

            for (let i = 0; i < pixelData.length; i += 4) {
                // On ignore les pixels transparents si jamais
                if (pixelData[i + 3] > 0) {
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
                const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

                setPickedColor(hex);
                setLoupePos({ x: clientX, y: clientY });

                // Recherche Matchs
                const matches = findTopMatches(hex, 6);
                setMatchResult(matches.length > 0 ? matches[0] : null);
                setAlternatives(matches.slice(1));
            }
        } catch (err) {
            // Hors limites canvas possible au bord
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        // Optionnel: Uniquement si un seul doigt
        if (e.pointerType === 'touch' && !e.isPrimary) return;
        pickColor(e);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        // On ne pick que si le bouton est pressé ou si la loupe est déjà là (maintien)
        if (e.buttons === 1 || e.pointerType === 'touch') {
            pickColor(e);
        }
    };

    const handlePointerUp = () => {
        setLoupePos(null);
    };

    // Effet pour dessiner l'image dans le canvas une seule fois au chargement
    useEffect(() => {
        if (imageRef.current && canvasRef.current && imageSrc) {
            // Déjà géré par <img onLoad>
        }
    }, [imageSrc]);

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
        loupePos,
        matchResult,
        alternatives,
        handleImageUpload,
        bindGestures: bind,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        refs: { canvasRef, containerRef, imageRef },
        onImageLoad
    };
}

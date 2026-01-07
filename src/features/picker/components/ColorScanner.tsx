import { useState, useRef } from 'react';
import { Camera, Check, X } from 'lucide-react';


interface ColorScannerProps {
    onColorSelected: (hex: string) => void;
    onCancel: () => void;
}

export function ColorScanner({ onColorSelected, onCancel }: ColorScannerProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [pickedColor, setPickedColor] = useState<string | null>(null);

    // Refs pour le canvas et l'image
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setImageSrc(ev.target.result as string);
                }
            };
            reader.readAsDataURL(file);
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
            <div className="p-4 flex justify-between items-center text-white bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
                <button onClick={onCancel} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                    <X size={24} />
                </button>
                <div className="text-sm font-medium">Touchez pour scanner</div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Main Area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-neutral-900 relative">
                {!imageSrc ? (
                    <div className="text-center space-y-6 p-6">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <Camera size={40} className="text-white/50" />
                        </div>
                        <p className="text-white/70">Prenez une photo de votre crayon pour scanner sa couleur exacte.</p>

                        <label className="block w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg cursor-pointer">
                            Ouvrir la Caméra / Galerie
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    </div>
                ) : (
                    <div
                        ref={containerRef}
                        className="relative w-full h-full flex items-center justify-center touch-none"
                    >
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Scan target"
                            className="max-w-full max-h-full object-contain select-none shadow-2xl"
                            onLoad={handleImageLoad}
                            onClick={handleTouch}
                        // Note: For simplicity, basic touch handling without complex pan/zoom.
                        // Ideally we would add gesture support like PickerCanvas.
                        />

                        {/* Canvas caché pour lecture */}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}
            </div>

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

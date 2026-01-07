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

        const rect = imageRef.current.getBoundingClientRect();

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        // Position relative à l'image affichée
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Ratio pour obtenir la position sur le canvas original
        const scaleX = imageRef.current.naturalWidth / rect.width;
        const scaleY = imageRef.current.naturalHeight / rect.height;

        const sourceX = Math.floor(x * scaleX);
        const sourceY = Math.floor(y * scaleY);

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const p = ctx.getImageData(sourceX, sourceY, 1, 1).data;
        // Hex conversion
        const hex = `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1).toUpperCase()}`;

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

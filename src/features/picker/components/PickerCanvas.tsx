import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useImagePicker } from '../hooks/useImagePicker';
import { ColorResult } from './ColorResult';

export function PickerCanvas() {
    const navigate = useNavigate();
    const {
        imageSrc,
        transform,
        handleImageUpload,
        bindGestures,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        refs,
        onImageLoad,
        loupePos,
        pickedColor,
        matchResult,
        alternatives
    } = useImagePicker();

    return (
        <div className="fixed inset-0 bg-background text-foreground touch-none overflow-hidden select-none">
            {/* Header (Transparent) */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
                <button
                    onClick={() => navigate('/tableau-de-bord')}
                    className="p-3 bg-background/50 backdrop-blur-md rounded-full text-foreground border border-border pointer-events-auto hover:bg-background/80 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* Zone Canvas / Image */}
            <div
                ref={refs.containerRef}
                {...bindGestures()}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-full flex items-center justify-center cursor-crosshair touch-none"
            >
                {!imageSrc ? (
                    <div className="text-center text-muted-foreground space-y-4">
                        <ImageIcon size={64} className="mx-auto opacity-50" />
                        <p>Aucune image chargée.</p>
                        <label className="inline-block px-6 py-3 bg-primary rounded-xl text-white font-semibold cursor-pointer pointer-events-auto hover:bg-primary/90 transition-transform active:scale-95 shadow-lg">
                            Importer une Photo
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                ) : (
                    <div
                        style={{
                            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                            touchAction: 'none'
                        }}
                        className="origin-center will-change-transform"
                    >
                        <img
                            ref={refs.imageRef}
                            src={imageSrc}
                            alt="Work"
                            className="max-w-[none] shadow-2xl pointer-events-none select-none"
                            style={{ maxHeight: '80vh', maxWidth: '90vw', objectFit: 'contain' }} // Initial fit
                            onLoad={onImageLoad}
                            draggable={false}
                        />
                    </div>
                )}
            </div>

            {/* Canvas Offscreen pour pixel reading */}
            <canvas ref={refs.canvasRef} className="hidden" />

            {/* Loupe (Si active) */}
            {loupePos && pickedColor && (
                <div
                    className="fixed pointer-events-none z-50 w-24 h-24 rounded-full border-4 border-background shadow-2xl overflow-hidden bg-background"
                    style={{
                        left: loupePos.x - 48,
                        top: loupePos.y - 120, // Offset vers le haut
                        backgroundColor: pickedColor // Fallback simple (ou canvas crop complexe)
                    }}
                >
                    {/* Réticule */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1 h-4 bg-white/50 shadow-sm" />
                        <div className="w-4 h-1 bg-white/50 -ml-4 shadow-sm" /> {/* Wait, relative positioning */}
                        {/* Simple Crosshair */}
                        <svg className="w-full h-full text-white" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0px 0px 1px rgba(0,0,0,0.5))' }}>
                            <line x1="50" y1="20" x2="50" y2="45" stroke="currentColor" strokeWidth="2" />
                            <line x1="50" y1="55" x2="50" y2="80" stroke="currentColor" strokeWidth="2" />
                            <line x1="20" y1="50" x2="45" y2="50" stroke="currentColor" strokeWidth="2" />
                            <line x1="55" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Résultat */}
            <ColorResult color={pickedColor} match={matchResult} alternatives={alternatives} />
        </div>
    );
}

import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useImagePicker } from '../hooks/useImagePicker';
import { ColorResult } from './ColorResult';

interface LocationState {
    drawingId?: number;
    initialImage?: string;
}

export function PickerCanvas() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

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
    } = useImagePicker({ initialImage: state?.initialImage });

    // Navigation retour intelligente
    const handleBack = () => {
        if (state?.drawingId) {
            navigate(`/dessins/${state.drawingId}`);
        } else {
            navigate('/tableau-de-bord');
        }
    };

    return (
        <div className="fixed inset-0 bg-background text-foreground touch-none overflow-hidden select-none">
            {/* Header (Transparent) */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
                <button
                    onClick={handleBack}
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
                            style={{ maxHeight: '80vh', maxWidth: '90vw', objectFit: 'contain' }}
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
                    className="fixed pointer-events-none z-50 w-24 h-24 rounded-full border-4 border-background shadow-2xl overflow-hidden"
                    style={{
                        left: loupePos.x - 48,
                        top: loupePos.y - 120,
                        backgroundColor: pickedColor
                    }}
                />
            )}

            {/* Résultat */}
            <ColorResult
                color={pickedColor}
                match={matchResult}
                alternatives={alternatives}
                drawingId={state?.drawingId}
            />
        </div>
    );
}

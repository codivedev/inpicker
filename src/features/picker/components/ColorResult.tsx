import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPencilId } from '@/lib/color-utils';
import type { MatchResult } from '@/lib/color-utils';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { Check, Bookmark, Plus, ChevronDown, ChevronUp, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrawingPicker } from '@/features/drawings/components/DrawingPicker';
import { useFavorites } from '@/hooks/useFavorites';
import { useDrawings } from '@/features/drawings/hooks/useDrawings';

interface ColorResultProps {
    color: string | null;
    match: MatchResult | null;
    alternatives: MatchResult[];
    drawingId?: number;
    onConfirm?: () => void;
    isPicking?: boolean;
}

export function ColorResult({ color, match, alternatives, drawingId, onConfirm, isPicking }: ColorResultProps) {
    const { isOwned, togglePencil } = useInventory();
    const { addPencilToDrawing } = useDrawings();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showDrawingPicker, setShowDrawingPicker] = useState(false);
    const [addedToDrawing, setAddedToDrawing] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [overrideMatch, setOverrideMatch] = useState<MatchResult | null>(null);

    // Ré-agrandir si une nouvelle couleur est pickée (mais pas pendant le drag)
    useEffect(() => {
        if (color) {
            if (isPicking) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
            setOverrideMatch(null);
            setAddedToDrawing(false);
            setIsConfirmed(false);
            setIsConfirming(false);
        }
    }, [color, isPicking]);

    const activeMatch = overrideMatch || match;

    const favorite = isFavorite(color || '');

    const handleSaveColor = async () => {
        if (!color || !activeMatch || isConfirming || isConfirmed) return;
        
        setIsConfirming(true);
        try {
            // 1. Toujours ajouter aux favoris par défaut pour ne rien perdre
            if (!favorite) {
                await addFavorite({
                    id: color,
                    hex: color,
                    name: activeMatch.pencil.name,
                    brand: activeMatch.pencil.brand,
                    pencilId: getPencilId(activeMatch.pencil)
                });
            }

            // 2. Si on a un drawingId, on l'ajoute au dessin
            if (drawingId) {
                await addPencilToDrawing(drawingId, getPencilId(activeMatch.pencil));
                setAddedToDrawing(true);
            }

            setIsConfirmed(true);
            
            // 3. Appeler onConfirm après un court délai pour laisser voir le feedback
            if (onConfirm) {
                setTimeout(() => {
                    onConfirm();
                }, 600);
            }
        } catch (error) {
            console.error("Erreur de sauvegarde:", error);
        } finally {
            setIsConfirming(false);
        }
    };

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!color || !activeMatch) return;
        if (favorite) {
            await removeFavorite(color);
        } else {
            await addFavorite({
                id: color,
                hex: color,
                name: activeMatch.pencil.name,
                brand: activeMatch.pencil.brand,
                pencilId: getPencilId(activeMatch.pencil)
            });
        }
    };

    const handleToggleInventory = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeMatch) togglePencil(activeMatch.pencil);
    };

    if (!color || !activeMatch) return null;

    const owned = isOwned(activeMatch.pencil);

    const confidenceColor = activeMatch.confidence > 90
        ? 'text-green-500'
        : activeMatch.confidence > 70
            ? 'text-yellow-500'
            : 'text-orange-500';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 p-4 pb-8 z-30 pointer-events-none"
            >
                <div className={cn(
                    "bg-[#0a0a0a] border border-white/20 shadow-2xl rounded-3xl mx-auto pointer-events-auto overflow-hidden transition-all duration-300 ease-in-out",
                    isCollapsed ? "max-w-[240px] p-2" : "max-w-[95vw] sm:max-w-md p-5",
                    isPicking && "opacity-100 scale-95 origin-bottom translate-y-4 shadow-primary/20"
                )}>
                    {/* Header compact quand réduit */}
                    {isCollapsed && (
                        <div className="flex items-center gap-3 px-2 py-1 cursor-pointer" onClick={() => setIsCollapsed(false)}>
                            <div className="w-10 h-10 rounded-xl border-2 border-white/20 shadow-inner shrink-0" style={{ backgroundColor: color }} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Match</p>
                                <h4 className="text-sm font-bold truncate leading-none text-white">
                                    {activeMatch.pencil.name}
                                </h4>
                            </div>
                            <button className="p-1.5 bg-white/10 rounded-full text-white">
                                <ChevronUp size={16} />
                            </button>
                        </div>
                    )}

                    {!isCollapsed && (
                        <div className="space-y-5">
                            {/* Section Couleur & Match Principal */}
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className="w-20 h-20 rounded-2xl border-2 border-white/20 shadow-inner flex-shrink-0 relative group cursor-pointer"
                                        style={{ backgroundColor: color }}
                                    >
                                        {/* Overlay discret si déjà favori */}
                                        {favorite && (
                                            <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg z-10">
                                                <Bookmark size={12} fill="white" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{color}</span>
                                </div>

                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            {overrideMatch ? "Alternative" : "Meilleur Match"}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-xs font-bold", confidenceColor)}>
                                                {activeMatch.confidence}%
                                            </span>
                                            <button onClick={() => setIsCollapsed(true)} className="text-muted-foreground hover:text-white transition-colors">
                                                <ChevronDown size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black leading-tight mb-0.5 truncate uppercase text-white">
                                        {activeMatch.pencil.name}
                                    </h3>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                                            {activeMatch.pencil.brand} • <span className="text-white/80">{activeMatch.pencil.id}</span>
                                        </p>
                                        
                                        {/* Bouton de suppression si favori */}
                                        {favorite && (
                                            <button 
                                                onClick={toggleFavorite}
                                                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                title="Supprimer des favoris"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleToggleInventory}
                                        className={cn(
                                            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all border transform-gpu active:scale-95",
                                            owned
                                                ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                                                : "bg-primary text-primary-foreground border-transparent hover:bg-primary/90"
                                        )}
                                    >
                                        {owned ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                                        {owned ? "Dans ma collection" : "Ajouter au stock"}
                                    </button>
                                </div>
                            </div>

                            {/* Alternatives (Horizontal Scroll) */}
                            {alternatives.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Teintes similaires</p>
                                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                                        {alternatives.map((alt) => (
                                            <button
                                                key={getPencilId(alt.pencil)}
                                                onClick={() => setOverrideMatch(alt)}
                                                className={cn(
                                                    "flex-shrink-0 w-28 p-2 rounded-2xl border transition-all text-left",
                                                    activeMatch.pencil.id === alt.pencil.id
                                                        ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                                                        : "bg-white/5 border-transparent hover:border-white/10"
                                                )}
                                            >
                                                <div className="w-full h-10 rounded-lg mb-2 border border-white/10" style={{ backgroundColor: alt.pencil.hex }} />
                                                <p className="text-[10px] font-bold truncate mb-0.5 text-white">{alt.pencil.name}</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] text-muted-foreground uppercase">{alt.pencil.id}</span>
                                                    {isOwned(alt.pencil) && <Check size={10} className="text-green-500" strokeWidth={3} />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions principales */}
                            <div className="flex flex-col gap-3 pt-2">
                                <div className="flex gap-3">
                                    {drawingId ? (
                                        <button
                                            onClick={async () => {
                                                await addPencilToDrawing(drawingId, getPencilId(activeMatch.pencil));
                                                setAddedToDrawing(true);
                                            }}
                                            disabled={addedToDrawing}
                                            className={cn(
                                                "flex-1 py-4 font-bold rounded-2xl transition-all border flex items-center justify-center gap-2 active:scale-95",
                                                addedToDrawing
                                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                    : "bg-white/10 hover:bg-white/20 text-white border-transparent"
                                            )}
                                        >
                                            {addedToDrawing ? <Check size={20} /> : <Bookmark size={20} />}
                                            <span>{addedToDrawing ? 'Ajouté' : 'Au dessin'}</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowDrawingPicker(true)}
                                            className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all border border-transparent flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <Bookmark size={20} />
                                            <span>Sauver</span>
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={handleSaveColor}
                                        disabled={isConfirming || isConfirmed}
                                        className={cn(
                                            "flex-[1.5] py-4 text-primary-foreground font-black rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl",
                                            isConfirmed 
                                                ? "bg-green-500 shadow-green-500/30" 
                                                : "bg-primary shadow-primary/30 hover:bg-primary/90"
                                        )}
                                    >
                                        {isConfirming ? (
                                            <Loader2 className="animate-spin" size={24} />
                                        ) : isConfirmed ? (
                                            <Check size={24} strokeWidth={4} />
                                        ) : (
                                            <Check size={24} strokeWidth={4} />
                                        )}
                                        <span className="text-lg">{isConfirmed ? "ENREGISTRÉ" : "VALIDER"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            <DrawingPicker
                isOpen={showDrawingPicker}
                onClose={() => setShowDrawingPicker(false)}
                onSelect={() => setShowDrawingPicker(false)}
                pencilId={getPencilId(activeMatch.pencil)}
            />
        </AnimatePresence>
    );
}

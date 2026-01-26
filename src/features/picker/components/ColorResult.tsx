import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPencilId } from '@/lib/color-utils';
import type { MatchResult } from '@/lib/color-utils';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { Check, Bookmark, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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
        }
    }, [color, isPicking]);

    const activeMatch = overrideMatch || match;

    const favorite = isFavorite(color || '');

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
                    "bg-card border shadow-2xl rounded-3xl mx-auto pointer-events-auto overflow-hidden transition-all duration-300 ease-in-out",
                    isCollapsed ? "max-w-[240px] p-2" : "max-w-[95vw] sm:max-w-md p-5",
                    isPicking && "opacity-60 scale-95 origin-bottom translate-y-4"
                )}>
                    {/* Header compact quand réduit */}
                    {isCollapsed && (
                        <div className="flex items-center gap-3 px-2 py-1 cursor-pointer" onClick={() => setIsCollapsed(false)}>
                            <div className="w-10 h-10 rounded-xl border-2 border-white/20 shadow-inner shrink-0" style={{ backgroundColor: color }} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Match</p>
                                <h4 className="text-sm font-bold truncate leading-none">
                                    {activeMatch.pencil.name}
                                </h4>
                            </div>
                            <button className="p-1.5 bg-secondary rounded-full">
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
                                        onClick={toggleFavorite}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-2xl">
                                            <Bookmark size={24} fill={favorite ? "white" : "none"} className="text-white" />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{color}</span>
                                </div>

                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            {overrideMatch ? "Alternative" : "Meilleur Match"}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <span className={cn("text-xs font-bold", confidenceColor)}>
                                                {activeMatch.confidence}%
                                            </span>
                                            <button onClick={() => setIsCollapsed(true)} className="text-muted-foreground hover:text-foreground">
                                                <ChevronDown size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black leading-tight mb-0.5 truncate uppercase">
                                        {activeMatch.pencil.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide mb-3">
                                        {activeMatch.pencil.brand} • <span className="text-foreground">{activeMatch.pencil.id}</span>
                                    </p>

                                    <button
                                        onClick={handleToggleInventory}
                                        className={cn(
                                            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all border-2 transform-gpu active:scale-95",
                                            owned
                                                ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
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
                                                        ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                                                        : "bg-secondary/30 border-transparent hover:border-border"
                                                )}
                                            >
                                                <div className="w-full h-10 rounded-lg mb-2 border border-white/10" style={{ backgroundColor: alt.pencil.hex }} />
                                                <p className="text-[10px] font-bold truncate mb-0.5">{alt.pencil.name}</p>
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
                                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                    : "bg-secondary/50 hover:bg-secondary text-foreground border-transparent hover:border-border"
                                            )}
                                        >
                                            {addedToDrawing ? <Check size={20} /> : <Bookmark size={20} />}
                                            <span>{addedToDrawing ? 'Ajouté' : 'Au dessin'}</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowDrawingPicker(true)}
                                            className="flex-1 py-4 bg-secondary/50 hover:bg-secondary text-foreground font-bold rounded-2xl transition-all border border-transparent hover:border-border flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <Bookmark size={20} />
                                            <span>Dessin</span>
                                        </button>
                                    )}
                                    
                                    {onConfirm && (
                                        <button
                                            onClick={onConfirm}
                                            className="flex-[1.5] py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/30"
                                        >
                                            <Check size={24} strokeWidth={4} />
                                            <span className="text-lg">VALIDER</span>
                                        </button>
                                    )}
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

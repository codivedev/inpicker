import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPencilId, hexToRgb } from '@/lib/color-utils';
import type { MatchResult } from '@/lib/color-utils';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { Check, X, Info, Bookmark, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrawingPicker } from '@/features/drawings/components/DrawingPicker';
import { useDrawings } from '@/features/drawings/hooks/useDrawings';
import { useFavorites } from '@/hooks/useFavorites';

interface ColorResultProps {
    color: string | null;
    match: MatchResult | null;
    alternatives: MatchResult[];
    drawingId?: number;
    onConfirm?: () => void;
    isPicking?: boolean;
}

type ViewMode = 'summary' | 'alternatives' | 'details';

export function ColorResult({ color, match, alternatives, drawingId, onConfirm, isPicking }: ColorResultProps) {
    const { isOwned, togglePencil } = useInventory();
    const { addPencilToDrawing } = useDrawings();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const [viewMode, setViewMode] = useState<ViewMode>('summary');
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

    if (!color || !activeMatch) return null;

    const favorite = isFavorite(color);

    const toggleFavorite = async () => {
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
        togglePencil(activeMatch.pencil);
    };

    const owned = isOwned(activeMatch.pencil);

    const confidenceColor = activeMatch.confidence > 90
        ? 'text-green-500'
        : activeMatch.confidence > 70
            ? 'text-yellow-500'
            : 'text-orange-500';

    const rgb = hexToRgb(color);

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
                     isCollapsed ? "max-w-[200px] p-2" : "max-w-md p-6",
                     isPicking && "opacity-60 scale-95 origin-bottom"
                 )}>

                    {/* Header dynamique */}
                    <div className={cn(
                        "flex items-center justify-between",
                        isCollapsed ? "mb-0" : "mb-4"
                    )}>
                        {!isCollapsed && (
                            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                {viewMode === 'summary' && "Résultat du Picking"}
                                {viewMode === 'alternatives' && "Alternatives Proches"}
                                {viewMode === 'details' && "Détails Techniques"}
                            </h2>
                        )}

                        {isCollapsed && (
                            <div className="flex items-center gap-2 pl-1 flex-1 min-w-0">
                                <div
                                    className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-xs font-bold truncate">
                                    {activeMatch.pencil.brand === 'BRUTFUNER' ? `B${activeMatch.pencil.id}` : activeMatch.pencil.name}
                                </span>
                                {onConfirm && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onConfirm();
                                        }}
                                        className="ml-auto p-1 bg-primary text-primary-foreground rounded-full"
                                    >
                                        <Check size={14} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="p-1.5 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
                                title={isCollapsed ? "Agrandir" : "Réduire"}
                            >
                                {isCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {viewMode !== 'summary' && !isCollapsed && (
                                <button
                                    onClick={() => setViewMode('summary')}
                                    className="p-1 hover:bg-secondary rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    {!isCollapsed && (
                        <>
                            <AnimatePresence mode="wait">
                                {viewMode === 'summary' && (
                                    <motion.div
                                        key="summary"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex items-start gap-4"
                                    >
                                        {/* Couleur Pickée */}
                                        <div className="flex flex-col items-center gap-2">
                                            <div
                                                className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-inner"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className="text-xs font-mono text-muted-foreground uppercase">{color}</span>
                                        </div>

                                        {/* Séparateur */}
                                        <div className="w-px h-16 bg-border mx-2" />

                                        {/* Résultat Match */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                                    {overrideMatch ? "Alternative Choisie" : "Meilleur Match"}
                                                </span>
                                                <span className={cn("text-xs font-bold", confidenceColor)}>
                                                    {activeMatch.confidence}%
                                                </span>
                                            </div>

                                            <h3 className="text-xl font-bold leading-tight mb-1 truncate flex items-center gap-2">
                                                {activeMatch.pencil.name}
                                                {activeMatch.pencil.brand === 'BRUTFUNER' && (
                                                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-tighter">B180</span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-foreground/70 mb-3">
                                                {activeMatch.pencil.brand} • <span className="font-mono bg-secondary px-1 rounded text-xs">{activeMatch.pencil.id}</span>
                                            </p>

                             {/* Primary CTA - More prominent */}
                                             <button
                                                 onClick={handleToggleInventory}
                                                 className={cn(
                                                     "w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl active:scale-95 transform-gpu",
                                                     owned
                                                         ? "bg-green-500/15 text-green-600 border-2 border-green-500/30 hover:bg-green-500/25"
                                                         : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30"
                                                 )}
                                             >
                                                 {owned ? (
                                                     <>
                                                         <Check size={20} strokeWidth={3} />
                                                         <span className="font-bold">Dans ma collection</span>
                                                     </>
                                                 ) : (
                                                     <>
                                                         <Plus size={20} strokeWidth={3} />
                                                         <span className="font-bold">Ajouter à ma collection</span>
                                                     </>
                                                 )}
                                             </button>
                                        </div>

                                        {/* Couleur Crayon (Visual Strip) */}
                                        <div
                                            className="w-6 h-full min-h-[100px] rounded-full border-2 border-white/20 shadow-inner relative overflow-hidden ml-2"
                                            style={{ backgroundColor: activeMatch.pencil.hex }}
                                            title="Couleur du crayon"
                                        />
                                    </motion.div>
                                )}

                                {viewMode === 'alternatives' && (
                                    <motion.div
                                        key="alternatives"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-3"
                                    >
                                        {alternatives.map((alt) => (
                                            <div
                                                key={getPencilId(alt.pencil)}
                                                onClick={() => {
                                                    setOverrideMatch(alt);
                                                    setViewMode('summary');
                                                    setAddedToDrawing(false);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 p-2 rounded-2xl border transition-colors cursor-pointer group",
                                                    overrideMatch?.pencil.id === alt.pencil.id 
                                                        ? "bg-primary/10 border-primary/30" 
                                                        : "bg-secondary/50 border-transparent hover:border-border"
                                                )}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-xl shadow-sm border border-white/20"
                                                    style={{ backgroundColor: alt.pencil.hex }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold truncate">{alt.pencil.name}</h4>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {alt.pencil.brand} • <span className="font-mono bg-secondary px-1 rounded text-[10px]">{alt.pencil.id}</span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-muted-foreground">{alt.confidence}%</span>
                                                    {isOwned(alt.pencil) && (
                                                        <Check size={14} className="text-green-500 ml-auto mt-0.5" strokeWidth={3} />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {viewMode === 'details' && (
                                    <motion.div
                                        key="details"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-secondary/30 rounded-2xl border">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Cible (Photo)</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-sm border" style={{ backgroundColor: color }} />
                                                    <span className="text-sm font-mono truncate">{color}</span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">RGB: {rgb.r}, {rgb.g}, {rgb.b}</p>
                                            </div>
                                            <div className="p-3 bg-secondary/30 rounded-2xl border">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Match (Crayon)</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-sm border" style={{ backgroundColor: activeMatch.pencil.hex }} />
                                                    <span className="text-sm font-mono truncate">{activeMatch.pencil.hex}</span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">Delta E: {activeMatch.distance.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                            <div className="flex items-center gap-2 mb-2 text-primary font-bold text-sm">
                                                <Info size={16} />
                                                Informations Crochet
                                            </div>
                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                Ce match est calculé avec l'algorithme CIEDE2000.
                                                Un Delta E inférieur à 2.0 est considéré comme indétectable par l'œil humain.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Boutons Actions Secondaires */}
                            {viewMode === 'summary' && (
                                <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
                                     {/* Bouton Valider - More prominent and professional */}
                                     {onConfirm && (
                                         <button
                                             onClick={onConfirm}
                                             className="flex-1 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transform-gpu"
                                         >
                                             <Check size={24} strokeWidth={3} />
                                             <span className="font-bold text-lg">Valider la couleur</span>
                                         </button>
                                     )}

                             {/* Bouton Favoris - Improved */}
                                     <button
                                         onClick={toggleFavorite}
                                         className={cn(
                                             "p-3 rounded-xl transition-colors border-2",
                                             favorite
                                                 ? "bg-rose-500/15 text-rose-500 border-rose-500/30 hover:bg-rose-500/25"
                                                 : "bg-secondary/50 hover:bg-secondary text-muted-foreground border-transparent hover:border-border"
                                         )}
                                         title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                                     >
                                         <Bookmark size={22} fill={favorite ? "currentColor" : "none"} strokeWidth={favorite ? 2 : 1.5} />
                                     </button>

                                    {/* Bouton ajout au dessin */}
                                    {drawingId ? (
                                        <button
                                            onClick={async () => {
                                                await addPencilToDrawing(drawingId, getPencilId(activeMatch.pencil));
                                                setAddedToDrawing(true);
                                            }}
                                            disabled={addedToDrawing}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors border",
                                                addedToDrawing
                                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/20"
                                            )}
                                        >
                                            {addedToDrawing ? <Check size={18} /> : <Plus size={18} />}
                                            {addedToDrawing ? 'Ajouté au dessin' : 'Ajouter au dessin'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowDrawingPicker(true)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground font-medium transition-colors border border-transparent"
                                            title="Ajouter à un dessin"
                                        >
                                            <Bookmark size={18} />
                                            <span>Ajouter à un dessin</span>
                                        </button>
                                    )}

                                    {/* More Options / View Switcher */}
                                    <div className="flex bg-secondary/50 rounded-xl p-1 border border-transparent">
                                        <button
                                            onClick={() => setViewMode('alternatives')}
                                            className="p-2 rounded-lg hover:bg-background text-muted-foreground transition-colors"
                                            title="Voir les alternatives"
                                        >
                                            <div className="flex -space-x-1">
                                                <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                                                <div className="w-2 h-2 rounded-full bg-current opacity-80" />
                                                <div className="w-2 h-2 rounded-full bg-current" />
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setViewMode('details')}
                                            className="p-2 rounded-lg hover:bg-background text-muted-foreground transition-colors"
                                            title="Voir les détails"
                                        >
                                            <Info size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </motion.div>

            {/* Drawing Picker Modal */}
            <DrawingPicker
                isOpen={showDrawingPicker}
                onClose={() => setShowDrawingPicker(false)}
                onSelect={() => setShowDrawingPicker(false)}
                pencilId={getPencilId(activeMatch.pencil)}
            />
        </AnimatePresence>
    );
}

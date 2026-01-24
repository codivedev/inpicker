import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPencilId, hexToRgb } from '@/lib/color-utils';
import type { MatchResult } from '@/lib/color-utils';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { Check, AlertTriangle, X, Info, Bookmark, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrawingPicker } from '@/features/drawings/components/DrawingPicker';
import { useDrawings } from '@/features/drawings/hooks/useDrawings';

interface ColorResultProps {
    color: string | null;
    match: MatchResult | null;
    alternatives: MatchResult[];
    drawingId?: number;
}

type ViewMode = 'summary' | 'alternatives' | 'details';

export function ColorResult({ color, match, alternatives, drawingId }: ColorResultProps) {
    const { isOwned } = useInventory();
    const { addPencilToDrawing } = useDrawings();
    const [viewMode, setViewMode] = useState<ViewMode>('summary');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showDrawingPicker, setShowDrawingPicker] = useState(false);
    const [addedToDrawing, setAddedToDrawing] = useState(false);
    const [overrideMatch, setOverrideMatch] = useState<MatchResult | null>(null);

    // Ré-agrandir si une nouvelle couleur est pickée
    useEffect(() => {
        if (color) {
            setIsCollapsed(false);
            setOverrideMatch(null);
            setAddedToDrawing(false);
        }
    }, [color]);

    const activeMatch = overrideMatch || match;

    if (!color || !activeMatch) return null;

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
                className="fixed bottom-0 left-0 right-0 p-4 pb-8 z-30 pointer-events-none"
            >
                <div className={cn(
                    "bg-card border shadow-2xl rounded-3xl mx-auto pointer-events-auto overflow-hidden transition-all duration-300 ease-in-out",
                    isCollapsed ? "max-w-[200px] p-2" : "max-w-md p-5"
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
                                <div className="flex items-center gap-2 pl-1">
                                <div
                                    className="w-4 h-4 rounded-full border border-white/20"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-xs font-bold truncate max-w-[100px]">
                                    {activeMatch.pencil.name}
                                </span>
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
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                                    {overrideMatch ? "Alternative Choisie" : "Meilleur Match"}
                                                </span>
                                                <span className={cn("text-xs font-bold", confidenceColor)}>
                                                    {activeMatch.confidence}%
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold leading-tight mb-1">
                                                {activeMatch.pencil.name}
                                            </h3>
                                            <p className="text-sm text-foreground/70 mb-2">
                                                {activeMatch.pencil.brand} • <span className="font-mono bg-secondary px-1 rounded text-xs">{activeMatch.pencil.id}</span>
                                            </p>

                                            <div className="flex items-center gap-2">
                                                {owned ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                                                        <Check size={12} strokeWidth={3} />
                                                        Possédé
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full">
                                                        <AlertTriangle size={12} strokeWidth={2} />
                                                        À acheter
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Couleur Crayon */}
                                        <div
                                            className="w-8 h-full min-h-[80px] rounded-r-xl border-l-4 border-black/10 relative overflow-hidden"
                                            style={{ backgroundColor: activeMatch.pencil.hex }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
                                        </div>
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

                            {/* Boutons Actions */}
                            {viewMode === 'summary' && (
                                <div className="mt-4 pt-4 border-t flex space-x-2">
                                    {/* Bouton ajout au dessin - différent selon le contexte */}
                                    {drawingId ? (
                                        <button
                                            onClick={async () => {
                                                await addPencilToDrawing(drawingId, getPencilId(activeMatch.pencil));
                                                setAddedToDrawing(true);
                                            }}
                                            disabled={addedToDrawing}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                                                addedToDrawing
                                                    ? "bg-green-500/10 text-green-500"
                                                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500"
                                            )}
                                        >
                                            {addedToDrawing ? <Check size={16} /> : <Plus size={16} />}
                                            {addedToDrawing ? 'Ajouté' : 'Ajouter'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowDrawingPicker(true)}
                                            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors"
                                            title="Ajouter à un dessin"
                                        >
                                            <Bookmark size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setViewMode('alternatives')}
                                        className="flex-1 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors"
                                    >
                                        Alternatives
                                    </button>
                                    <button
                                        onClick={() => setViewMode('details')}
                                        className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors shadow-sm"
                                    >
                                        Détails
                                    </button>
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

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, CheckCircle } from 'lucide-react';
import { useInventory } from '@/features/inventory/hooks/useInventory';


interface PencilPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (pencilIds: string[]) => void;
    excludedPencilIds?: string[];
}

export function PencilPicker({ isOpen, onClose, onSelect, excludedPencilIds = [] }: PencilPickerProps) {
    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [selectedPencils, setSelectedPencils] = useState<string[]>([]);
    const { isOwned, pencilsByBrand } = useInventory();

    const allPencils = useMemo(() => Object.values(pencilsByBrand).flat(), [pencilsByBrand]);

    // Récupérer les marques uniques
    const brands = useMemo(() => {
        const uniqueBrands = Object.keys(pencilsByBrand);
        return uniqueBrands.sort();
    }, [pencilsByBrand]);

    // Filtrer et trier les crayons par ID naturellement
    const filteredPencils = useMemo(() => {
        const filtered = allPencils.filter(pencil => {
            const pencilId = `${pencil.brand}|${pencil.id}`;

            if (excludedPencilIds.includes(pencilId)) return false;
            if (selectedBrand && pencil.brand !== selectedBrand) return false;
            if (search) {
                const searchLower = search.toLowerCase();
                return (
                    pencil.name.toLowerCase().includes(searchLower) ||
                    pencil.id.toLowerCase().includes(searchLower) ||
                    pencil.brand.toLowerCase().includes(searchLower)
                );
            }
            return true;
        });

        return filtered.sort((a, b) => {
            return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [search, selectedBrand, excludedPencilIds]);

    // Utiliser useCallback pour éviter les re-renders inutiles
    const handleTogglePencil = useCallback((pencilId: string) => {
        setSelectedPencils(prev =>
            prev.includes(pencilId)
                ? prev.filter(id => id !== pencilId)
                : [...prev, pencilId]
        );
    }, []);

    const handleConfirm = useCallback(() => {
        if (selectedPencils.length > 0) {
            onSelect(selectedPencils);
        }
        setSelectedPencils([]);
        setSearch('');
        setSelectedBrand(null);
        onClose();
    }, [selectedPencils, onSelect, onClose]);

    const handleClose = useCallback(() => {
        setSelectedPencils([]);
        setSearch('');
        setSelectedBrand(null);
        onClose();
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center"
                    style={{ touchAction: 'none' }} // Empêche les gestes par défaut sur le container
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-card w-full max-w-lg rounded-t-3xl relative z-10 shadow-2xl border-t max-h-[85vh] overflow-hidden flex flex-col"
                        style={{ touchAction: 'pan-y' }} // Permet uniquement le scroll vertical
                    >
                        {/* Header */}
                        <div className="p-4 border-b flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold">Ajouter des crayons</h3>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-secondary active:bg-secondary rounded-full transition-colors"
                                type="button"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b shrink-0">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    inputMode="search"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    placeholder="Rechercher un crayon..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border-none outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            {/* Filtres par marque - scroll horizontal optimisé mobile */}
                            <div
                                className="flex gap-2 mt-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
                                style={{
                                    WebkitOverflowScrolling: 'touch',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelectedBrand(null)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors select-none ${!selectedBrand
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary hover:bg-secondary/80 active:bg-secondary/60'
                                        }`}
                                >
                                    Toutes
                                </button>
                                {brands.map(brand => (
                                    <button
                                        key={brand}
                                        type="button"
                                        onClick={() => setSelectedBrand(brand)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors select-none ${selectedBrand === brand
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary hover:bg-secondary/80 active:bg-secondary/60'
                                            }`}
                                    >
                                        {brand}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Liste des crayons - scroll optimisé pour mobile */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-2 overscroll-contain"
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                touchAction: 'pan-y'
                            }}
                        >
                            {filteredPencils.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>Aucun crayon trouvé</p>
                                </div>
                            ) : (
                                    filteredPencils.slice(0, 500).map(pencil => {
                                        const pencilId = `${pencil.brand}|${pencil.id}`;
                                    const owned = isOwned(pencil as any);
                                    const isSelected = selectedPencils.includes(pencilId);

                                    return (
                                        <div
                                            key={pencilId}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => handleTogglePencil(pencilId)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleTogglePencil(pencilId)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer select-none ${isSelected
                                                    ? 'bg-primary/20 border-2 border-primary'
                                                    : 'bg-secondary/30 active:bg-secondary/50 border border-transparent'
                                                }`}
                                            style={{
                                                WebkitTapHighlightColor: 'transparent',
                                                touchAction: 'manipulation' // Empêche le double-tap zoom
                                            }}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-lg border shadow-sm shrink-0 relative pointer-events-none"
                                                style={{ backgroundColor: pencil.hex }}
                                            >
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                                        <Check size={12} className="text-primary-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pointer-events-none">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium truncate">{pencil.name}</h4>
                                                    {owned && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium flex items-center gap-0.5">
                                                            <CheckCircle size={10} /> Possédé
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {pencil.brand} • {pencil.id}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {filteredPencils.length > 500 && (
                                <p className="text-center text-xs text-muted-foreground py-2">
                                    + {filteredPencils.length - 500} autres crayons (affinez votre recherche)
                                </p>
                            )}
                        </div>

                        {/* Footer avec bouton de confirmation - safe area pour iOS */}
                        <div
                            className="p-4 border-t shrink-0 bg-background/95 backdrop-blur-sm"
                            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                        >
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={selectedPencils.length === 0}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all select-none ${selectedPencils.length > 0
                                        ? 'bg-primary text-primary-foreground shadow-lg active:scale-[0.98] active:bg-primary/90'
                                        : 'bg-secondary text-muted-foreground cursor-not-allowed'
                                    }`}
                                style={{
                                    WebkitTapHighlightColor: 'transparent',
                                    touchAction: 'manipulation'
                                }}
                            >
                                {selectedPencils.length === 0
                                    ? 'Sélectionnez des crayons'
                                    : `Ajouter ${selectedPencils.length} crayon${selectedPencils.length > 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

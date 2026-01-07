import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Search, Plus, X, Pipette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../hooks/useInventory';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ColorScanner } from '@/features/picker/components/ColorScanner';

export function InventoryManager() {
    const navigate = useNavigate();
    const { pencilsByBrand, togglePencil, addCustomPencil, isOwned, ownedCount, totalCount } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // Form State
    const [newBrand, setNewBrand] = useState('');
    const [newName, setNewName] = useState('');
    const [newNumber, setNewNumber] = useState('');
    const [newHex, setNewHex] = useState('#000000');

    // Liste des marques triée
    const brands = Object.keys(pencilsByBrand).sort();

    const handleCreatePencil = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBrand || !newName || !newNumber) return;

        await addCustomPencil(newBrand, newName, newNumber, newHex);

        // Reset & Close
        setNewBrand('');
        setNewName('');
        setNewNumber('');
        setNewHex('#000000');
        setIsAddingMode(false);
    };

    const handleScanColor = (hex: string) => {
        setNewHex(hex);
        setIsScanning(false);
    };

    if (isScanning) {
        return <ColorScanner onColorSelected={handleScanColor} onCancel={() => setIsScanning(false)} />;
    }

    return (
        <div className="min-h-screen bg-background pb-20 relative">
            {/* Header Sticky */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
                <button
                    onClick={() => navigate('/tableau-de-bord')}
                    className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold">Mes Crayons</h1>
                <div className="text-xs font-medium bg-secondary px-3 py-1 rounded-full">
                    {ownedCount} / {totalCount}
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 sticky top-[60px] z-20 bg-background/95 pb-2 pt-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher un crayon (nom, numéro)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary/50 outline-none text-sm transition-all"
                    />
                </div>
            </div>

            {/* Liste par Marque */}
            {brands.map(brand => {
                const pencils = pencilsByBrand[brand].filter(p =>
                    searchTerm === '' ||
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.id.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (pencils.length === 0) return null;

                return (
                    <div key={brand} className="mb-6">
                        <h2 className="px-6 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider sticky top-[110px] bg-background/95 backdrop-blur-sm z-10">
                            {brand}
                        </h2>
                        <div className="grid grid-cols-1 gap-1 px-4">
                            {pencils.map(pencil => {
                                const owned = isOwned(pencil);
                                return (
                                    <motion.div
                                        key={`${pencil.brand}-${pencil.id}`}
                                        layoutId={`${pencil.brand}-${pencil.id}`}
                                        onClick={() => togglePencil(pencil)}
                                        className={cn(
                                            "flex items-center p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98]",
                                            owned ? "bg-primary/10 border border-primary/20" : "bg-card border border-border hover:border-border/80"
                                        )}
                                    >
                                        {/* Pastille Couleur */}
                                        <div
                                            className="w-10 h-10 rounded-full border border-black/10 shadow-sm mr-4 relative shrink-0"
                                            style={{ backgroundColor: pencil.hex }}
                                        >
                                            {owned && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                                                    <Check size={16} className="text-white drop-shadow-md" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <span className={cn("font-medium truncate", owned ? "text-primary-foreground dark:text-primary" : "")}>
                                                    {pencil.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground ml-2 font-mono">
                                                    {pencil.id}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate opacity-70">
                                                {pencil.brand}
                                            </div>
                                        </div>


                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 ml-4 flex items-center justify-center transition-colors",
                                            owned ? "border-primary bg-primary text-white" : "border-muted-foreground/30"
                                        )}>
                                            {owned && <Check size={12} strokeWidth={4} />}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )
            })}

            {/* FAB Add Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddingMode(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-40"
            >
                <Plus size={28} />
            </motion.button>

            {/* Modal Ajout */}
            <AnimatePresence>
                {isAddingMode && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddingMode(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-card w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl border"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Ajouter un crayon</h3>
                                <button onClick={() => setIsAddingMode(false)} className="p-2 bg-secondary rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreatePencil} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Marque (ex: Caran d'Ache)</label>
                                    <input
                                        required
                                        value={newBrand}
                                        onChange={e => setNewBrand(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-secondary/50 border-none outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Nom de la marque"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Numéro (ID)</label>
                                        <input
                                            required
                                            value={newNumber}
                                            onChange={e => setNewNumber(e.target.value)}
                                            className="w-full p-3 rounded-xl bg-secondary/50 border-none outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="ex: PC901"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Couleur</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={newHex}
                                                onChange={e => setNewHex(e.target.value)}
                                                className="h-11 w-full flex-1 rounded-xl cursor-pointer border-none bg-transparent p-0"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsScanning(true)}
                                                className="p-3 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
                                            >
                                                <Pipette size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Nom de la couleur</label>
                                    <input
                                        required
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-secondary/50 border-none outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="ex: Indigo Blue"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg mt-4 active:scale-[0.98] transition-transform"
                                >
                                    Créer et Ajouter à ma collection
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

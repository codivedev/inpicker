import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Search, Plus, X, Pipette, Edit2, Trash2, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../hooks/useInventory';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ColorScanner } from '@/features/picker/components/ColorScanner';
import type { Pencil } from '@/types/pencil';

export function InventoryManager() {
    const navigate = useNavigate();
    const { 
        pencilsByBrand, 
        togglePencil, 
        addCustomPencil, 
        updateCustomPencil, 
        deleteCustomPencil, 
        hidePencil,
        isOwned, 
        ownedCount, 
        totalCount,
        customBrands,
        createCustomBrand,
        deleteCustomBrand
    } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [isBrandMode, setIsBrandMode] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [editingPencil, setEditingPencil] = useState<Pencil | null>(null);

    // Form State
    const [newBrand, setNewBrand] = useState('');
    const [newName, setNewName] = useState('');
    const [newNumber, setNewNumber] = useState('');
    const [newHex, setNewHex] = useState('#000000');
    const [isCreatingBrand, setIsCreatingBrand] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const [brandInput, setBrandInput] = useState('');

    const handleOpenAdd = () => {
        setEditingPencil(null);
        setNewBrand('');
        setNewName('');
        setNewNumber('');
        setNewHex('#000000');
        setIsCreatingBrand(false);
        setNewBrandName('');
        setIsAddingMode(true);
    };

    const handleOpenEdit = (pencil: Pencil, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingPencil(pencil);
        setNewBrand(pencil.brand);
        setNewName(pencil.name);
        setNewNumber(pencil.id);
        setNewHex(pencil.hex);
        setIsAddingMode(true);
    };

    const handleDeletePencil = async (pencil: Pencil, e: React.MouseEvent) => {
        e.stopPropagation();
        const message = pencil.isCustom 
            ? `Supprimer le crayon "${pencil.name}" ?`
            : `Masquer le crayon "${pencil.name}" de votre collection ?\n\nNote : Vous ne pourrez plus le voir dans la liste.`;

        if (window.confirm(message)) {
            if (pencil.isCustom) {
                await deleteCustomPencil(`${pencil.brand}|${pencil.id}`);
            } else {
                await hidePencil(pencil);
            }
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBrand || !newName || !newNumber) return;

        if (editingPencil) {
            await updateCustomPencil(`${editingPencil.brand}|${editingPencil.id}`, {
                brand: newBrand,
                name: newName,
                number: newNumber,
                hex: newHex
            });
        } else {
            await addCustomPencil(newBrand, newName, newNumber, newHex);
        }

        // Reset & Close
        handleCloseModal();
    };

    const handleBrandSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'nouvelle') {
            setIsCreatingBrand(true);
            setNewBrand('');
        } else {
            setIsCreatingBrand(false);
            setNewBrand(value);
        }
    };

    const handleCreateBrand = async () => {
        const name = isBrandMode ? brandInput.trim() : newBrandName.trim();
        if (!name) return;
        
        try {
            await createCustomBrand(name);
            if (!isBrandMode) {
                setNewBrand(name);
                setIsCreatingBrand(false);
                setNewBrandName('');
            } else {
                setBrandInput('');
            }
        } catch (error) {
            console.error('Failed to create brand:', error);
            alert('Erreur lors de la création de la catégorie');
        }
    };

    const handleDeleteBrand = async (id: string, name: string) => {
        if (window.confirm(`Supprimer la catégorie "${name}" ?\n\nNote : Les crayons associés resteront dans votre inventaire mais ne seront plus regroupés sous cette catégorie.`)) {
            try {
                await deleteCustomBrand(id);
            } catch (error) {
                console.error('Failed to delete brand:', error);
                alert('Erreur lors de la suppression');
            }
        }
    };

    const handleCloseModal = () => {
        setNewBrand('');
        setNewName('');
        setNewNumber('');
        setNewHex('#000000');
        setEditingPencil(null);
        setIsAddingMode(false);
        setIsCreatingBrand(false);
        setNewBrandName('');
    };


    const handleScanColor = (hex: string) => {
        setNewHex(hex);
        setIsScanning(false);
    };

    if (isScanning) {
        return <ColorScanner 
            isCustomAdd={true}
            onColorSelected={handleScanColor} 
            onCancel={() => setIsScanning(false)} 
        />;
    }

    return (
        <div className="min-h-screen bg-background pb-20 relative">
            {/* Header Sticky */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/tableau-de-bord')}
                        className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold ml-2">Mes Crayons</h1>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsBrandMode(true)}
                        className="p-2 rounded-full hover:bg-muted/50 transition-colors relative"
                        title="Gérer les catégories"
                    >
                        <Tag size={20} />
                        {customBrands.length > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                        )}
                    </button>
                    <div className="text-xs font-medium bg-secondary px-3 py-1 rounded-full">
                        {ownedCount} / {totalCount}
                    </div>
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
            {Object.keys(pencilsByBrand).map(brand => {
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

                                            <div className="flex items-center gap-1 ml-2">
                                                {pencil.isCustom && (
                                                    <button
                                                        onClick={(e) => handleOpenEdit(pencil, e)}
                                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => handleDeletePencil(pencil, e)}
                                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 ml-2 flex items-center justify-center transition-colors",
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
                onClick={handleOpenAdd}
                className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-40"
            >
                <Plus size={28} />
            </motion.button>

            {/* Modal Ajout/Edit */}
            <AnimatePresence>
                {isAddingMode && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-card w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl border"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">{editingPencil ? 'Modifier' : 'Ajouter'} un crayon</h3>
                                <button onClick={handleCloseModal} className="p-2 bg-secondary rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Marque</label>
                                    <select
                                        required
                                        value={newBrand}
                                        onChange={handleBrandSelect}
                                        className="w-full p-3 rounded-xl bg-secondary/50 border-none outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="">Sélectionner une marque</option>
                                        <option value="nouvelle">+ Ajouter une nouvelle marque</option>
                                        {/* Built-in brands */}
                                        {Object.keys(pencilsByBrand).filter(brand => 
                                            !customBrands.some((cb: { name: string }) => cb.name === brand)
                                        ).sort().map((brand: string) => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                        {/* Custom brands */}
                                        {customBrands.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)).map((brand: { id: string; name: string }) => (
                                            <option key={brand.id} value={brand.name}>{brand.name} (personnalisé)</option>
                                        ))}
                                    </select>
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
                                        {editingPencil ? 'Enregistrer les modifications' : 'Créer et Ajouter à ma collection'}
                                    </button>
                                    
                                    {isCreatingBrand && (
                                        <div className="space-y-4 mt-4 p-4 bg-primary/10 rounded-xl">
                                            <p className="text-sm text-primary-foreground">
                                                Créer une nouvelle marque :
                                            </p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newBrandName}
                                                    onChange={(e) => setNewBrandName(e.target.value)}
                                                    placeholder="Nom de la marque"
                                                    className="flex-1 p-3 rounded-xl bg-background/50 border-none outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCreateBrand}
                                                    className="px-4 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
                                                >
                                                    Créer
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsCreatingBrand(false);
                                                        setNewBrandName('');
                                                    }}
                                                    className="px-4 py-3 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-colors"
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        </div>
                                    )}
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Gestion des Catégories (Marques) */}
            <AnimatePresence>
                {isBrandMode && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsBrandMode(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-card w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl border"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Gérer les catégories</h3>
                                <button onClick={() => setIsBrandMode(false)} className="p-2 bg-secondary rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Ajouter une marque */}
                                <form onSubmit={(e) => { e.preventDefault(); handleCreateBrand(); }} className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Nouvelle catégorie</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={brandInput}
                                            onChange={(e) => setBrandInput(e.target.value)}
                                            placeholder="Ex: Marque personnalisée"
                                            className="flex-1 p-3 rounded-xl bg-secondary/50 border-none outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                        <button
                                            type="submit"
                                            className="px-4 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </form>

                                {/* Liste des marques personnalisées */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Mes Catégories</h4>
                                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                        {customBrands.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic p-4 text-center bg-secondary/20 rounded-xl">
                                                Aucune catégorie personnalisée
                                            </p>
                                        ) : (
                                            customBrands.map((brand: { id: string; name: string }) => (
                                                <div key={brand.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl group">
                                                    <span className="font-medium">{brand.name}</span>
                                                    <button
                                                        onClick={() => handleDeleteBrand(brand.id, brand.name)}
                                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                                    Les catégories par défaut (Polychromos, Luminance, etc.) ne peuvent pas être supprimées.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


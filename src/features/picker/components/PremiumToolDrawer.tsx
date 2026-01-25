import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Pipette, ZoomIn, Save, Share2, Plus, Minus, Palette, Pencil, SlidersHorizontal, X, Check, ChevronDown, RotateCcw, Search, Sparkles } from 'lucide-react';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import type { Pencil as PencilType } from '@/types/pencil';

interface PencilBrand {
    id: string;
    name: string;
}

export function PremiumToolDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'color' | 'pencils' | 'actions'>('color');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isPipetteActive, setIsPipetteActive] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [quickAddMode, setQuickAddMode] = useState(false);
    const [quickAddPencils, setQuickAddPencils] = useState<PencilType[]>([]);
    const drawerRef = useRef<HTMLDivElement>(null);

    // Use the inventory hook to get real pencil data
    const { 
        pencilsByBrand, 
        togglePencil, 
        isOwned, 
        ownedCount, 
        totalCount,
        loading 
    } = useInventory();

    // Extract brands from the actual pencil data
    const brands: PencilBrand[] = Object.keys(pencilsByBrand || {}).map(brandName => ({
        id: brandName.toLowerCase().replace(/\s+/g, '-'),
        name: brandName
    }));

    // Convert pencils to flat array for filtering
    const allPencils: PencilType[] = Object.values(pencilsByBrand || {}).flat();

    // Filter pencils based on search term and brand selection
    const filteredPencils = allPencils.filter(pencil => {
        const matchesSearch = searchTerm === '' ||
            pencil.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pencil.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesBrand = selectedBrand === 'all' || 
            pencil.brand.toLowerCase().replace(/\s+/g, '-') === selectedBrand;
        
        return matchesSearch && matchesBrand;
    });

    // Group filtered pencils by brand for display
    const filteredPencilsByBrand = filteredPencils.reduce((acc, pencil) => {
        if (!acc[pencil.brand]) {
            acc[pencil.brand] = [];
        }
        acc[pencil.brand].push(pencil);
        return acc;
    }, {} as Record<string, PencilType[]>);

    const toggleDrawer = () => {
        setIsOpen(!isOpen);
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 10, 200));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 10, 50));
    };

    const resetZoom = () => {
        setZoomLevel(100);
    };

    const togglePipette = () => {
        setIsPipetteActive(!isPipetteActive);
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    const handleQuickAdd = (pencil: PencilType) => {
        togglePencil(pencil);
        setQuickAddMode(false);
    };

    const toggleQuickAddMode = () => {
        setQuickAddMode(!quickAddMode);
        if (!quickAddMode) {
            // Show top 12 most vibrant pencils for quick selection
            const vibrantPencils = [...allPencils]
                .sort((a, b) => {
                    // Simple vibrancy calculation based on color saturation
                    const aSaturation = calculateSaturation(a.rgb);
                    const bSaturation = calculateSaturation(b.rgb);
                    return bSaturation - aSaturation;
                })
                .slice(0, 12);
            setQuickAddPencils(vibrantPencils);
        }
    };

    const calculateSaturation = (rgb: { r: number; g: number; b: number }) => {
        const { r, g, b } = rgb;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        const lightness = (max + min) / 2;
        
        if (delta === 0) return 0;
        
        return delta / (1 - Math.abs(2 * lightness - 1));
    };

    // Handle clicks outside the drawer
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setQuickAddMode(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
            {/* Toggle Button */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleDrawer}
                className={cn(
                    "p-3 rounded-full shadow-lg transition-all duration-200 backdrop-blur-md flex items-center justify-center",
                    isOpen
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                        : "bg-background/60 hover:bg-background/80 text-foreground border border-border"
                )}
                title={isOpen ? "Close Tool Drawer" : "Open Tool Drawer"}
            >
                <SlidersHorizontal size={24} className={cn("transition-transform", isOpen ? "rotate-90" : "")} />
            </motion.button>

            {/* Quick Add Button (always visible when drawer is closed) */}
            {!isOpen && (
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleQuickAddMode}
                    className={cn(
                        "p-3 rounded-full shadow-lg transition-all duration-200 backdrop-blur-md flex items-center justify-center mt-2",
                        quickAddMode
                            ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                            : "bg-background/60 hover:bg-background/80 text-foreground border border-border"
                    )}
                    title={quickAddMode ? "Close Quick Add" : "Quick Add Pencil"}
                >
                    <Sparkles size={24} className={cn("transition-transform", quickAddMode ? "rotate-45" : "")} />
                </motion.button>
            )}

            {/* Quick Add Modal */}
            <AnimatePresence>
                {quickAddMode && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed right-4 top-1/2 transform -translate-y-1/2 translate-x-0 z-50 w-64 mt-20"
                    >
                        <div className="bg-background/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/30 overflow-hidden">
                            <div className="p-4 border-b border-border/20 flex items-center justify-between">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Sparkles size={16} />
                                    <span>Quick Add</span>
                                </h4>
                                <button
                                    onClick={toggleQuickAddMode}
                                    className="p-1 rounded-md hover:bg-secondary transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-3 grid grid-cols-4 gap-2">
                                {quickAddPencils.map(pencil => (
                                    <motion.button
                                        key={pencil.id}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleQuickAdd(pencil)}
                                        className="aspect-square p-2 rounded-lg hover:bg-secondary/50 transition-colors flex flex-col items-center justify-center"
                                        title={`${pencil.name} (${pencil.id})`}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full border border-border/20 mb-1"
                                            style={{ backgroundColor: pencil.hex }}
                                        />
                                        <div className="text-xs font-medium truncate w-full text-center">
                                            {pencil.id}
                                        </div>
                                        {isOwned(pencil) && (
                                            <Check size={12} className="text-primary absolute top-1 right-1 bg-background/80 rounded-full p-0.5" />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Tool Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={drawerRef}
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute right-0 top-0 mt-16 w-80 bg-background/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/30 overflow-hidden"
                    >
                        {/* Drawer Header */}
                        <div className="p-4 border-b border-border/20">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <SlidersHorizontal size={20} />
                                <span>Premium Tools</span>
                            </h3>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <Pencil size={12} />
                                <span>{ownedCount} / {totalCount} pencils owned</span>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex border-b border-border/20">
                            <button
                                onClick={() => setActiveTab('color')}
                                className={cn(
                                    "flex-1 py-3 px-4 text-sm font-medium transition-colors",
                                    activeTab === 'color' 
                                        ? "bg-primary/10 text-primary border-b-2 border-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Pipette size={16} />
                                    <span>Color Tools</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('pencils')}
                                className={cn(
                                    "flex-1 py-3 px-4 text-sm font-medium transition-colors",
                                    activeTab === 'pencils'
                                        ? "bg-primary/10 text-primary border-b-2 border-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Palette size={16} />
                                    <span>Pencils</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('actions')}
                                className={cn(
                                    "flex-1 py-3 px-4 text-sm font-medium transition-colors",
                                    activeTab === 'actions'
                                        ? "bg-primary/10 text-primary border-b-2 border-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Save size={16} />
                                    <span>Actions</span>
                                </div>
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-4 h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide">
                            {activeTab === 'color' && (
                                <div className="space-y-6">
                                    {/* Pipette Tool */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                                <Pipette size={16} />
                                                <span>Color Pipette</span>
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {isPipetteActive ? 'Active' : 'Inactive'}
                                                </span>
                                                <button
                                                    onClick={togglePipette}
                                                    className={cn(
                                                        "p-1.5 rounded-md transition-colors",
                                                        isPipetteActive
                                                            ? "bg-primary/20 text-primary"
                                                            : "bg-secondary/50 hover:bg-secondary"
                                                    )}
                                                >
                                                    {isPipetteActive ? <Check size={14} /> : <Pipette size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Click to activate pipette mode and pick colors from your image
                                        </p>
                                    </div>

                                    {/* Zoom Controls */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <ZoomIn size={16} />
                                            <span>Zoom Controls</span>
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    Zoom Level: {zoomLevel}%
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={handleZoomOut}
                                                        disabled={zoomLevel <= 50}
                                                        className={cn(
                                                            "p-1.5 rounded-md bg-secondary/50 hover:bg-secondary transition-colors",
                                                            zoomLevel <= 50 && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <button
                                                        onClick={handleZoomIn}
                                                        disabled={zoomLevel >= 200}
                                                        className={cn(
                                                            "p-1.5 rounded-md bg-secondary/50 hover:bg-secondary transition-colors",
                                                            zoomLevel >= 200 && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                            <button
                                                onClick={resetZoom}
                                                className="p-1.5 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                                </div>
                                            </div>
                                            <div className="w-full bg-secondary/30 rounded-full h-2">
                                                <div
                                                    className="bg-primary rounded-full h-2 transition-all"
                                                    style={{ width: `${zoomLevel}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Loupe Tool */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <ZoomIn size={16} />
                                            <span>Loupe Tool</span>
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            Magnify specific areas for precise color selection
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 bg-secondary/50 hover:bg-secondary rounded-md transition-colors">
                                                <span className="text-xs">2x</span>
                                            </button>
                                            <button className="p-2 bg-secondary/50 hover:bg-secondary rounded-md transition-colors">
                                                <span className="text-xs">4x</span>
                                            </button>
                                            <button className="p-2 bg-secondary/50 hover:bg-secondary rounded-md transition-colors">
                                                <span className="text-xs">8x</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'pencils' && (
                                <div className="space-y-6">
                                    {/* Search Bar */}
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search pencils..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary/50 outline-none text-sm transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Brand Filter */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <Pencil size={16} />
                                            <span>Pencil Palette</span>
                                        </h4>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            <button
                                                onClick={() => setSelectedBrand('all')}
                                                className={cn(
                                                    "px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap",
                                                    selectedBrand === 'all'
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-secondary/50 hover:bg-secondary"
                                                )}
                                            >
                                                All Brands
                                            </button>
                                            {brands.map(brand => (
                                                <button
                                                    key={brand.id}
                                                    onClick={() => setSelectedBrand(brand.id)}
                                                    className={cn(
                                                        "px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap",
                                                        selectedBrand === brand.id
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-secondary/50 hover:bg-secondary"
                                                    )}
                                                >
                                                    {brand.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pencil Management */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-sm">
                                                My Pencils ({filteredPencils.length})
                                            </h4>
                                            <button
                                                onClick={toggleQuickAddMode}
                                                className="p-1.5 bg-primary/20 hover:bg-primary/30 rounded-md transition-colors text-primary"
                                                title="Quick Add Pencil"
                                            >
                                                <Sparkles size={16} />
                                            </button>
                                        </div>

                                        {/* Loading State */}
                                        {loading && (
                                            <div className="text-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                                <p className="text-sm text-muted-foreground mt-2">Loading pencils...</p>
                                            </div>
                                        )}

                                        {/* No Results */}
                                        {!loading && filteredPencils.length === 0 && (
                                            <div className="text-center py-8">
                                                <Palette className="mx-auto text-muted-foreground mb-2" size={32} />
                                                <p className="text-sm text-muted-foreground">No pencils found</p>
                                                <p className="text-xs text-muted-foreground/70 mt-1">
                                                    Try adjusting your search or brand filter
                                                </p>
                                            </div>
                                        )}

                                        {/* Pencils by Brand */}
                                        {!loading && Object.entries(filteredPencilsByBrand).map(([brandName, brandPencils]) => {
                                            const brandId = brandName.toLowerCase().replace(/\s+/g, '-');
                                            const isExpanded = expandedSections[brandId] !== false;

                                            return (
                                                <div key={brandName} className="space-y-2">
                                                    <button
                                                        onClick={() => toggleSection(brandId)}
                                                        className="flex items-center justify-between w-full py-2 text-sm font-medium"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <ChevronDown 
                                                                size={16} 
                                                                className={cn("transition-transform", !isExpanded && "rotate-180")}
                                                            />
                                                            <span>{brandName}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                ({brandPencils.length})
                                                            </span>
                                                        </div>
                                                    </button>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="grid grid-cols-1 gap-2 ml-6">
                                                                    {brandPencils.map(pencil => (
                                                                        <motion.div
                                                                            key={pencil.id}
                                                                            whileTap={{ scale: 0.98 }}
                                                                            className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                                                                            onClick={() => togglePencil(pencil)}
                                                                        >
                                                                            <div
                                                                                className="w-4 h-4 rounded-full border border-border/20"
                                                                                style={{ backgroundColor: pencil.hex }}
                                                                            />
                                                                            <div className="flex-1 text-xs truncate">
                                                                                <div className="font-medium">{pencil.name}</div>
                                                                                <div className="text-muted-foreground text-xs">{pencil.id}</div>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                {isOwned(pencil) ? (
                                                                                    <Check size={14} className="text-primary" />
                                                                                ) : (
                                                                                    <Plus size={14} className="text-muted-foreground/50" />
                                                                                )}
                                                                            </div>
                                                                        </motion.div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'actions' && (
                                <div className="space-y-6">
                                    {/* Save Options */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <Save size={16} />
                                            <span>Save Options</span>
                                        </h4>
                                        <div className="space-y-2">
                                            <button className="w-full flex items-center justify-between p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Save size={18} />
                                                    <span>Save as Drawing</span>
                                                </div>
                                            </button>
                                            <button className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Palette size={18} />
                                                    <span>Save Palette</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Share Options */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <Share2 size={16} />
                                            <span>Share Options</span>
                                        </h4>
                                        <div className="space-y-2">
                                            <button className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span>📤</span>
                                                    <span>Export Image</span>
                                                </div>
                                            </button>
                                            <button className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span>📋</span>
                                                    <span>Copy Colors</span>
                                                </div>
                                            </button>
                                            <button className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span>🔗</span>
                                                    <span>Share Link</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Reset Options */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <RotateCcw size={16} />
                                            <span>Reset Options</span>
                                        </h4>
                                        <div className="space-y-2">
                                        <button className="w-full flex items-center justify-between p-3 bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors text-destructive">
                                            <div className="flex items-center gap-3">
                                                <RotateCcw size={18} />
                                                <span>Reset View</span>
                                            </div>
                                        </button>
                                            <button className="w-full flex items-center justify-between p-3 bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors text-destructive">
                                                <div className="flex items-center gap-3">
                                                    <X size={18} />
                                                    <span>Clear All</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-3 border-t border-border/20 bg-gradient-to-r from-primary/5 to-secondary/5">
                            <div className="text-xs text-muted-foreground text-center">
                                Premium Tools • Professional Grade
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );


}
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, Bookmark } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

export function SavedColors() {
    const navigate = useNavigate();
    const { favorites, removeFavorite, loading } = useFavorites();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, scale: 0.9 },
        show: { opacity: 1, scale: 1 }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <header className="px-6 py-6 flex items-center gap-4 bg-background/80 backdrop-blur-lg sticky top-0 z-50 border-b border-border/50">
                <button
                    onClick={() => navigate('/tableau-de-bord')}
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">Mes Couleurs Sauvegardées</h1>
            </header>

            <main className="p-6 max-w-4xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto opacity-50">
                            <Bookmark size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-lg">Aucune couleur sauvegardée</p>
                            <p className="text-muted-foreground">Utilisez la pipette pour ajouter des teintes à vos favoris.</p>
                        </div>
                        <button
                            onClick={() => navigate('/scanner-couleur')}
                            className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                        >
                            Ouvrir le scanner
                        </button>
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                    >
                        <AnimatePresence>
                            {favorites.map((fav) => (
                                <motion.div
                                    key={fav.id}
                                    variants={item}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    layout
                                    className="bg-card border rounded-2xl p-4 flex flex-col gap-4 relative group overflow-hidden"
                                >
                                    <div 
                                        className="h-24 w-full rounded-xl shadow-inner border border-black/5"
                                        style={{ backgroundColor: fav.hex }}
                                    />
                                    
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <h3 className="font-bold truncate">{fav.name}</h3>
                                            <p className="text-sm text-muted-foreground truncate">{fav.brand || 'Couleur libre'}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded uppercase">{fav.hex}</span>
                                                {fav.pencilId && (
                                                    <span className="font-mono text-[10px] text-muted-foreground uppercase">{fav.pencilId}</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => removeFavorite(fav.id)}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {/* Date */}
                                    <div className="text-[10px] text-muted-foreground/50 pt-2 border-t flex justify-between items-center">
                                        <span>Ajouté le {new Date(fav.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>
        </div>
    );
}

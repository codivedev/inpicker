import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ImagePlus,
    Settings,
    BookOpen,
    Moon,
    Sun,
    Wand2,
    ChevronRight,
    Palette,
    Crown
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useDrawings } from '@/features/drawings/hooks/useDrawings';
import { useInventory } from '@/features/inventory/hooks/useInventory';

interface DashboardProps {
    isAdmin?: boolean;
}

export function Dashboard({ isAdmin = false }: DashboardProps) {
    const navigate = useNavigate();
    const { setTheme, theme } = useTheme();
    const { drawings } = useDrawings();
    const { ownedCount } = useInventory();

    const [userName] = useState(() => {
        return localStorage.getItem('inpicker_user_name') || 'Artiste';
    });

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 overflow-x-hidden">
            <header className="px-6 py-6 flex justify-between items-center bg-background/80 backdrop-blur-lg sticky top-0 z-50 border-b border-border/50">
                <div onClick={() => navigate('/tableau-de-bord')} className="flex items-center gap-2 cursor-pointer group">
                    <img
                        src="/logo.png"
                        alt="Inpicker"
                        className="w-10 h-10 rounded-xl shadow-lg group-hover:scale-110 transition-transform"
                    />
                    <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">Inpicker</span>
                </div>

                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <button
                            onClick={() => navigate('/administration')}
                            className="p-2.5 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 hover:opacity-90 transition-opacity text-white relative flex items-center justify-center overflow-hidden w-10 h-10 shadow-lg"
                            title="Administration"
                        >
                            <Crown className="h-5 w-5" />
                        </button>
                    )}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-foreground relative flex items-center justify-center overflow-hidden w-10 h-10"
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
                        <span className="sr-only">Toggle theme</span>
                    </button>
                    <button
                        onClick={() => navigate('/mon-profil')}
                        className="w-10 h-10 rounded-full bg-secondary overflow-hidden border-2 border-background shadow-sm hover:scale-105 transition-transform"
                    >
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="Avatar" className="w-full h-full" />
                    </button>
                </div>
            </header>

            <main className="p-6 max-w-5xl mx-auto space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-1"
                >
                    <h1
                        className="text-3xl md:text-4xl font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2 group w-fit"
                        onClick={() => navigate('/mon-profil')}
                    >
                        Bonjour, {userName} <span className="inline-block animate-wave">👋</span>
                        <Settings className="w-5 h-5 opacity-0 group-hover:opacity-40 transition-opacity" />
                    </h1>
                    <p className="text-muted-foreground text-lg">Prêt à créer quelque chose de magnifique ?</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
                >
                    <div
                        onClick={() => navigate('/mes-dessins')}
                        className="min-w-[140px] p-4 rounded-2xl bg-card border shadow-sm flex flex-col gap-1 cursor-pointer hover:border-primary/50 hover:bg-card/80 transition-all active:scale-95"
                    >
                        <span className="text-2xl font-bold">{drawings?.length || 0}</span>
                        <span className="text-sm text-muted-foreground font-medium">Dessins</span>
                    </div>
                    <div
                        onClick={() => navigate('/ma-collection')}
                        className="min-w-[140px] p-4 rounded-2xl bg-card border shadow-sm flex flex-col gap-1 cursor-pointer hover:border-primary/50 hover:bg-card/80 transition-all active:scale-95"
                    >
                        <span className="text-2xl font-bold">{ownedCount || 0}</span>
                        <span className="text-sm text-muted-foreground font-medium">Crayons</span>
                    </div>
                    <div className="min-w-[140px] p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 shadow-sm flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Niveau</span>
                        <span className="text-lg font-semibold text-foreground">Passionné</span>
                    </div>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <motion.div
                        variants={item}
                        onClick={() => navigate('/scanner-couleur')}
                        className="col-span-1 md:col-span-2 h-64 md:h-80 relative overflow-hidden rounded-[2rem] bg-black group cursor-pointer shadow-xl border-4 border-transparent hover:border-primary/20 transition-all active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-600 opacity-90 group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />

                        <div className="absolute inset-0 p-8 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white uppercase tracking-wider border border-white/10">
                                    Nouveau
                                </span>
                                <div className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white group-hover:bg-white group-hover:text-primary transition-colors">
                                    <ImagePlus size={28} />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2">Scanner une couleur</h3>
                                <p className="text-indigo-100 opacity-90 text-lg">Analysez une photo et trouvez les crayons exacts.</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={item}
                        onClick={() => navigate('/generateur-ia')}
                        className="col-span-1 h-64 md:h-80 rounded-[2rem] bg-gradient-to-br from-pink-500 to-rose-600 relative overflow-hidden cursor-pointer shadow-lg group active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/30 to-transparent opacity-50" />

                        <div className="absolute inset-0 p-8 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Wand2 className="text-white" size={28} />
                                </div>
                                <span className="text-white font-bold text-2xl leading-tight block">Générateur<br />IA</span>
                            </div>

                            <div className="flex justify-between items-end">
                                <p className="text-white/80 text-sm max-w-[70%]">Créez une palette complète.</p>
                                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white group-hover:text-rose-500 transition-colors text-white">
                                    <ChevronRight size={28} />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={item}
                        onClick={() => navigate('/mes-dessins')}
                        className="col-span-1 h-48 rounded-[2rem] bg-card border p-6 flex flex-col justify-between gap-4 cursor-pointer hover:border-primary/50 transition-colors group shadow-sm active:scale-[0.95]"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-secondary rounded-2xl w-fit group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <BookOpen size={24} />
                            </div>
                            <span className="text-xs font-bold bg-secondary px-2 py-1 rounded-full text-muted-foreground">{drawings?.length || 0}</span>
                        </div>
                        <div>
                            <span className="text-xl font-bold block leading-tight">Mes<br />Dessins</span>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={item}
                        onClick={() => navigate('/ma-collection')}
                        className="col-span-1 h-48 rounded-[2rem] bg-card border p-6 flex flex-col justify-between gap-4 cursor-pointer hover:border-primary/50 transition-colors group shadow-sm active:scale-[0.95]"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-secondary rounded-2xl w-fit group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <Settings size={24} />
                            </div>
                            <span className="text-xs font-bold bg-secondary px-2 py-1 rounded-full text-muted-foreground">{ownedCount || 0}</span>
                        </div>
                        <div>
                            <span className="text-xl font-bold block leading-tight">Ma<br />Collection</span>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={item}
                        className="col-span-1 h-48 rounded-[2rem] bg-secondary/30 border border-dashed flex flex-col items-center justify-center text-center p-6 text-muted-foreground opacity-50"
                    >
                        <span className="text-sm">Bientôt disponible</span>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-secondary/30 border border-dashed border-primary/20 p-6 rounded-3xl flex items-start gap-4"
                >
                    <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-600 dark:text-yellow-400">
                        <Palette size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold mb-1">Le saviez-vous ?</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Pour un mélange optimal, commencez toujours par la couleur la plus claire et superposez progressivement les teintes plus foncées.
                        </p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

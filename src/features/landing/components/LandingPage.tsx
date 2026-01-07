import { motion } from 'framer-motion';
import { ArrowRight, Palette, Scan, Layers, Brush } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
            {/* Background Animé */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/20 rounded-full blur-[120px]" />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                        <Brush size={18} />
                    </div>
                    <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">
                        Inpicker
                    </div>
                </div>
                <button
                    onClick={() => navigate('/connexion')}
                    className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium backdrop-blur-md border border-white/10"
                >
                    Connexion
                </button>
            </nav>

            {/* Hero */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Nouvelle Version 1.2
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/60">
                        Maîtrisez vos couleurs.
                    </h1>

                    <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
                        L'assistant intelligent pour les artistes. Gérez votre collection, scannez vos crayons et trouvez les mélanges parfaits en un instant.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                        <button
                            onClick={() => navigate('/connexion')}
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_30px_-5px_rgba(124,58,237,0.5)]"
                        >
                            Commencer maintenant
                            <ArrowRight size={20} />
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 font-medium hover:bg-white/10 transition-colors">
                            En savoir plus
                        </button>
                    </div>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full text-left"
                >
                    <FeatureCard
                        icon={<Scan className="text-purple-400" />}
                        title="Scanner Intelligent"
                        desc="Identifiez instantanément la couleur exacte et trouvez la correspondance parfaite parmi vos crayons."
                    />
                    <FeatureCard
                        icon={<Palette className="text-pink-400" />}
                        title="Mélanges & Alternatives"
                        desc="L'algorithme vous suggère des alternatives si vous n'avez pas la couleur exacte, ou des mélanges."
                    />
                    <FeatureCard
                        icon={<Layers className="text-blue-400" />}
                        title="Gestion de Stock"
                        desc="Suivez votre inventaire Prismacolor & Polychromos. Ne rachetez plus jamais un doublon."
                    />
                </motion.div>

                {/* Process Steps */}
                <div className="mt-32 w-full">
                    <h2 className="text-3xl font-bold mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
                        Comment ça marche ?
                    </h2>
                    <div className="relative flex flex-col md:flex-row justify-between items-center gap-12">
                        {/* Line connector */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500/0 via-purple-500/50 to-purple-500/0 md:w-full md:h-1 md:left-0 md:right-0 md:top-1/2 md:bg-gradient-to-r" />

                        <Step number="1" title="Importez" desc="Prenez une photo de votre modèle ou importez une image." />
                        <Step number="2" title="Ciblez" desc="Touchez la zone dont vous voulez reproduire la couleur." />
                        <Step number="3" title="Dessinez" desc="Obtenez instantanément la référence du crayon à utiliser." />
                    </div>
                </div>

                {/* AI Badge */}
                <div className="mt-24 p-8 rounded-3xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 bg-white/10 rounded-bl-2xl text-xs font-mono text-purple-200">BETA</div>
                    <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3">
                        <Scan className="animate-pulse text-purple-400" />
                        Intelligence Artificielle
                    </h3>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        Notre algorithme analyse la composition chromatique de vos scans pour détecter les nuances les plus subtiles, bien au-delà de l'œil humain.
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-12 text-center text-white/20 text-sm relative z-10 border-t border-white/5 bg-black/50 backdrop-blur-md mt-20">
                <div className="flex justify-center gap-6 mb-8 text-white/40">
                    <span>Conditions</span>
                    <span>Confidentialité</span>
                    <span>Support</span>
                </div>
                <p>&copy; 2026 Inpicker. Créé avec passion par Codive.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors h-full">
            <div className="mb-4 p-3 bg-white/5 rounded-2xl w-fit">{icon}</div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}

function Step({ number, title, desc }: { number: string, title: string, desc: string }) {
    return (
        <div className="relative z-10 flex flex-col items-center bg-black p-6 rounded-3xl border border-white/10 w-full md:w-64 transform hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl font-bold mb-4 shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                {number}
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-white/50 text-sm">{desc}</p>
        </div>
    );
}

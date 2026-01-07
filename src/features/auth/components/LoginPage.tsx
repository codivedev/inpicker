import { motion } from 'framer-motion';
import { PinLogin } from '@/features/auth/components/PinLogin';

interface LoginPageProps {
    onSuccess: (user: { id: string, name: string, isAdmin?: boolean }) => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black text-white selection:bg-primary/30">
            {/* Background Animé */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10000ms]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[12000ms]" />
                <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-[15000ms]" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-12 text-center"
                >
                    <div className="inline-block mb-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium tracking-wider uppercase text-white/80">
                        Pour les Coloristes Professionnels
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-purple-400 to-indigo-300 mb-4">
                        Inpicker
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 max-w-md mx-auto">
                        L'outil de précision ultime pour identifier et mélanger vos crayons de couleur.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <PinLogin onSuccess={onSuccess} />
                </motion.div>

                <div className="mt-16 text-center text-xs text-white/20">
                    <p>Compatible Prismacolor, Polychromos, Luminance, Pablo & Brutfuner.</p>
                    <p className="mt-2">v1.2.0 • Créé par Codive</p>
                </div>
            </div>
        </div>
    );
}

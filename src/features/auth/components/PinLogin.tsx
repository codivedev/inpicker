import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePinAuth } from '../hooks/usePinAuth';
import { cn } from '@/lib/utils';

interface PinLoginProps {
    onSuccess: () => void;
}

export function PinLogin({ onSuccess }: PinLoginProps) {
    const [pin, setPin] = useState('');
    const [errorShake, setErrorShake] = useState(0);
    const { verifyPin, lockedUntil, isAuthenticated } = usePinAuth();

    useEffect(() => {
        if (isAuthenticated) {
            setTimeout(onSuccess, 500); // Délai pour l'animation succès
        }
    }, [isAuthenticated, onSuccess]);

    const handleNumClick = (num: number) => {
        if (lockedUntil) return;
        setPin(prev => {
            if (prev.length >= 6) return prev;
            return prev + num;
        });
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleSubmit = async () => {
        if (pin.length !== 6) return;

        const isValid = await verifyPin(pin);
        if (!isValid) {
            setErrorShake(prev => prev + 1);
            setPin(''); // Reset only on error? Or keep it? Reset is better UX for PINs usually
        }
    };

    useEffect(() => {
        if (pin.length === 6) {
            handleSubmit();
        }
    }, [pin]);

    // Gestion du clavier physique
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lockedUntil) return;

            if (e.key >= '0' && e.key <= '9') {
                handleNumClick(parseInt(e.key));
            } else if (e.key === 'Backspace') {
                handleDelete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lockedUntil]); // handleNumClick et handleDelete sont maintenant stables (ne dépendent plus du pin directement)

    // Calcul du temps restant (optionnel pour affichage temps réel)
    const [timeLeft, setTimeLeft] = useState<number>(0);
    useEffect(() => {
        if (!lockedUntil) {
            setTimeLeft(0);
            return;
        }
        const interval = setInterval(() => {
            const diff = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
            setTimeLeft(diff > 0 ? diff : 0);
        }, 1000);
        return () => clearInterval(interval);
    }, [lockedUntil]);

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md p-6 space-y-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
            <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-primary/20 rounded-full text-primary">
                    <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Inpicker Secure
                </h2>
                <p className="text-sm text-muted-foreground">
                    Entrez votre code PIN à 6 chiffres
                </p>
            </div>

            {/* PIN Display */}
            <motion.div
                animate={{ x: errorShake ? [-10, 10, -10, 10, 0] : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="flex space-x-2"
            >
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-4 h-4 rounded-full transition-all duration-300",
                            i < pin.length
                                ? "bg-primary scale-110 shadow-[0_0_10px_currentColor]"
                                : "bg-white/20"
                        )}
                    />
                ))}
            </motion.div>

            {/* Messages d'état */}
            <div className="h-6 flex items-center justify-center">
                <AnimatePresence mode='wait'>
                    {lockedUntil && timeLeft > 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center text-destructive space-x-2 text-sm font-medium"
                        >
                            <AlertCircle size={16} />
                            <span>Trop d'essais. Réessayez dans {Math.floor(timeLeft / 60)}m {timeLeft % 60}s</span>
                        </motion.div>
                    ) : isAuthenticated ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center text-green-400 space-x-2 text-sm font-medium"
                        >
                            <CheckCircle2 size={16} />
                            <span>Autorisé</span>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* Pavé Numérique Virtuel */}
            <div className="grid grid-cols-3 gap-4 w-full px-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleNumClick(num)}
                        disabled={!!lockedUntil}
                        className="h-16 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/20 transition-all duration-100 flex items-center justify-center text-2xl font-semibold backdrop-blur-sm border border-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {num}
                    </button>
                ))}
                <div /> {/* Spacer */}
                <button
                    onClick={() => handleNumClick(0)}
                    disabled={!!lockedUntil}
                    className="h-16 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/20 transition-all duration-100 flex items-center justify-center text-2xl font-semibold backdrop-blur-sm border border-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    0
                </button>
                <button
                    onClick={handleDelete}
                    className="h-16 rounded-xl bg-transparent hover:bg-white/5 active:bg-white/10 transition-all duration-100 flex items-center justify-center text-white/70"
                >
                    Effacer
                </button>
            </div>
        </div>
    );
}

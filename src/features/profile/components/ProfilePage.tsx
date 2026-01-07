import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save, LogOut, Check } from 'lucide-react';

export function ProfilePage() {
    const navigate = useNavigate();
    const [name, setName] = useState(() => {
        return localStorage.getItem('inpicker_user_name') || 'Artiste';
    });
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        localStorage.setItem('inpicker_user_name', name.trim() || 'Artiste');
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleLogout = () => {
        localStorage.removeItem('inpicker_auth');
        localStorage.removeItem('inpicker_user_name');
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <header className="flex items-center gap-4 mb-8 max-w-2xl mx-auto">
                <button
                    onClick={() => navigate('/tableau-de-bord')}
                    className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold">Édition du Profil</h1>
            </header>

            <main className="max-w-2xl mx-auto space-y-8">
                {/* Avatar Preview */}
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-32 h-32 rounded-full bg-secondary overflow-hidden border-4 border-primary/20 shadow-xl relative group">
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
                            alt="Avatar"
                            className="w-full h-full"
                        />
                    </div>
                    <p className="text-sm text-muted-foreground italic">Votre avatar change dynamiquement avec votre nom !</p>
                </div>

                {/* Form */}
                <div className="space-y-6 bg-card border rounded-3xl p-8 shadow-sm">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <User size={16} />
                            Votre Prénom
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-secondary/50 border-none rounded-2xl px-6 py-4 text-xl font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="Entrez votre nom..."
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saved}
                        className={`
                            w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all
                            ${saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:opacity-90 active:scale-[0.98]'}
                        `}
                    >
                        {saved ? (
                            <>
                                <Check size={24} />
                                Profil Enregistré
                            </>
                        ) : (
                            <>
                                <Save size={24} />
                                Enregistrer les modifications
                            </>
                        )}
                    </button>
                </div>

                {/* Secondary Actions */}
                <div className="pt-8 space-y-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors font-semibold"
                    >
                        <LogOut size={20} />
                        Déconnexion
                    </button>
                </div>
            </main>
        </div>
    );
}

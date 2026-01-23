import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Users,
    Image,
    Palette,
    Shield,
    Plus,
    Pencil,
    Trash2,
    Activity,
    X,
    Check,
    AlertTriangle,
    Loader2,
    LogIn
} from 'lucide-react';
import { useAdminStats, useAdminUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../api/admin-queries';
import type { UserWithStats, DrawingWithUser } from '../types/admin.types';

export function AdminDashboard() {
    const navigate = useNavigate();
    const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();
    const { data: users, isLoading: usersLoading } = useAdminUsers();
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Form states
    const [newUserId, setNewUserId] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserPin, setNewUserPin] = useState('');
    const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
    const [editPin, setEditPin] = useState('');

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const handleCreateUser = async () => {
        if (!newUserId || !newUserName || !newUserPin) return;
        try {
            await createUser.mutateAsync({
                id: newUserId.toLowerCase().replace(/\s/g, ''),
                name: newUserName,
                pin: newUserPin,
                isAdmin: newUserIsAdmin
            });
            setShowCreateModal(false);
            resetForm();
        } catch (error) {
            console.error('Erreur création:', error);
        }
    };

    const handleUpdatePin = async (userId: string) => {
        if (!editPin) return;
        try {
            await updateUser.mutateAsync({ id: userId, pin: editPin });
            setEditingUser(null);
            setEditPin('');
        } catch (error) {
            console.error('Erreur mise à jour:', error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteUser.mutateAsync(userId);
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    const resetForm = () => {
        setNewUserId('');
        setNewUserName('');
        setNewUserPin('');
        setNewUserIsAdmin(false);
    };

    // Access denied
    // Gestion des erreurs (Sécurité vs Technique)
    if (statsError) {
        const errorMsg = (statsError as Error).message;
        const isForbidden = errorMsg.includes('Accès refusé');
        const isUnauthorized = errorMsg.includes('Session expirée');

        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-card border ${isForbidden || isUnauthorized ? 'border-red-500/30' : 'border-amber-500/30'} rounded-3xl p-8 max-w-md w-full`}
                >
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isForbidden || isUnauthorized ? 'bg-red-500/10' : 'bg-amber-500/10'} flex items-center justify-center`}>
                        {isUnauthorized ? (
                            <LogIn className="w-8 h-8 text-red-500" />
                        ) : isForbidden ? (
                            <Shield className="w-8 h-8 text-red-500" />
                        ) : (
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        {isUnauthorized ? 'Session Expirée' : isForbidden ? 'Accès Refusé' : 'Serveur Indisponible'}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        {isUnauthorized
                            ? "Votre session a expiré ou vos cookies sont bloqués. Veuillez vous reconnecter."
                            : isForbidden
                                ? "Vous n'avez pas les droits administrateur requis pour cette zone."
                                : `Impossible de charger les données (${errorMsg}). Vérifiez la connexion à l'API.`}
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                if (isUnauthorized) {
                                    localStorage.removeItem('inpicker_user');
                                    navigate('/connexion');
                                } else {
                                    window.location.reload();
                                }
                            }}
                            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            {isUnauthorized ? 'Se reconnecter' : 'Réessayer'}
                        </button>
                        <button
                            onClick={() => navigate('/tableau-de-bord')}
                            className="px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            Retour au Dashboard
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {/* Header */}
            <header className="px-6 py-6 flex items-center gap-4 bg-background/80 backdrop-blur-lg sticky top-0 z-50 border-b border-border/50">
                <button
                    onClick={() => navigate('/tableau-de-bord')}
                    className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-3">
                    <img
                        src="/logo.png"
                        alt="Inpicker"
                        className="w-10 h-10 rounded-xl shadow-lg"
                    />
                    <div>
                        <h1 className="text-xl font-bold">Administration</h1>
                        <p className="text-xs text-muted-foreground">Panel de gestion Inpicker</p>
                    </div>
                </div>
            </header>

            <main className="p-6 max-w-6xl mx-auto space-y-8">
                {/* Stats Cards */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-3 gap-4"
                >
                    <motion.div
                        variants={item}
                        className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-blue-500/20">
                                <Users size={20} className="text-blue-500" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">Utilisateurs</span>
                        </div>
                        <span className="text-3xl font-bold">
                            {statsLoading ? '...' : stats?.totals.users || 0}
                        </span>
                    </motion.div>

                    <motion.div
                        variants={item}
                        className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-purple-500/20">
                                <Image size={20} className="text-purple-500" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">Dessins</span>
                        </div>
                        <span className="text-3xl font-bold">
                            {statsLoading ? '...' : stats?.totals.drawings || 0}
                        </span>
                    </motion.div>

                    <motion.div
                        variants={item}
                        className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-emerald-500/20">
                                <Palette size={20} className="text-emerald-500" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">Crayons</span>
                        </div>
                        <span className="text-3xl font-bold">
                            {statsLoading ? '...' : stats?.totals.pencils || 0}
                        </span>
                    </motion.div>
                </motion.div>

                {/* Users Management */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border rounded-3xl overflow-hidden"
                >
                    <div className="p-6 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users size={20} className="text-primary" />
                            <h2 className="text-lg font-bold">Gestion des Utilisateurs</h2>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                            <Plus size={18} />
                            Nouvel Utilisateur
                        </button>
                    </div>

                    <div className="divide-y">
                        {usersLoading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                Chargement...
                            </div>
                        ) : users?.map((user: UserWithStats) => (
                            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden border-2 border-background">
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                                            alt={user.name}
                                            className="w-full h-full"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{user.name}</span>
                                            {user.is_admin && (
                                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs font-bold rounded-full">
                                                    ADMIN
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {user.drawings_count} dessins • {user.pencils_count} crayons
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {editingUser === user.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editPin}
                                                onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="Nouveau PIN"
                                                className="w-28 px-3 py-2 bg-secondary rounded-lg text-sm font-mono"
                                                maxLength={6}
                                            />
                                            <button
                                                onClick={() => handleUpdatePin(user.id)}
                                                disabled={editPin.length !== 6}
                                                className="p-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => { setEditingUser(null); setEditPin(''); }}
                                                className="p-2 bg-secondary rounded-lg"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : deleteConfirm === user.id ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-red-500">Confirmer ?</span>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 bg-red-500 text-white rounded-lg"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="p-2 bg-secondary rounded-lg"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setEditingUser(user.id)}
                                                className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                                                title="Modifier le PIN"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(user.id)}
                                                className="p-2 bg-secondary hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Activity Graph Placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card border rounded-3xl p-6"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Activity size={20} className="text-primary" />
                        <h2 className="text-lg font-bold">Activité (7 derniers jours)</h2>
                    </div>

                    <div className="h-48 flex items-end justify-around gap-2">
                        {stats?.weeklyActivity && stats.weeklyActivity.length > 0 ? (
                            stats.weeklyActivity.map((day: { date: string; count: number }, index: number) => {
                                const maxCount = Math.max(...stats.weeklyActivity.map((d: { count: number }) => d.count));
                                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 10;
                                return (
                                    <motion.div
                                        key={day.date}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max(height, 10)}%` }}
                                        transition={{ delay: 0.4 + index * 0.05 }}
                                        className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t-lg min-h-[20px] relative group cursor-pointer"
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {day.count} dessins
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>Aucune activité cette semaine</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Recent Drawings */}
                {stats?.recentDrawings && stats.recentDrawings.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-card border rounded-3xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Image size={20} className="text-primary" />
                            <h2 className="text-lg font-bold">Dessins Récents</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {stats!.recentDrawings.slice(0, 10).map((drawing: DrawingWithUser) => (
                                <div key={drawing.id} className="group relative rounded-xl overflow-hidden bg-secondary aspect-square">
                                    {drawing.image_r2_key ? (
                                        <img
                                            src={`/api/images/${drawing.image_r2_key}`}
                                            alt={drawing.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <Image size={32} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                        <span className="text-white text-sm font-medium truncate">{drawing.title}</span>
                                        <span className="text-white/60 text-xs">{drawing.user_name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-card border rounded-3xl p-6 w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold mb-6">Nouvel Utilisateur</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                        Identifiant (unique)
                                    </label>
                                    <input
                                        type="text"
                                        value={newUserId}
                                        onChange={(e) => setNewUserId(e.target.value)}
                                        className="w-full px-4 py-3 bg-secondary rounded-xl"
                                        placeholder="ex: marie"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                        Prénom
                                    </label>
                                    <input
                                        type="text"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        className="w-full px-4 py-3 bg-secondary rounded-xl"
                                        placeholder="ex: Marie"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                        PIN (6 chiffres)
                                    </label>
                                    <input
                                        type="text"
                                        value={newUserPin}
                                        onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full px-4 py-3 bg-secondary rounded-xl font-mono text-lg tracking-widest"
                                        placeholder="••••••"
                                        maxLength={6}
                                    />
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newUserIsAdmin}
                                        onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                                        className="w-5 h-5 rounded"
                                    />
                                    <span className="font-medium">Droits administrateur</span>
                                </label>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    className="flex-1 py-3 bg-secondary rounded-xl font-semibold"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCreateUser}
                                    disabled={!newUserId || !newUserName || newUserPin.length !== 6 || createUser.isPending}
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {createUser.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Créer
                                </button>
                            </div>

                            {createUser.isError && (
                                <p className="mt-4 text-sm text-red-500 text-center">
                                    {(createUser.error as Error).message}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

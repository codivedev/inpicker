# ARCHITECT.md - Architecture & Standards

## 1. Stack Technique (Golden Stack)

### Frontend
- **Framework** : React 18+ (Vite) + TypeScript (Strict Mode)
- **UI Lib** : Shadcn UI + Tailwind CSS
- **State Management** :
  - Server : TanStack Query
  - Client : Zustand
- **Animations** : Framer Motion
- **Validation** : Zod

### Backend
- **BaaS** : Supabase
  - Postgres (Database)
  - Auth (Authentication)
  - Storage (File Storage)
  - Edge Functions (Serverless)
- **Hosting** : Cloudflare Pages (SPA)

---

## 2. Structure de Dossiers (Feature-First)

```text
src/
├── components/
│   ├── ui/              # Composants Shadcn (réutilisables)
│   └── shared/          # Composants partagés (Layout, Provider...)
├── config/              # Configuration centrale (env.ts, constants.ts)
├── features/            # Fonctionnalités métier (modulaires)
│   └── [nom_feature]/
│       ├── api/         # Hooks React Query
│       ├── components/  # Composants spécifiques à la feature
│       └── types/       # Schémas Zod & Types TypeScript
├── lib/                 # Utilitaires (utils.ts, cn())
├── hooks/               # Hooks globaux personnalisés
├── public/
│   └── _redirects       # Routing SPA Cloudflare
└── types/               # Types globaux partagés
```

---

## 3. Standards de Développement

### A. Routing SPA (Cloudflare Pages)
Le fichier `public/_redirects` est OBLIGATOIRE pour le routing :
```text
/* /index.html 200
```

### B. Sécurité
- **RLS (Row Level Security)** activé sur TOUTES les tables Supabase
- **Auth** : Utiliser exclusivement Supabase Auth
- **Données sensibles** : Supabase Vault ou pgcrypto
- **Validation env** : Zod pour toutes les variables d'environnement

### C. Internationalisation
- **Langue** : FRANÇAIS obligatoire (code, UI, commentaires)
- **Dates** :
  - Stockage DB : UTC
  - Affichage UI : locale `fr-BE`
- **Routing** : URLs sémantiques en français (`/mon-profil`, `/factures`)

### D. Design Premium
- Micro-interactions et animations fluides (Framer Motion)
- Feedback immédiat (Skeletons, Toasts, Loading states)
- Variables CSS sémantiques (Shadcn)
- Harmonie Light/Dark mode

### E. Performance & UX
- Lazy loading des routes
- Optimisation des images
- Code splitting automatique (Vite)
- Accessibilité WCAG AA minimum

---

## 4. Patterns de Code

### A. Feature Pattern
Chaque fonctionnalité suit cette structure :
```typescript
// features/mon-feature/api/useMonFeature.ts
export function useMonFeature() {
  return useQuery({ queryKey: ['mon-feature'], queryFn: fetchMonFeature })
}

// features/mon-feature/components/MonFeature.tsx
export function MonFeature() { /* ... */ }

// features/mon-feature/types/schema.ts
export const monFeatureSchema = z.object({ /* ... */ })
```

### B. Validation avec Zod
Toutes les données utilisateurs sont validées :
```typescript
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
})
```

### C. Export Business (Belgique)
- **CSV** : Séparateur `;` + BOM `\uFEFF` pour Excel FR/BE
- **PDF** : Pied de page légal (Entreprise, Forme Juridique, Adresse, N° BE, RPM)

---

## 5. Qualité & Tests

### Checklist avant commit :
- [ ] Code en français (comments, UI)
- [ ] Typing strict (no any)
- [ ] Tests unitaires passants
- [ ] Linting (ESLint) OK
- [ ] RLS activé sur tables modifiées
- [ ] Fichier `_redirects` présent si routing modifié
- [ ] Pas de secrets dans le code

---

## 6. DevOps

### Hosting
- **Cloudflare Pages** : Déploiement automatique sur push GitHub
- **Environnements** : Preview pour PR, Production pour main

### CI/CD
- Tests automatiques sur chaque PR
- Build Vite vérifié
- Linting obligatoire

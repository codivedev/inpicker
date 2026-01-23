# TEMPLATE - Nom de la Fonctionnalité

## 📋 Description
Description courte de la fonctionnalité et son objectif.

## 🛠 Stack Requise
- React 18+
- TypeScript
- Shadcn UI
- [Autres dépendances spécifiques]

## 📦 Dépendances NPM
```bash
npm install [dependance1] [dependance2]
```

## 📁 Fichiers à Créer/Modifier

```
src/features/[nom-feature]/
├── api/
│   └── use[NomFeature].ts
├── components/
│   └── [NomFeature].tsx
└── types/
    └── schema.ts

src/components/ui/
└── [ComposantUI].tsx
```

## 💻 Code Complet

### src/features/[nom-feature]/types/schema.ts
```typescript
import { z } from "zod"

export const [nomFeature]Schema = z.object({
  // Définition du schéma
})
```

### src/features/[nom-feature]/api/use[NomFeature].ts
```typescript
import { useQuery } from "@tanstack/react-query"
import { [nomFeature]Schema } from "../types/schema"

export function use[NomFeature]() {
  return useQuery({
    queryKey: ["[nom-feature]"],
    queryFn: async () => {
      // Logique de fetching
    },
  })
}
```

### src/features/[nom-feature]/components/[NomFeature].tsx
```tsx
import { use[NomFeature] } from "../api/use[NomFeature]"

export function [NomFeature]() {
  const { data, isLoading, error } = use[NomFeature]()

  if (isLoading) return <div>Chargement...</div>
  if (error) return <div>Erreur</div>

  return (
    <div>
      {/* UI de la fonctionnalité */}
    </div>
  )
}
```

## ⚙️ Configuration

### Variables d'Environnement
Aucune nécessaire pour cette fonctionnalité.

### Base de Données
Aucune table nécessaire.

## 📝 Instructions d'Installation

1. Installer les dépendances :
```bash
npm install [dependances]
```

2. Créer les fichiers dans la structure spécifiée ci-dessus

3. Importer et utiliser le composant principal :

```tsx
import { [NomFeature] } from "@/features/[nom-feature]/components/[NomFeature]"

// Dans votre application
<[NomFeature] />
```

4. Personnaliser l'UI selon vos besoins

## 🎨 Personnalisation

### Variables CSS à configurer
```css
:root {
  --[nom-feature]-primary: ...;
}
```

### Props disponibles
- `prop1`: Description
- `prop2`: Description

## ⚠️ Notes Importantes

- Note 1
- Note 2

## 🔗 Dépendances avec d'autres Fonctions
- Dépend de [autre fonction] si nécessaire

## 📅 Créé le
[Date]

## 🏷️ Tags
[tag1], [tag2], [tag3]

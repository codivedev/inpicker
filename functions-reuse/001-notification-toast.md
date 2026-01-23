# 001 - Système de Notification (Toast)

## 📋 Description
Système de notification toast moderne avec support pour succès, erreur, avertissement et info. Intégration avec Shadcn UI.

## 🛠 Stack Requise
- React 18+
- TypeScript
- Shadcn UI
- sonner

## 📦 Dépendances NPM
```bash
npm install sonner
```

## 📁 Fichiers à Créer/Modifier

```
src/components/ui/
└── sonner.tsx

src/
└── main.tsx           # Modification pour le Provider
```

## 💻 Code Complet

### src/components/ui/sonner.tsx
```tsx
import { useTheme } from "next-themes"
import { useTheme as useSonnerTheme, Toaster as Sonner } from "sonner"

function Toaster() {
  const { theme = "system" } = useSonnerTheme()
  const { theme: nextTheme } = useTheme()

  const themeValue = nextTheme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : nextTheme

  return (
    <Sonner
      theme={themeValue as "light" | "dark" | "system"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
    />
  )
}

export { Toaster }
```

### src/main.tsx
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from './components/ui/sonner'
import { ThemeProvider } from './components/theme-provider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
      <App />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
)
```

## ⚙️ Configuration

### Variables d'Environnement
Aucune nécessaire.

### Base de Données
Aucune table nécessaire.

## 📝 Instructions d'Installation

1. Installer les dépendances :
```bash
npm install sonner
```

2. Créer le fichier `src/components/ui/sonner.tsx`

3. Modifier `src/main.tsx` pour ajouter le `Toaster` provider

4. Utiliser les notifications dans votre application :

```tsx
import { toast } from "sonner"

toast.success("Opération réussie")
toast.error("Une erreur s'est produite")
toast.warning("Attention", { description: "Message détaillé" })
toast.info("Information")
```

## 🎨 Personnalisation

### Variables CSS personnalisables
```css
:root {
  --toast-background: ...;
  --toast-foreground: ...;
}
```

### Options disponibles
- `position`: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center"
- `duration`: Temps en millisecondes (défaut: 4000)
- `richColors`: Active les couleurs riches (défaut: true)

## ⚠️ Notes Importantes

- Le composant nécessite un `ThemeProvider` (voir main.tsx)
- Assurez-vous d'avoir les variables CSS de Shadcn configurées
- Compatible avec le mode dark automatique

## 🔗 Dépendances avec d'autres Fonctions
- Dépend du `ThemeProvider` pour le mode dark

## 📅 Créé le
2025-01-13

## 🏷️ Tags
notification, toast, feedback, ui, composant

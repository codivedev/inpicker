# 002 - Modal Dialog Réutilisable

## 📋 Description
Composant de modal dialog moderne et accessible avec Shadcn UI. Support pour différentes tailles et configurations.

## 🛠 Stack Requise
- React 18+
- TypeScript
- Shadcn UI
- Radix UI Dialog

## 📦 Dépendances NPM
```bash
npm install @radix-ui/react-dialog
```

## 📁 Fichiers à Créer/Modifier

```
src/components/ui/
└── dialog.tsx
```

## 💻 Code Complet

### src/components/ui/dialog.tsx
```tsx
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showClose?: boolean
  }
>(({ className, children, showClose = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

## ⚙️ Configuration

### Variables d'Environnement
Aucune nécessaire.

### Base de Données
Aucune table nécessaire.

## 📝 Instructions d'Installation

1. Installer les dépendances :
```bash
npm install @radix-ui/react-dialog
```

2. Créer le fichier `src/components/ui/dialog.tsx`

3. Utiliser le composant dans votre application :

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function MonComposant() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Ouvrir la modal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Titre de la modal</DialogTitle>
          <DialogDescription>
            Description de la modal
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          Contenu de la modal
        </div>
        <DialogFooter>
          <Button type="submit">Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## 🎨 Personnalisation

### Tailles personnalisées
```tsx
<DialogContent className="sm:max-w-md">Moyenne</DialogContent>
<DialogContent className="sm:max-w-lg">Large</DialogContent>
<DialogContent className="sm:max-w-xl">Extra Large</DialogContent>
<DialogContent className="sm:max-w-2xl">Très Large</DialogContent>
```

### Cacher le bouton de fermeture
```tsx
<DialogContent showClose={false}>
  {/* Contenu sans bouton X */}
</DialogContent>
```

## ⚠️ Notes Importantes

- Le composant est entièrement accessible (clavier, lecteur d'écran)
- Compatible avec le mode dark automatique
- Gère le focus automatiquement

## 🔗 Dépendances avec d'autres Fonctions
- Utilise la fonction `cn()` de `@/lib/utils`
- Peut être utilisé avec le système de notification (001)

## 📅 Créé le
2025-01-13

## 🏷️ Tags
modal, dialog, ui, composant, accessible

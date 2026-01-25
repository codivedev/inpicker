# Custom Slash Commands

## Règles de Développement

IMPORTANT: Avant d'écrire du code pour une nouvelle fonctionnalité, **toujours** analyser le code existant pour :
- Identifier les composants et patterns déjà utilisés
- Respecter le design system existant (couleurs, spacing, typographie, etc.)
- Utiliser les mêmes conventions de nommage
- Suivre la structure de dossiers existante
- Réutiliser les utilitaires déjà présents (ex: `cn()` de `src/lib/utils.ts`)

Pour chaque commande de développement (/oneshot, /apex), cette règle est obligatoire.

---

## Règles de Langue

OBLIGATOIRE:
- Tout le code doit être écrit en **français** (commentaires, noms de variables, messages utilisateurs, UI)
- Tous les agents doivent communiquer avec l'utilisateur en **français**
- La documentation doit être rédigée en **français**
- Les messages d'erreur doivent être en **français**

---

## Gestion des Todos

OBLIGATOIRE pour tous les agents et discussions :

1. **Création automatique** : Dès le début d'une discussion ou d'une tâche, créer une todo list avec le commandement `todowrite`

2. **Mise à jour continue** : Lors des discussions, tous les agents doivent :
   - Ajouter immédiatement les nouvelles fonctionnalités proposées
   - Ajouter les améliorations suggérées
   - Ajouter les idées de refactorings
   - Mettre à jour le statut des tâches en temps réel

3. **Structure des todos** :
   - `id` : Identifiant unique
   - `content` : Description claire et concise (en français)
   - `status` : pending, in_progress, completed, cancelled
   - `priority` : high, medium, low

4. **Visualisation** : Utiliser `todoread` pour afficher la todo list régulièrement
   - Au début de chaque étape
   - Avant de passer à l'étape suivante
   - Lorsqu'un agent propose une nouvelle idée

5. **Validation** : Avant de terminer une session, demander confirmation à l'utilisateur que toutes les todos importantes ont été traitées

---

## /init
Initialise un projet React/TypeScript avec Shadcn UI (Goldenstack).

Exécute les étapes suivantes:
1. Crée un projet Vite React TypeScript avec `npm create vite@latest . -- --template react-ts`
2. Installe les dépendances avec `npm install`
3. Installe Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer`
4. Crée les fichiers de configuration:
   - `tailwind.config.js` avec support du mode dark et variables CSS
   - `postcss.config.js` pour PostCSS
5. Configure les fichiers CSS globaux dans `src/index.css` avec les directives Tailwind et les variables CSS pour Shadcn
6. Crée le dossier `src/lib` avec `utils.ts` pour la fonction `cn`
7. Configure les variables CSS dans `src/index.css`

---

## /oneshot <prompt>
Crée une fonctionnalité en mode oneshot (sans validation, sans confirmation).

Usage: `/oneshot Ajouter un bouton avec une modal`

Comportement:
- Analyse le prompt
- Identifie les fichiers à modifier/créer
- Écrit le code directement
- Aucune étape de review ou de validation

Idéal pour:
- Petites modifications rapides
- Composants simples
- Refactorings mineurs

---

## /apex <prompt>
Suit le processus APER complet pour créer une fonctionnalité robuste.

Usage: `/apex Créer un système de connexion utilisateur`

Comportement (cycle APER avec agents experts pour chaque étape):

1. **A**nalyser:
   - Agent Analyse: Analyse en profondeur la demande, le codebase existant, identifie les dépendances et impacts
   - Agent Expert Analyse: Discute avec l'agent Analyse pour vérifier la compréhension du prompt, identifier les manques, valider l'analyse

2. **P**lanifier:
   - Agent Planificateur: Crée un plan détaillé avec les fichiers à créer/modifier, l'ordre des opérations
   - Agent Expert Planification: Discute avec l'agent Planificateur pour valider la cohérence du plan, identifier les risques, vérifier la faisabilité

3. **E**crire:
   - Agent Écriture: Implémente le code en suivant les conventions du projet
   - Agent Expert Code: Discute avec l'agent Écriture pour valider la qualité du code, vérifier les best practices, suggérer des améliorations

4. **R**eview:
   - Agent Review: Vérifie le code (lint, types, tests), identifie les problèmes potentiels
   - Agent Expert Review: Discute avec l'agent Review pour valider la qualité de la review, identifier les problèmes manquants, vérifier la complétude

Pour chaque étape, les deux agents discutent jusqu'à atteindre un consensus, puis demandent confirmation à l'utilisateur avant de passer à la suivante.

---

## /debug
Analyse et résout les bugs dans le projet.

Usage: `/debug`

Comportement:
1. Analyse le codebase pour identifier les problèmes potentiels
2. Vérifie les erreurs TypeScript et ESLint
3. Teste les fonctionnalités affectées
4. Propose et implémente les corrections nécessaires
5. Vérifie que les corrections ne créent pas de nouveaux problèmes

Actions possibles:
- Correction d'erreurs de compilation
- Résolution de problèmes de runtime
- Correction de problèmes de performance
- Correction de problèmes de logique métier

---

## /architect <prompt>
Crée et valide l'architecture d'une fonctionnalité ou du projet.

Usage: `/architect Créer l'architecture pour un système de gestion de tâches`

Comportement (cycle Architecture + Validation):
1. **Agent Architect**: Propose une architecture complète incluant:
   - Structure des dossiers/fichiers
   - Choix des composants et bibliothèques
   - Flux de données
   - Patterns de design utilisés
   - Diagrammes ou explications détaillées

2. **Agent Expert Architecture**: Review et valide l'architecture proposée en vérifiant:
   - Cohérence avec le projet existant
   - Best practices React/TypeScript
   - Scalabilité et maintenabilité
   - Adéquation avec les besoins
   - Potentiels problèmes ou améliorations

3. **Itération**: Si l'expert identifie des problèmes, l'architect ajuste jusqu'à validation

Pour chaque étape, demande confirmation à l'utilisateur avant de passer à la suivante.

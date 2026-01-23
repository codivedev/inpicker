# Fonctions Réutilisables

Ce dossier contient toutes les fonctionnalités réutilisables documentées pour être utilisées dans n'importe quel projet.

## Structure

Chaque fonctionnalité est documentée dans un fichier formaté comme suit :
```
[001-999]-[nom-fonction].md
```

Exemple : `001-auth-system.md`, `002-user-profile.md`

## Format d'une Fonction Réutilisable

Chaque fichier contient :
1. **Description** : Résumé de la fonctionnalité
2. **Stack requise** : Dépendances techniques
3. **Fichiers à créer/modifier** : Liste exhaustive
4. **Code complet** : Code à copier-coller
5. **Configuration** : Variables d'environnement, tables DB, etc.
6. **Instructions d'installation** : Étapes détaillées

## Utilisation

Pour utiliser une fonctionnalité dans un autre projet :
1. Copier le fichier correspondant
2. Suivre les instructions d'installation
3. Adapter les variables d'environnement
4. Personnaliser l'UI selon les besoins

## Fonctions Disponibles

Voir les fichiers individuels pour le détail de chaque fonctionnalité.

---

## Ajouter une Nouvelle Fonctionnalité

Lorsqu'une nouvelle fonctionnalité est créée via `/oneshot` ou `/apex` :
1. Documenter-la dans un nouveau fichier avec le numéro suivant
2. Inclure tout le code nécessaire
3. Ajouter les dépendances npm
4. Documenter les configurations requises
5. Tester dans un projet vierge

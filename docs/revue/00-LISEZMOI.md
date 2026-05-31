# Revue de code Maintenant! — Dossier d'étude (2026-05-31)

Ce dossier est la revue complète demandée, à étudier avec Claude.ai. Le ZIP qui l'accompagne contient **le code source intégral**, **les cahiers des charges** (`docs/cdc-v2/` + `docs/specs/`), **les supports de données** (`supabase/migrations/`), et **toute la revue** (`docs/revue/`). Aucun secret n'y figure (`.env.local` est exclu).

## Comment lire cette revue

1. **`01-synthese-cdc.md`** — Synthèse de tous les cahiers des charges : logique générale, principes transversaux (§0-§19), modèle de données cible (D1-D13), matrice de droits (MD0-MD6), exigences UI (ET1-4), vocabulaire, RGPD, doctrine. Se termine par une **checklist de conformité de 60 points**.
2. **`02-conformite.md`** — Audit de conformité code ↔ CDC sur les 60 points (verdicts + preuves fichier:ligne), écarts priorisés P0-P3.
3. **`03-responsivite-ux.md`** — Responsivité mobile/desktop + UX + complétude fonctionnelle.
4. **`04-accessibilite.md`** — Accessibilité WCAG 2.1 AA (delta depuis l'audit de mai).
5. **`05-performance.md`** — Performance, rapidité d'affichage, scalabilité (35 011 communes, 17 746 signatures, 15 737 profils).
6. **`06-plan-correctifs.md`** — Plan d'action consolidé des correctifs C1-C31 + décisions P3 (D1-D5).
7. **`07-statut-application.md`** — Ce qui a été appliqué (13 correctifs, tous testés), ce qui reste, et ce qui a été **volontairement non appliqué pour ne rien casser**.
8. **`08-audit-post-correctifs.md`** — Re-audit (0 régression), **sécurité**, **qualité/architecture du code**.

## Garanties

- **Aucune régression** : 1013 tests verts après les 13 correctifs ; re-audit dédié = 0 régression.
- **Aucune perte** : tout est commité par incréments (V2.6.29→38), réversible via git.
- **CDC + persona respectés** : doctrine de greffe intacte (0 DROP, 0 reset), vocabulaire propre, 0 `any` non justifié, TypeScript strict renforcé.
- **Local strict** : aucune écriture sur le distant de Francfort ; les migrations restent en local (Phase M).

## Les 3 points les plus importants à arbitrer ensuite

1. **Sécurité avant mise en ligne** : open redirect du callback auth (S1), échappement des filtres de recherche admin (S2), révocation du jeton Management Supabase (S3). Voir `08`.
2. **Décisions produit (P3)** : statuts §13 + compteur public (D1), anonymat des votes Décider (D2). Voir `06`.
3. **Passe d'écriture** : tirets cadratins (—) et flèches restant dans des textes affichés (C2/C12). Voir `07`.

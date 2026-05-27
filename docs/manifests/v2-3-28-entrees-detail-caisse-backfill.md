# Manifest — V2 Vague 3, Chantier V2.3.28 : Liste entrées détail caisse + script backfill

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-28-entrees-detail-caisse-backfill`
**Base** : `main` (tip `6ff2f4e`, V2.3.27)

---

## Livré et fonctionnel

Finalisation de la trésorerie V2.3.26-27 : on voit maintenant les entrées dans la page détail caisse, et un script rejoue l'historique V1 pour peupler les caisses au moment de l'activation.

- [x] **`lib/admin/tresorerie.ts`** : `CaisseDetail.entrees` (nouveau champ) + `TransactionEntrante` interface exportée. Charge les 200 dernières entrées de la caisse (`recue_le DESC`) en parallèle des autres requêtes.
- [x] **`app/admin/national/tresorerie/[caisseId]/page.tsx`** : nouvelle section « Entrées (n) » entre Réceptacles et Transactions sortantes. Pour chaque entrée : badge statut, badge source (Don/Adhésion/...), badge canal, montant formaté, nom du payeur (via `nomAffichageRespectantVisibilite` ou bénéficiaire externe nom/email/Anonyme), motif, date.
- [x] **`scripts/backfill-caisses.ts`** : script idempotent qui parcourt les `don.statut='confirme'` et `adhesion.chemin IN ('euros','t99cp')`, obtient/crée la caisse appropriée, pose l'entrée. `--dry-run` par défaut, `--confirm` explicite. Récapitulatif final avec compteurs (posées / déjà posées / erreurs / cagnottes inconnues).

## Non livré (et pourquoi)

- [ ] **Filtres dans la liste entrées** : pas dans ce chantier. Limite à 200, tri par date desc. Suffit pour le MVP.
- [ ] **Lien depuis entrée vers `don` / `adhesion` source** : pas dans ce chantier. Cliquer sur la carte ne fait rien actuellement. À ajouter si besoin (lien vers la cagnotte pour les dons).
- [ ] **Pagination** : si une caisse dépasse 200 entrées, on tronque silencieusement. Ajouter une pagination explicite si volumes importants.
- [ ] **Backfill cotisations** : pas inclus (pas de flux V1 actuel).

## Décisions techniques prises

- **Section entrées AVANT sorties** : ordre logique du flux (entrées d'abord, sorties ensuite). Aligné avec une lecture comptable habituelle.
- **Limite 200 sur les entrées** : caisse globale `adhesion` peut accumuler beaucoup d'entrées ; 200 dernières suffisent pour le contrôle visuel. Le solde est calculé sur la totalité (`calculerSoldeCaisse` agrège tout).
- **Script standalone** : pas de dépendance au helper `poserEntreeCaisse` de `lib/caisse-flux.ts` (qui s'appuie sur `getSupabaseServer` côté Next.js). Le script crée son propre client `createClient(url, serviceRole)`. Plus simple à exécuter en CLI hors Next.
- **Idempotence via `error.code === '23505'`** : pareil que `poserEntreeCaisse` côté Server Action. Si l'index unique partiel V2.3.26 bloque l'insert (déjà posée), on incrémente `dejaPoses` sans erreur.
- **Création de caisse en cours de boucle** : le script crée les caisses à la volée (une par cagnotte). Pas de pré-création en lot.

## Écarts V1→V2 appliqués

- **Greffe additive pure** : pas de migration. Tout est UI + script.

## Tests

- **Unitaires (Vitest)** : 38 fichiers, **413 tests verts** (inchangés).
- **Lint Biome** : 479 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.

## Notes pour les chantiers suivants

- **Lancer le script** : préalables = migration V2.3.26 + V2.3.27 appliquées distant.
  - `npx tsx scripts/backfill-caisses.ts --dry-run` d'abord (analyse).
  - `npx tsx scripts/backfill-caisses.ts --confirm` ensuite (écriture).
- **Page « Mes contributions »** : pourra lire `transaction_entrante.payeur_personne_id = session.userId` pour voir le total des contributions.
- **Filtres** : par période, par source, par statut. Au besoin.
- **Liens entrées** : ajouter `lien` vers la cagnotte / l'adhésion. Petite UX.

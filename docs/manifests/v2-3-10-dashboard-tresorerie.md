# Manifest — V2 Vague 3, Chantier V2.3.10 : Dashboard trésorerie (lecture)

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-10-dashboard-tresorerie`
**Base** : `main` (tip `5a0ce61`, V2.3.9)

---

## Livré et fonctionnel

- [x] **Page `/admin/national/tresorerie`** : Server Component qui liste les caisses (V2.2.3) avec leur type (badge), statut, libellé, objet rattaché (cagnotte / adhésion / campagne / global), date d'ouverture, et 3 compteurs (réceptacles actifs, transactions sortantes, dernière sortie). Bandeau de rappel D12bis « justificatif obligatoire ». Protection d'accès via le layout `/admin/national/` (admin national uniquement pour l'instant — élargir aux trésorier·ière·s cooptés quand `verifierDroit('gerer_caisse')` V2 sera branché).
- [x] **`lib/admin/tresorerie.ts`** : helper `listerCaissesPourDashboard()` qui agrège les caisses + compteurs via 3 requêtes (caisses, receptacles actifs, transactions sortantes triées par date). Retourne `CaisseEnrichie[]`.
- [x] **Lien « Trésorerie » ajouté** dans deux endroits :
  - `app/admin/national/page.tsx` : MODULES (carte cliquable sur la console nationale).
  - `app/admin/layout.tsx` : nav latérale section « Console nationale ».

## Livré partiellement

- [ ] **UI d'écriture** : pas de formulaires pour créer une caisse, poser un réceptacle, initier un reversement. Les helpers TS sont prêts (`lib/caisse.ts` V2.2.3) mais l'UI demande aussi le bucket Storage `justificatifs` (privé) et un `ChampDocument` côté upload (variante de `ChampImageObjet` qui accepte PDF). Chantier UX dédié.
- [ ] **Détail par caisse** : on liste les caisses, mais on ne propose pas de page détail qui montrerait toutes les transactions sortantes avec leurs justificatifs et bénéficiaires. À ajouter quand l'écriture sera là.
- [ ] **Montant total / solde** : actuellement on ne calcule pas le solde courant d'une caisse (entrées - sorties). Demande de jointure avec les flux d'entrée (don, adhésion, cagnotte) qui ne sont pas encore consommés par les Caisses V2. Sera utile quand la branchement aux flux V1 sera fait.

## Non livré (et pourquoi)

- [ ] **Accès trésorier·ière·s cooptés** : le layout `/admin/national/` n'autorise pour l'instant que `est_admin_national`. Pour qu'un·e trésorier·ière sans droit `national` puisse y entrer, il faudrait élargir la garde — soit via `est_tresorierice()` (V2.2.3) en attendant, soit via `verifierDroit('gerer_caisse')` quand la table `droit` V2.1.3 sera branchée aux contrôles d'accès.

## Décisions techniques prises

- **3 requêtes agrégées plutôt qu'une vue Postgres** : `caisse`, `receptacle_caisse` actifs, `transaction_sortante` triée. Côté TS, on indexe dans des `Map`. Plus simple à maintenir qu'une vue SQL, et le volume des caisses reste modeste (typique : quelques dizaines).
- **Lecture seule** : la page n'expose aucune action. Tant que le bucket `justificatifs` n'est pas en place et que le `ChampDocument` n'est pas écrit, l'initiation de reversement serait incomplète — D12bis exige le justificatif et on refuserait toute insertion sans.
- **Placement `/admin/national/`** plutôt que `/admin/`** : aligné avec le pattern existant (`droits/` est sous `/admin/national/`). Cohérent avec MD5 V2 qui place la trésorerie dans le cercle des admins cooptés.

## Écarts V1→V2 appliqués

- **Nouvelle page V2 sans pendant V1** : la V1 n'avait pas de dashboard trésorerie. Greffe additive pure.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (inchangés).
- **Lint Biome** : 458 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **UI d'écriture trésorerie** : un chantier dédié devra livrer :
  1. Bucket Supabase Storage `justificatifs` (privé, RLS lecture trésorier+admin+propriétaire).
  2. Extension `lib/storage/` avec un rôle `'justificatif'` (PDF/JPEG/PNG/WebP, taille max ~10 Mo).
  3. Composant `ChampDocument` (similaire à `ChampImageObjet`).
  4. Server Action `initierTransactionSortanteAction` qui appelle `lib/caisse.ts:initierTransactionSortante`.
  5. Page de détail caisse `/admin/national/tresorerie/[caisseId]` avec la liste des transactions + bouton « Nouveau reversement ».
- **Branchement aux flux d'entrée** : quand une adhésion est validée, créer une entrée dans la caisse d'adhésion correspondante. Idem cotisations / dons. Chantier par flux.
- **Solde de caisse** : helper `calculerSoldeCaisse(caisseId)` qui agrège entrées (à venir) - sorties.

# Manifest — V2 Vague 3, Chantier V2.3.26 : `transaction_entrante` + solde de caisse

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-26-transaction-entrante-solde`
**Base** : `main` (tip `0a6813a`, V2.3.25)

---

## Livré et fonctionnel

Symétrie côté entrées de caisse. La table V2.2.3 posait `caisse`, `receptacle_caisse`, `transaction_sortante` mais aucune table pour tracer les entrées. Sans ça, pas de solde calculable. Ce chantier pose la table + le helper de calcul + l'affichage du solde.

- [x] **Migration `supabase/migrations/20260527110000_transaction_entrante.sql`** : table `transaction_entrante` avec :
  - `caisse_id` FK restrict, `receptacle_id` FK nullable.
  - `source_type` enum CHECK (`don`/`adhesion`/`cagnotte`/`cotisation_solidaire`/`autre`/`regularisation_manuelle`) + `source_id` UUID.
  - `montant numeric(14,2)`, `canal` enum CHECK (`euro`/`99_coin`).
  - `statut` enum (`initiee`/`confirmee`/`remboursee`/`annulee`), défaut `confirmee`.
  - `payeur_personne_id` FK + `payeur_externe_nom`/`payeur_externe_email` pour les paiements anonymes.
  - `metadata jsonb` libre (id Stripe, txhash Polygon…).
  - 4 index : par caisse+date, par source, par statut, par payeur. Plus un index unique partiel anti-doublon par `(source_type, source_id)` actif.
  - Trigger `updated_at`.
  - RLS : lecture admin national + payeur (lit ses propres contributions). Insert bloqué côté client (service_role uniquement). Update admin uniquement. Pas de delete.
- [x] **`types/database.ts`** : ajouté à la main avec Row/Insert/Update/Relationships (2 FK vers `caisse` et `receptacle_caisse`).
- [x] **`lib/caisse-solde.ts`** : helper `calculerSoldeCaisse(caisseId)` qui retourne `{ euro: {entrees, sorties, solde}, coin99: {entrees, sorties, solde} }`. 2 requêtes parallèles, agrégation TS sur les seules transactions `confirmee`.
- [x] **`lib/caisse-solde.ts` — `calculerSoldesCaisses(caisseIds)`** : variante batch (2 requêtes au lieu de N×2), Map indexée. Utilisée par le dashboard.
- [x] **`app/admin/national/tresorerie/page.tsx`** : affiche le solde dans chaque carte de caisse (encadré sous les compteurs). Affichage conditionnel : si la caisse n'a aucun flux, on n'affiche pas. Format `Intl.NumberFormat` EUR + format custom 99c.
- [x] **`app/admin/national/tresorerie/[caisseId]/page.tsx`** : section dédiée « Solde » en gros caractères (2 cartes côte à côte EUR et 99-coin), entre l'entête et le rappel D12bis. Toujours affichée même si vide (pédagogique).

## Non livré (et pourquoi)

- [ ] **Branchement automatique des flux V1** (don/adhésion/cagnotte → poser une entrée auto) : pas dans ce chantier. La table est posée, l'index unique anti-doublon est prêt. Sera fait dans un chantier ultérieur (probablement V2.3.27 ou plus), à brancher dans les Server Actions V1 de paiement.
- [ ] **UI d'écriture d'entrée manuelle** : pas dans ce chantier. Cas d'usage : régularisation comptable. À ajouter avec la console trésorerie d'écriture.
- [ ] **Filtres par période / source / statut côté détail caisse** : pas dans ce chantier. Simple liste pour le MVP.
- [ ] **Liste des entrées dans la page détail caisse** : pas affichée. Le solde résume. Si on veut le détail des entrées, prévoir une section symétrique aux transactions sortantes. À faire au prochain pas.

## Décisions techniques prises

- **Pas de jointure avec les tables sources** : `source_type + source_id` est une référence faible (pas de FK SQL polymorphe). Cohérent avec le pattern V2.2.2 sur `reservation` (FK polymorphe gérée applicativement).
- **`receptacle_id` nullable** : permet de poser une entrée pour une `regularisation_manuelle` qui n'est pas attachée à un compte Stripe / wallet précis.
- **Statut par défaut `confirmee`** : par contraste avec `transaction_sortante` qui démarre `initiee`. Les entrées arrivent typiquement déjà confirmées (paiement Stripe success, tx Polygon confirmée). Si on veut faire un workflow d'attente (mandat SEPA non encore prélevé par exemple), on peut passer en `initiee`.
- **Index unique anti-doublon `(source_type, source_id)` quand statut actif** : un `don` V1 ne peut pas générer deux entrées actives. Excluant `regularisation_manuelle` (pas d'unicité) et les transactions `remboursee/annulee` (laissées en historique).
- **RLS : payeur lit ses propres entrées** : permet la future page « Mes contributions » côté profil. Aligné sur le principe V1 « tu vois tes propres traces ».
- **Calcul solde TS plutôt que vue SQL** : 2 requêtes minimum (entrées + sorties) suffisent. Pas de vue Postgres parce qu'on veut adapter le filtrage côté TS (statut, période…) à la demande.
- **Affichage conditionnel du solde sur le dashboard** : si la caisse n'a aucune transaction, on n'affiche pas l'encadré solde (pas de bruit visuel pour les caisses neuves).

## Écarts V1→V2 appliqués

- **Greffe additive séparée** : nouvelle table à côté de `transaction_sortante`. Pas de modification du schéma V2.2.3.

## Tests

- **Unitaires (Vitest)** : 38 fichiers, **413 tests verts** (inchangés ; les helpers de solde sont des agrégations simples, pas testés unitairement faute de mock Supabase).
- **Lint Biome** : 477 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.

## Notes pour les chantiers suivants

- **Brancher don/adhésion/cagnotte aux caisses** : dans les Server Actions V1 de validation de paiement, après le `update` sur la table métier, insérer une entrée dans `transaction_entrante` avec `source_type` et `source_id`. L'index unique fera l'anti-doublon.
- **Affichage liste des entrées dans `/admin/national/tresorerie/[caisseId]`** : symétrique à la section transactions sortantes. Ajouter un helper `chargerEntreesCaisse(caisseId)` et brancher.
- **« Mes contributions » côté profil** : liste les `transaction_entrante` où `payeur_personne_id = session.userId`. Page facile à poser maintenant que la table existe.
- **Migration à appliquer distant** : `20260527110000_transaction_entrante.sql`. 11ᵉ en attente.

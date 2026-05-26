# Manifest — V2 Vague 2, Chantier V2.2.3 : Caisse + reversements (D7/D12)

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-2-3-caisse-reversements`
**Base** : `main` (tip `6dfe8c2`, V2.2.2)

---

## Livré et fonctionnel

- [x] **Migration `supabase/migrations/20260527050000_caisse.sql`** : trois tables greffées additivement (aucune table V1 touchée).
  - **`caisse`** : id, type_caisse (CHECK liste fermée 5 valeurs), libelle, objet_type/id polymorphes nullable, statut (ouverte/suspendue/fermee), metadata JSON, dates ouverte/fermée. Index unique partiel pour garantir « une caisse cagnotte par cagnotte ».
  - **`receptacle_caisse`** : historique daté des comptes Stripe / wallets Polygon par caisse × canal. Index unique partiel sur le réceptacle « courant » (valide_au NULL). Permet la bascule Stripe général → Stripe association sans réécriture du passé (D7).
  - **`transaction_sortante`** : reversement caisse → bénéficiaire. **Justificatif OBLIGATOIRE** côté SQL (CHECK `length(justificatif_storage_path) > 0` + CHECK MIME PDF/JPEG/PNG/WebP). Machine à états : initiee → confirmee/annulee/litige. Bénéficiaire interne (FK personne) OU externe (nom + IBAN/wallet). Traçabilité initié_par/le + confirmé_par/le.
- [x] **Triggers `updated_at`** sur caisse et transaction_sortante.
- [x] **Helper SQL `est_tresorierice()`** : lit `droit_admin` V1 niveau `tresorerie`. Cohabitation V1/V2 : tant que le helper `verifierDroit(personne, 'gerer_caisse')` V2 n'est pas branché aux policies, on s'appuie sur la V1.
- [x] **9 policies RLS dans la même migration** (3 par table × select/write/audit). Lecture : admin général / trésorier·ière / DPD. Écriture : admin général / trésorier·ière. Transaction sortante : le bénéficiaire interne peut lire SA transaction (transparence).
- [x] **`lib/caisse.ts`** : `creerCaisse`, `poserReceptacle`, `fermerReceptacleCourant`, `initierTransactionSortante`. Types stricts (`TypeCaisse`, `Caisse`, `CanalCaisse`, `MimeJustificatif`, etc.). Validations applicatives en première ligne, contraintes SQL en seconde.
- [x] **`lib/caisse-validation.ts`** : helpers purs `validerInitiationTransaction` et `validerCoherenceCaisse`. Testable sans Supabase.
- [x] **`types/database.ts` enrichi** : 3 définitions manuelles (caisse, receptacle_caisse, transaction_sortante) avec Relationships.
- [x] **Tests unitaires** `tests/unit/caisse/validation.test.ts` — **13 tests** (D12bis justificatif obligatoire, MIME autorisés, montant > 0, motif min 5 chars, bénéficiaire requis, cohérence caisse cagnotte).

## Livré partiellement

- [ ] **UI trésorerie** : pas d'écran admin pour créer/gérer une caisse, poser un réceptacle, initier un reversement. Schéma et helpers sont posés ; la UI est un chantier V2 dédié.
- [ ] **Server Actions trésorerie** : pas de `creerCaisseAction`, `initierTransactionSortanteAction`, etc. Le helper est prêt, les actions à écrire dans le chantier UI dédié.
- [ ] **Bucket Supabase Storage pour les justificatifs** : le helper exige un `justificatif_storage_path`, mais le bucket réel n'est pas encore créé. À étendre `lib/storage/` avec un nouveau rôle « justificatif » + une migration pour le bucket `justificatifs` (privé, RLS lecture trésorier+admin+propriétaire).
- [ ] **Confirmation d'une transaction sortante** : pas de fonction `confirmerTransactionSortante`. La transition `initiee → confirmee` reste manuelle pour l'instant.

## Non livré (et pourquoi)

- [ ] **Migration appliquée au distant** : non appliquée volontairement (consigne). À faire au matin via `supabase db push`.
- [ ] **Branchement aux flux de dons / adhésions V1** : les flux `don`, `adhesion`, `cagnotte` continuent de tourner en mode V1 (l'argent arrive sur le Stripe existant). La consommation des Caisses V2 (« quand cette adhésion est validée, créer une entrée dans la caisse adhesion ») sera un chantier V2 dédié, table par table.

## Décisions techniques prises

- **Justificatif côté Storage, pas en BDD** : on stocke le chemin Supabase Storage + le nom original + le MIME, mais le fichier lui-même reste dans le bucket. Permet des fichiers > 1 Mo (PDF de virement bancaire typique) sans gonfler la BDD.
- **Soft-fermeture des caisses, jamais DELETE** : statut `fermee` + `fermee_le` daté, ligne conservée pour audit comptable.
- **Index unique partiel sur receptacle courant** : `WHERE valide_au IS NULL` rend la contrainte intuitive (« un seul réceptacle actif par canal »).
- **Bénéficiaire interne OU externe via CHECK** : permet de reverser à une famille hors plateforme tout en conservant l'identité légale.

## Écarts V1→V2 appliqués

- **Régime B (collecte vers le mouvement)** : nouvelle entité V2 sans équivalent V1 strict. La V1 a `don.personne_id` nullable + `cagnotte.wallet_t99cp`, sans agrégation par caisse. La V2 ajoute la couche Caisse au-dessus, sans modifier les tables V1. Personne ne perd ses dons ; le mouvement gagne une vue agrégée auditable.
- **D12bis justificatif obligatoire** : nouvelle contrainte V2 sans pendant V1 (en V1, on faisait confiance au porteur de cagnotte sur sa pièce justificative). Le SQL CHECK refuse désormais toute transaction sortante sans pièce attachée.

## Tests

- **Unitaires (Vitest)** : 34 fichiers, **365 tests verts** (+13 nouveaux).
- **Build Next.js** : non lancé (chantier BDD + helpers, pas d'impact UI).
- **Lint Biome** : 437 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **E2E Playwright** : non lancés.

## Notes pour les chantiers suivants

- **Application au matin** : `supabase db push` pour appliquer aussi `20260527050000_caisse.sql` (en plus des migrations V2.1.1/2/3, V2.2.1, V2.2.2 si pas encore faites).
- **Bucket `justificatifs`** Supabase Storage à provisionner : privé (pas public comme `media`), policies RLS lecture trésorier·ière + admin + propriétaire du document, MIME PDF/JPEG/PNG/WebP, taille max ~10 Mo.
- **Étendre `lib/storage/`** avec un rôle `'justificatif'` ou un adapter distinct (bucket privé vs bucket public).
- **Chantier UI trésorerie** : page `/admin/national/tresorerie` (à créer) qui expose les caisses ouvertes, permet de poser/fermer un réceptacle, initier un reversement avec upload de justificatif.
- **Branchement vers la modération a posteriori des transactions** : le statut `litige` doit déclencher une file de modération côté `/admin/moderation/`.

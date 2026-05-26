# Manifest — V2 Vague 1, Chantier V2.1.1 : retrait du wallet intégré (§19)

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-1-1-retrait-wallet-integre`
**Commit final** : (voir `git log -1 --format=%h` sur cette branche)
**Durée approximative** : 1 session courte
**Base** : `main` (tip `f99fd73`, V2.0 vague 0 fermée)

---

## Livré et fonctionnel

- [x] **Page `/profil/wallet` supprimée** (`app/(membre)/profil/wallet/page.tsx`). Elle affichait un wallet intégré factice (« 100 99-coin » mockés, bouton « Certifier mon wallet » désactivé) et pointait vers une URL incorrecte (`https://t99cp.org` au lieu de `https://the99coinproject.org/`). Conforme au §19 du `principes-transversaux-V2.md` : aucun wallet intégré côté plateforme.
- [x] **Onglet « Wallet T99CP » retiré du `NavOnglets`** profil. Le menu ne propose plus de lien vers une page inexistante. Un commentaire explicite dans le code pose la décision V2 et indique qu'un onglet « 99-coin » en **lecture seule** sera réintroduit dans un chantier dédié.
- [x] **Test E2E `tests/e2e/profil.spec.ts`** mis à jour : `'/profil/wallet'` retiré de la liste des pages protégées, avec un commentaire qui pointe vers V2.1.1.
- [x] **Référence `docs/specs/01_ARCHITECTURE.md` neutralisée** : la ligne `- /profil/wallet : statut T99CP + lien externe` est commutée en commentaire HTML pour préserver la mémoire historique sans laisser un libellé V1 trompeur.
- [x] **Migration additive `supabase/migrations/20260527000000_t99cp_hash_consomme.sql`** : crée la table `t99cp_hash_consomme` (clé primaire = `tx_hash`, garde-fou d'unicité contre la double-consommation d'un même hash), 2 index, RLS activée avec policy de lecture (admin général + modérateur autres-moyens + propriétaire), insert exclusivement via service_role (cohérent avec `journal_admin`). **À appliquer manuellement avec `supabase db push` ou `scripts/appliquer-sql-distant.ts`** — non appliquée au distant cette nuit (consigne).
- [x] **Helper `lib/t99cp/hashes-consommes.ts`** : deux fonctions exposées.
  - `enregistrerHashConsomme({ txHash, type, cibleId?, profilId, metadata? })` : insère dans la table, retourne `{ ok: true }` ou `{ ok: false, raison: 'deja_consomme' | 'erreur_base' }` selon que le hash est déjà présent (détecté via le code Postgres `23505` ou le pattern « duplicate key ») ou une erreur autre. Atomique grâce à la contrainte d'unicité Postgres.
  - `hashDejaConsomme(txHash)` : check préventif pour l'UI, sans écrire.
- [x] **`types/database.ts` enrichi** : définition manuelle de la table `t99cp_hash_consomme` ajoutée, cohérent avec la convention « maintenu à la main » mentionnée CLAUDE.md §11.
- [x] **`envoyerTransaction` marquée DEPRECATED** dans `lib/t99cp/types.ts` (JSDoc + tête de fichier). Aucune suppression de la méthode : la doctrine de greffe (interdit n°1) impose qu'on n'arrache pas du code utilisé. Les 3 callers actifs (`app/(public)/agir/adherer/actions.ts`, `app/(public)/s-entraider/sel/actions.ts`, `app/(public)/s-entraider/marche/actions.ts`) continuent de fonctionner. La refacto vers la redirection externe + `verifierTransaction` + `enregistrerHashConsomme` est un chantier V2 dédié à venir (voir notes ci-dessous).

## Livré partiellement

- [ ] **Refacto des 3 flux V1 qui appellent encore `envoyerTransaction`** (adhésion T99CP, crédit SEL, marché solidaire). La méthode reste fonctionnelle en attendant ; le passage à la redirection externe + vérification de hash est un chantier V2 à part. Les flux ne sont PAS cassés, juste pas encore conformes à la nouvelle doctrine §19. Liste précise dans « Notes pour les chantiers suivants ».
- [ ] **Page profil de lecture du solde T99CP** (la spec V2 prévoit un affichage T99CP + équivalent temps visible uniquement par soi). Reportée à un chantier V2 dédié qui réintroduira un onglet « 99-coin » dans `/profil/`. Ce chantier consommera la méthode `obtenirBalance` déjà disponible.

## Non livré (et pourquoi)

- [ ] **Migration `20260527000000_t99cp_hash_consomme.sql` appliquée au distant.** Non appliquée volontairement cette nuit (consigne explicite « pas de touche au distant Supabase »). À appliquer au matin avec `supabase db push` ou `scripts/appliquer-sql-distant.ts` (DDL pur, sans PII). Tant qu'elle n'est pas appliquée, le helper `enregistrerHashConsomme` échouera avec une erreur de table inexistante si jamais on l'invoque ; mais aucun caller ne l'appelle encore, donc impact applicatif nul.

## Contenus à arbitrer

Rien à arbitrer côté contenu pour V2.1.1.

## Décisions techniques prises (ADR à archiver)

Aucune ADR formelle. La doctrine de greffe est suivie : on additionne (table `t99cp_hash_consomme`, helper, garde-fou anti-double-spend) et on marque DEPRECATED ce qu'il faudra retirer plus tard, sans arracher quoi que ce soit dans le même mouvement.

## Incertitudes techniques résolues avec Lilou/Ben

Aucune incertitude pendant le chantier.

## Écarts V1→V2 appliqués

Rubrique dédiée au cycle V2 (cf. CLAUDE.md §0.4).

- **Wallet intégré supprimé (côté UI), pas côté code adapter** : la spec V2 §19 dit littéralement « AUCUN wallet intégré ». La V1 portait une page de wallet intégré (`/profil/wallet`) et une méthode `envoyerTransaction` qui faisait signer la plateforme. **Compromis appliqué** : la page est supprimée (zéro régression utilisateur, elle n'avait que des données mockées et un bouton désactivé) ; la méthode `envoyerTransaction` est marquée DEPRECATED mais conservée pour ne pas casser les 3 flux V1 (adhésion, SEL, marché) qui en dépendent. Le retrait définitif viendra avec la refacto de chacun de ces flux. **Aucune donnée n'a été perdue ou modifiée** (chantier 100 % code).
- **Garde-fou anti-réutilisation des hashes** : pas un écart V1↔V2 à proprement parler (la V1 ne portait pas de table d'unicité), mais une **création additive** demandée par le §19 V2 (« hash unique non déjà consommé »). Pose les fondations pour la refacto à venir des flux.

## Tests

- **Unitaires (Vitest)** : `npm test` → **29 fichiers, 318 tests, tous verts**. Aucun nouveau test pour V2.1.1 :
  - Le helper `hashes-consommes.ts` appelle `getSupabaseServer()` qui parle à la BDD distante ; le tester sans mock complexe est peu utile. Le contrat est court et explicite. Les tests d'intégration sont à faire dans un harnais dédié avec Supabase live (hors périmètre de cette nuit autonome).
- **Build Next.js** : `npx next build` → succès.
- **Lint (Biome)** : `npm run lint` → 415 fichiers, 0 issue.
- **Typecheck (tsc)** : `npm run typecheck` → 0 erreur. La définition manuelle de la table dans `types/database.ts` rend `enregistrerHashConsomme` correctement typé.
- **E2E Playwright** : non lancés (touchent à une instance live).

## Notes pour les chantiers suivants

- **Application au matin** : `supabase db push` pour appliquer `20260527000000_t99cp_hash_consomme.sql`.
- **Refacto des 3 flux qui consomment encore `envoyerTransaction`** (chacun mérite probablement son propre chantier de greffe additive) :
  - `app/(public)/agir/adherer/actions.ts:171` — adhésion T99CP. Doit basculer vers : redirection vers `https://the99coinproject.org/` → retour avec `tx_hash` → `verifierTransaction` → `enregistrerHashConsomme({ type: 'adhesion', ... })`.
  - `app/(public)/s-entraider/sel/actions.ts:367` — crédit T99CP pour prestation SEL. Idem.
  - `app/(public)/s-entraider/marche/actions.ts:396` — marché solidaire T99CP. Idem.
- **Page « 99-coin » en lecture seule** à réintroduire dans `/profil/` : un Server Component qui appelle `obtenirBalance(adresseWallet)` (à condition que la personne ait renseigné son adresse, à stocker dans une colonne `personne.adresse_wallet_t99cp` — colonne additive nouvelle, à créer dans un chantier dédié).
- **Tests d'intégration du helper** : à écrire dans un harnais avec instance Supabase live, vérifiant que le `unique_violation` Postgres se traduit bien en `{ ok: false, raison: 'deja_consomme' }`. Sans cela, on découvrira un éventuel mismatch d'API Supabase à la première utilisation réelle.

# Manifest — V2 Vague 3, Chantier V2.3.27 : Branchement caisses ↔ flux V1

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-27-branchement-caisses-flux-v1`
**Base** : `main` (tip `48fd83d`, V2.3.26)

---

## Livré et fonctionnel

Doctrine V2 D7 : « régime B = l'argent arrive bien à Maintenant!, dans une Caisse dédiée. » Ce chantier branche les 4 Server Actions V1 de confirmation paiement (don euros, don T99CP, adhésion euros, adhésion T99CP) à `transaction_entrante` V2.3.26.

- [x] **`lib/caisse-flux.ts`** : helpers idempotents.
  - `obtenirOuCreerCaisseGlobale(typeCaisse)` : pour `adhesion`/`don_general`/`cotisation_solidaire`/`autre`. Lit la caisse ouverte par type (sans `objet_id`), la crée sinon avec un libellé par défaut.
  - `obtenirOuCreerCaisseCagnotte(cagnotteId, libelle)` : pour `cagnotte`. Lit la caisse cagnotte ouverte pour cet `objet_id` (l'index unique partiel V2.2.3 garantit une seule), la crée sinon. Libellé tronqué à 180 chars.
  - `poserEntreeCaisse(options)` : insert dans `transaction_entrante`. Idempotent grâce au code Postgres `23505` (violation unique) → renvoie `ok: true, entreeId: null` si l'entrée existait déjà. Fire-and-forget.
- [x] **`app/(public)/mobiliser/cagnottes/actions.ts`** : branchement dans 2 Server Actions.
  - `confirmerDonEuros(sessionId, donId)` : après l'`update statut='confirme'`, charge le don, obtient/crée la caisse cagnotte, pose l'entrée (canal `euro`, montant en € depuis `montant_centimes/100`).
  - `faireDonT99CP(donnees)` : après l'`insert don` (statut directement `confirme`), recharge l'id par `tx_hash`, obtient/crée la caisse cagnotte, pose l'entrée (canal `99_coin`).
- [x] **`app/(public)/agir/adherer/actions.ts`** : branchement dans 2 Server Actions.
  - `confirmerAdhesionEuros(sessionId, adhesionId)` : après le retour Stripe, charge l'adhésion, obtient/crée la caisse globale `adhesion`, pose l'entrée (canal `euro`).
  - `adhererT99CP(donnees)` : après l'insert adhésion, obtient/crée la caisse globale `adhesion`, pose l'entrée (canal `99_coin`).

## Non livré (et pourquoi)

- [ ] **Chemin `adhererGratuit`** : pas de flux monétaire, donc pas d'entrée à poser. Cohérent.
- [ ] **Cotisations solidaires** : table `cotisation` non touchée. Le helper `obtenirOuCreerCaisseGlobale('cotisation_solidaire')` est prêt mais aucune Server Action V1 ne l'utilise — à brancher quand le flux de cotisation sera livré.
- [ ] **Dons généraux non liés à une cagnotte** : la V1 n'a que des dons sur cagnotte (`don.cagnotte_id NOT NULL`). Pas de flux « don général au mouvement ». Si un jour on l'ouvre, brancher sur `obtenirOuCreerCaisseGlobale('don_general')`.
- [ ] **Backfill historique** : les dons et adhésions déjà passés en V1 ne sont PAS rétroactivement injectés dans les caisses. À faire avec un script `scripts/backfill-caisses.ts --dry-run` qui parcourt `don` et `adhesion` `confirme/active`, appelle `poserEntreeCaisse` (idempotent). À écrire et lancer quand Lilou/Ben veut activer la trésorerie sur les flux passés.
- [ ] **Webhook Stripe direct** : actuellement le branchement passe par les Server Actions de retour Stripe Checkout (URL succès) — qui sont appelées par le navigateur. Un webhook direct Stripe → backend serait plus fiable mais demande une refonte plus large.

## Décisions techniques prises

- **Helpers `obtenirOuCreer*` plutôt qu'une migration `INSERT` à l'avance** : les caisses globales sont créées paresseusement à la première confirmation. Pas de seed obligatoire. Plus simple, plus modulaire, plus aligné avec la doctrine V2 « pas de seed lourd ».
- **Idempotence via code Postgres 23505** : l'index unique partiel `(source_type, source_id) WHERE statut IN ('initiee','confirmee')` (V2.3.26) gère le doublon. Si on rejoue un appel à `poserEntreeCaisse`, l'insert lève `23505`, on l'attrape et on retourne `ok: true, entreeId: null`. Pattern propre.
- **Pas d'`upsert` sur `transaction_entrante`** : on évite parce qu'une rejouée pourrait écraser un statut `remboursee` rétroactivement modifié. Le `try insert + catch 23505` est plus sûr.
- **`montant numeric(14,2)` → `number` côté TS** : le payment passe en centimes, on divise par 100. Pour le T99CP, on prend `Number(MONTANT_ADHESION_T99CP_UNITES)` (string → number) ; quantités acceptables tant qu'on reste sous 2^53.
- **Fire-and-forget** : si l'insert dans `transaction_entrante` échoue (RLS, FK, contrainte CHECK), on ne fait PAS échouer la confirmation V1. L'utilisateur a payé, la trace V1 (`don.statut='confirme'`) est OK. La trace V2 peut être rejouée plus tard avec un backfill.
- **Pas de modification du schéma V1** : aucune table V1 touchée. Greffe additive pure (doctrine §0.3).

## Écarts V1→V2 appliqués

- **V2 introduit une trace comptable parallèle à V1** : `don` et `adhesion` V1 restent les sources de vérité du métier ; `transaction_entrante` V2 est une trace agrégée pour la trésorerie. Ce dédoublement est attendu : la V1 répond à « combien telle cagnotte a-t-elle reçu ? », V2 répond à « quel est le solde de la caisse pour pouvoir reverser combien ? ».

## Tests

- **Unitaires (Vitest)** : 38 fichiers, **413 tests verts** (inchangés).
- **Lint Biome** : 478 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **E2E** : non lancés.

## Notes pour les chantiers suivants

- **Script de backfill** : `scripts/backfill-caisses.ts` qui pour chaque `don.statut='confirme'` et chaque `adhesion` avec session/tx, appelle `poserEntreeCaisse` (idempotent). À écrire dans un chantier dédié quand Lilou/Ben veut activer la trésorerie sur le passé.
- **Cotisations solidaires** : quand le flux V1 sera là (chantier 11.x V1 ou dédié), brancher pareil.
- **Liste des entrées dans `/admin/national/tresorerie/[caisseId]`** : symétrique à transactions sortantes. Helper `chargerEntreesCaisse(caisseId)` + section UI.
- **Page « Mes contributions » côté profil** : déjà existe (V1 chantier 6.3 ?). Vérifier qu'elle peut lire `transaction_entrante.payeur_personne_id = session.userId` pour avoir une vue agrégée des dons + adhésions de la personne (sans dupliquer la logique métier).

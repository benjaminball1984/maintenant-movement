# Manifest : Phase V2.6, Chantier V2.6.54 : D5 (frais de port du marché solidaire)

**Date de fin** : 2026-05-31
**Branche** : main
**Commit final** : (voir git log, message « phase V2.6 - chantier V2.6.54 - D5 ... »)
**Durée approximative** : 1 session Claude Code (suite de la revue de code)

## Contexte

Décision D5 de la revue de code, tranchée par Lilou/Ben : « Construire les frais de
port maintenant ». La fiche CDC `marche-solidaire-V2.md` §"Frais de port" prévoit que
l'envoi postal existe (contrairement au prêt) et que le port se règle :

- en **POL** (la monnaie native du réseau Polygon, PAS en 99-coin) pour un achat crypto,
  au taux du moment, avec une alerte « prévoir du POL » ;
- en **euros via Stripe** pour un achat en euros ;
- **sans commission Maintenant!** (paiement direct vendeureuse, §Commission).

Jusqu'ici, `produit_marche` portait les deux drapeaux `remise_main_propre` /
`envoi_postal` mais aucun montant de port : l'envoi était proposé sans coût chiffré.

## Livré et fonctionnel

- [x] **Migration additive** `supabase/migrations/20260602160000_produit_marche_frais_port.sql` :
  colonne `frais_port_centimes integer not null default 0` + contrainte CHECK
  (0 à 100 000 centimes, soit 0 à 1 000 €). **Appliquée et vérifiée en LOCAL**
  (Docker `supabase_db_Maintenant`). Test transactionnel : insertion port 690,
  total envoi 2190 ; rejet de 110000 et de -5 par le CHECK ; rollback propre.
  `produit_marche` est une table V1, donc migration appliquée local, **distant en Phase M**.
- [x] **`types/database.ts`** : `frais_port_centimes` ajouté aux trois blocs
  (Row requis, Insert/Update optionnels) de `produit_marche`.
- [x] **Validation Zod** (`lib/validations/marche.ts`) :
  - schéma de création : `frais_port_centimes` optionnel (entier 0 à 100 000) +
    refine « un port > 0 exige l'envoi postal » ;
  - schéma d'achat : `mode_remise` optionnel (`main_propre` | `envoi`).
  - `.optional()` sans `.default()` pour éviter la divergence input/output de Zod
    (react-hook-form type le formulaire sur l'entrée). L'absence vaut 0/main propre,
    géré par `?? 0` côté action.
  - 3 nouveaux messages CMS-éditables dans `lib/messages-validation.ts`.
- [x] **Helper pur** `lib/marche/port.ts` : `portFactureCentimes({ modeRemise,
  envoiPostal, fraisPortCentimes })`. Centralise « le port s'applique-t-il et pour
  combien ? » ; partagé par l'action serveur ET le formulaire d'achat (DRY).
  Renvoie 0 dès qu'une condition manque, ce qui garantit le comportement historique.
- [x] **Formulaire de création produit** (`FormulaireCreationProduit.tsx`) : champ
  « Frais de port (euros, centimes) » qui n'apparaît QUE si l'envoi postal est coché.
  Normalisation à l'envoi (port remis à 0 si l'envoi est décoché). Libellés CMS.
- [x] **Formulaire d'achat** (`FormulaireAchat.tsx`) : choix de remise (radio main
  propre / envoi) quand les deux modes ont un coût distinct ; récapitulatif du total
  euros (« Total à payer : X (dont Y de frais de port) ») ; pour le 99-coin, note
  « port à régler en POL au taux du moment » + **alerte « Prévois du POL »**. Le mode
  de remise calculé est toujours envoyé explicitement (robuste pour un produit en
  envoi seul). Tous libellés CMS-éditables.
- [x] **Action `acheterProduit`** : charge `frais_port_centimes` /
  `remise_main_propre` / `envoi_postal` ; calcule le port via le helper ; en euros,
  `montantTotalCentimes = prix + port` (frais plateforme inchangés, calculés sur le
  prix seul, donc pas de commission sur le port) ; en 99-coin, le montant du jeton reste
  le prix seul, le port (POL) est journalisé pour la réconciliation Polygon à venir.
  Métadonnée `frais_port_centimes` ajoutée au checkout.
- [x] **Affichage fiche produit** : ligne « Frais de port : X € » quand l'envoi a un
  coût fixé (clé CMS `produit.fiche.label_frais_port`).

## Non régression (garantie par construction)

- Colonne `frais_port_centimes` avec **DEFAULT 0** : tous les produits existants
  gardent un port nul, donc total = prix seul, comme avant.
- Helper `portFactureCentimes` renvoie 0 dès qu'une condition manque (mode autre
  qu'envoi, envoi non proposé, montant nul), donc aucun produit existant ne facture
  de port.
- Sur le **distant** (colonne absente jusqu'en Phase M), `select('*')` ne renvoie pas
  le champ, donc `produit.frais_port_centimes` vaut `undefined`, et l'UI comme
  l'action le traitent comme 0. **Dégradation propre, zéro régression distant.**

## Non livré (et pourquoi)

- [ ] **Conversion euros vers POL réelle** : le montant POL exact dépend d'un oracle de
  taux POL/EUR non branché (toute la voie crypto est en mock tx_hash). Conforme à la
  fiche : le port est affiché en référence euros + « à régler en POL au taux du
  moment » + alerte. La conversion réelle relève du wallet (chantier T99CP dédié).
- [ ] **Badge port sur la carte de liste** (`CarteProduit`) : non ajouté, la fiche
  détail suffit pour D5. Proposition pour plus tard.

## Contenus à arbitrer

- Aucun. Les libellés sont des microcopies fonctionnelles (autorisées §3) et restent
  CMS-éditables par Lilou/Ben.

## Écarts V1 vers V2 signalés (non touchés ici)

- **Frais plateforme 5 % sur le marché** : le code V1 applique `calculerFraisEuros`
  (5 %) sur le prix produit, alors que la fiche CDC V2 §Commission dit « Pas de
  commission Maintenant! (paiement direct) ». Cet écart est **préexistant** et **hors
  périmètre D5** (toucher au calcul de frais = risque sur le paiement). Laissé tel
  quel ; la décision de retirer/ajuster la commission reste à arbitrer séparément.
  D5 se contente de **ne PAS** appliquer de commission sur le port (conforme).

## Tests

- Unitaires : **+7** (`tests/unit/marche/port.test.ts`), suite à **1020 verts**.
  29 tests de validation marché existants : toujours verts.
- Test base transactionnel (psql local) : insertion + CHECK bornes + rollback : OK.
- Lint Biome : 8 fichiers touchés propres (les 18 warnings repo sont préexistants).
- Typecheck : vert.
- E2E Playwright / Lighthouse : non relancés (chantier additif, pas de nouvelle route ;
  la fiche produit et les formulaires existaient déjà).

## Notes pour les chantiers suivants

- **Phase M (push distant)** : appliquer `20260602160000_produit_marche_frais_port.sql`
  au distant Francfort (en plus des migrations déjà en attente : D1
  `compter_membres_actifs`, C5, C13, C14, C15, index C28).
- Quand le wallet T99CP réel et un oracle POL/EUR seront branchés, calculer et afficher
  le montant POL exact du port (et déclencher son paiement) à la place de la note de
  référence.

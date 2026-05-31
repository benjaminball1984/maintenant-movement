# Manifest : Phase V2.6, Chantier V2.6.60 : C17 (adhésion 99-coin sans wallet intégré)

**Date de fin** : 2026-05-31
**Branche** : main
**Durée approximative** : 1 session Claude Code (suite de la revue de code)

## Contexte

Correctif C17 de la revue. L'adhésion en 99-coin appelait encore
`envoyerTransaction` (méthode marquée `@deprecated`), c'est-à-dire que la
plateforme SIMULAIT la signature d'une transaction de paiement, et générait
même un hash factice si la personne n'en fournissait pas. On pouvait donc
"adhérer en 99-coin" sans payer.

La doctrine V2 (principes-transversaux §19, rappelée dans `lib/t99cp/types.ts`)
est explicite : la plateforme ne signe AUCUNE transaction et n'intègre AUCUN
wallet. La personne paie depuis son propre wallet via `the99coinproject.org`,
puis recopie le hash de transaction, dont l'unicité est garantie côté serveur.

Le don en 99-coin (cagnottes) suivait déjà ce modèle : C17 aligne l'adhésion
dessus.

## Livré et fonctionnel

- [x] **Schéma** (`lib/validations/adhesion.ts`) : `tx_hash` devient OBLIGATOIRE
  (format `0x` + 64 hexadécimaux). Suppression du `.optional().or(literal(''))`.
- [x] **Action `adhererT99CP`** (`app/(public)/agir/adherer/actions.ts`) :
  - suppression de l'appel `envoyerTransaction` (et de l'import `getT99CPService`) ;
  - le `tx_hash` utilisé est celui fourni par la personne (plus aucun hash factice) ;
  - branchement du garde-fou anti-réutilisation `enregistrerHashConsomme`
    (table `t99cp_hash_consomme`, V2.1.1) : **premier vrai usage** de ce garde-fou.
    Insertion de l'adhésion, puis consommation du hash ; si le hash a déjà servi
    (tous flux confondus), l'adhésion qu'on vient de créer est annulée (delete) et
    un message clair est renvoyé ;
  - entrée en caisse posée seulement après confirmation de la consommation du hash.
- [x] **Formulaire** (`components/adhesion/FormulaireAdhesionT99CP.tsx`) : aligné
  sur `FormulaireDonT99CP` : encadré « Étape 1 : envoie 12 99-coin vers [adresse
  trésorerie] », lien « Ouvrir the99coinproject.org pour payer » (la HOME, jamais
  une URL profonde, en nouvelle fenêtre, §19), champ `tx_hash` marqué obligatoire,
  aide réécrite (plus de « laisser vide »). Nouvelle prop `walletTresorerie`.
  Tous les libellés restent CMS-éditables.
- [x] **Page** (`app/(public)/agir/adherer/t99cp/page.tsx`) : lit l'adresse de
  trésorerie via la clé CMS `adhesion.t99cp.wallet_tresorerie` (placeholder
  `[ADRESSE WALLET TRÉSORERIE À FOURNIR]` tant que non fournie) et la passe au
  formulaire.

## Contenus à arbitrer

- [ ] **Adresse du wallet de trésorerie 99-coin** : donnée réelle, à fournir via
  le CMS (clé `adhesion.t99cp.wallet_tresorerie`). Ajoutée à
  `docs/CONTENUS-A-ARBITRER.md` §3.3.

## Non régression

- Les autres chemins d'adhésion (gratuit, euros) ne sont pas touchés.
- Le don 99-coin et le marché ne sont pas touchés (le marché a son propre cas,
  traité par D5).
- La méthode `envoyerTransaction` reste disponible dans le service (toujours
  utilisée par d'autres flux V1 non refactorés : crédit SEL, achat marché) ;
  seule l'adhésion cesse de l'utiliser.
- Aucune migration : la table `t99cp_hash_consomme` existait déjà en local
  (V2.1.1). Rien d'envoyé au distant.

## Tests

- Unitaires : test `accepte sans tx_hash` remplacé par `refuse sans tx_hash`
  + `refuse un tx_hash vide` (le contrat a changé : obligatoire). Suite à
  **1021 verts**.
- Test base transactionnel (psql local) : un même hash inséré une 2ᵉ fois est
  refusé par la clé primaire (`unique_violation`), y compris entre deux flux
  différents (adhésion puis don). Rollback, aucune donnée laissée.
- Typecheck + lint : verts.

## Notes pour les chantiers suivants

- Les flux 99-coin **non encore refactorés** qui appellent toujours
  `envoyerTransaction` : crédit SEL, achat marché (chemin T99CP). À aligner sur le
  même modèle (redirection + hash + `enregistrerHashConsomme`) dans un chantier
  ultérieur si souhaité. Hors périmètre C17 (qui ne visait que l'adhésion).
- Quand un oracle de vérification on-chain sera branché, on pourra ajouter un
  appel `verifierTransaction(txHash)` avant la consommation pour confirmer le
  montant et le destinataire (aujourd'hui : confiance dans le hash + unicité).

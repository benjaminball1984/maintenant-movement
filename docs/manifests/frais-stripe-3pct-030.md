# Manifest — Frais Stripe unifiés : 3 % + 0,30 €

**Date de fin** : 2026-06-09
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare (chantier transversal frais)
**Décision déclenchante** : Lilou/Ben, 2026-06-09 (porte « argent réel », §0bis.5)
**Durée approximative** : 1 session Claude Code

## Décision actée

Sur **tous les paiements en euros (Stripe)** du site, frais de **3 % + 0,30 €**,
**quel que soit le type** de paiement (adhésion, don à une cagnotte, achat au
marché, et les futurs dons réseau / médias et paiements d'entraide), **à la
charge du payeur** (acheteur·euse / donateur·ice / cotisant·e / adhérent·e).
Les frais sont **ajoutés au-dessus** : le bénéficiaire (porteur, vendeureuse,
association) reçoit toujours le **montant plein**.

**Remplace** l'ancien modèle « 5 % déduits » (marché + cagnottes) documenté au
CDC, et l'absence de frais sur l'adhésion (0 % → 3 % + 0,30 €).

**Paiements en 99-coin (T99CP / Polygon)** : **inchangés, 0 frais plateforme**.
Le seul coût est le gas Polygon, payé on-chain par le wallet émetteur (hors de
notre système). `calculerFraisT99CP` reste à `0n`.

## Pourquoi « % + fixe »

Le 0,25 € fixe de Stripe écrase les petits montants (à 1 €, Stripe coûte 27 %
du montant). Un pourcentage seul ne couvre jamais ce coût fixe : il faudrait
26,5 % à 1 € mais 1,8 % à 100 €. Le modèle « 3 % + 0,30 € » est le seul viable
à tous les montants (net plateforme positif partout : +0,06 € à 1 €, +0,20 € à
10 €, +1,55 € à 100 €).

## Livré et fonctionnel

- [x] **Calcul centralisé** (`lib/payments/frais.ts`) : `TAUX_FRAIS_EUR = 0.03`,
  `FRAIS_FIXE_EUR_CENTIMES = 30`, `calculerFraisEuros` (3 % + 0,30 €), nouveau
  helper `totalAvecFraisEuros` (montant + frais), `calculerFraisT99CP` → 0n.
  Source unique réutilisable par tous les flux euros (présents et futurs).
  Réexportés depuis `lib/payments/index.ts`.
- [x] **Adhésion euros** (`app/(public)/agir/adherer/actions.ts`) : frais ajoutés
  au-dessus, l'association reçoit 12 € pleins, l'adhérent·e règle 12,66 €.
- [x] **Cagnottes — don euros** (`app/(public)/mobiliser/cagnottes/actions.ts`) :
  sens inversé (déduit → ajouté). `don.montant_centimes` = montant plein pour le
  porteur ; total débité = montant + frais ; caisse créditée du montant plein.
- [x] **Marché — achat euros** (`app/(public)/s-entraider/marche/actions.ts`) :
  frais sur le **prix seul** (pas sur le port, cf. CDC), ajoutés au total payé ;
  la vendeureuse reçoit prix + port.
- [x] **3 formulaires** affichent le surcoût au payeur, via le helper partagé
  (calcul identique serveur/client) : `FormulaireDonEuros` (décomposition « tu
  donnes X · +frais · total à payer »), `FormulaireAchat` (ligne frais + total
  euros toujours visible), `FormulaireAdhesionEuros` (frais + total 12,66 €).
- [x] Libellés des frais restés **éditables via CMS** (§0bis.8) : `aide` monnaie
  euros (`lib/marche/config.ts`), gabarits `decomposition*`, `recapFraisEur`,
  `description` adhésion mis à jour vers « 3 % + 0,30 € ».
- [x] **Textes « 5 % » des pages corrigés** (trouvés via vérif visuelle navigateur,
  oubliés au 1er passage) : intro marché (`s-entraider/marche/page.tsx`), intro
  liste produits (`.../marche/produits/page.tsx`), intro cagnottes
  (`mobiliser/cagnottes/page.tsx`), intro création cagnotte (`.../nouvelle/page.tsx`),
  badge + aria « Frais 3 % + 0,30 € » sur la fiche cagnotte (`.../[slug]/page.tsx`),
  hint prix du formulaire création produit (`FormulaireCreationProduit.tsx`), plus
  3 commentaires de code (`lib/validations/marche.ts`, `lib/validations/cagnotte.ts`,
  `lib/payments/types.ts`).
- [x] **Tests** mis à jour : `tests/unit/payments/frais.test.ts` (8 tests :
  formule, arrondi, garde-fous, `totalAvecFraisEuros`), `tests/unit/validations/
  marche.test.ts` (assertion 5 % → 3 % + 0,30 €). **1030 tests verts.**

## Non livré (et pourquoi)

- [ ] **Flux euros pas encore construits** : don réseau social, don Maintenant
  Médias, entraide payante (covoiturage / hébergement / prêt / fruits de la
  terre / SEL). Ces espaces sont aujourd'hui gratuits ou non implémentés en
  euros. Quand ils seront câblés à Stripe, ils appelleront `calculerFraisEuros`
  /`totalAvecFraisEuros` (le helper est prêt). Rien à faire de plus ici.
- [ ] **Vérification E2E navigateur** : non lancée dans cette session (Stripe en
  mock, paiement non finalisable). À faire : `npm run dev`, naviguer les 3
  formulaires, vérifier l'affichage des frais et le total. Suite Playwright à
  repasser.

## Écarts V1→V2 appliqués (§0.4)

- **Frais marché** : V1/CDC disait « 5 % sur le prix » (déduit). Désormais
  « 3 % + 0,30 € » ajoutés au payeur, prix plein au vendeur. Décision Lilou/Ben.
- **Frais cagnottes** : V1/spec §5D disait « 5 % absorbés par la donatrice »
  (déduit). Désormais « 3 % + 0,30 € » ajoutés, porteur reçoit le plein.
- **Frais adhésion** : était 0 %. Désormais 3 % + 0,30 € à la charge de
  l'adhérent·e (l'association reçoit 12 € pleins).
- Aucune donnée perdue : changements de calcul applicatif uniquement, aucune
  migration, aucune écriture distante.

## Points d'attention pour la suite

- **Port marché & frais** : les frais sont calculés sur le prix seul ; le port
  reste sans commission (cohérent CDC). À confirmer si Lilou/Ben veut un jour
  appliquer le 3 % aussi au port (aujourd'hui : non).
- **Montant minimum** : sur de très petits montants le 0,30 € fixe reste lourd
  en proportion. Les schémas imposent déjà des minimums (cagnotte ≥ 1 €). Penser
  à un minimum de paiement carte plus élevé si besoin, ou orienter vers le
  99-coin pour les micro-montants.
- **Restes « 5 % » non bloquants** : les specs V1 (`docs/specs/`), les commentaires
  de migrations SQL et le `comment on table public.don` (base distante) mentionnent
  encore « 5 % ». Ce sont des traces historiques / un commentaire de table à
  rafraîchir via une future migration additive (Phase M). Aucun impact applicatif.
- **Sémantique stockée cagnotte** : `don.montant_centimes` représente désormais
  le **montant reçu par le porteur** (plein), `don.frais_centimes` le surcoût
  ajouté. Total payé = somme des deux. Tout affichage futur d'un don doit en
  tenir compte.

## Tests

- Unitaires : 1030 tests, tous verts (`npx vitest run`).
- Typecheck : vert (`npm run typecheck`).
- Lint : vert sur les fichiers du chantier (18 warnings préexistants inchangés).
- E2E Playwright : à repasser (non lancé cette session).

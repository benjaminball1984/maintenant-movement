# Manifest : Phase 5, Chantier 5.1 — Adhérer

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-5-chantier-5.1-adherer`
**Commit final** : `574ee0c`
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

### Schéma BDD (migration 027)

- [x] **Table `adhesion`** : `personne_id`, `chemin` (`gratuit | euros | t99cp`), montants EUR (centimes int) et T99CP (string bigint-safe), `debute_le` / `expire_le` (365 jours par défaut), statut `active | expiree | annulee`, traçabilité paiement (`stripe_session_id` ou `tx_hash`), champ `relance_envoyee_le` pour suivre les mails de relance. CHECK `adhesion_chemin_montant_coherent` enforcé en BDD : gratuit → 0 partout, euros → eur > 0, t99cp → t99cp > '0'. RLS : la personne voit ses propres adhésions, admin général / national gèrent.
- [x] **Vue `adherent_actif`** : retourne la dernière adhésion active non expirée par personne. Lecture publique (anon + authenticated). Utilisée pour les indicateurs publics (chantier 14).
- [x] **Fonction `adhesions_a_relancer(seuil_jours)`** : SECURITY DEFINER, retourne les adhésions actives expirant dans ≤ N jours sans relance encore envoyée. Utilisée par le cron applicatif `envoyerRelancesAdhesion`.

### Code applicatif

- [x] **Types Database** : `Adhesion`, `AdherentActif`, unions `CheminAdhesion | StatutAdhesion`. Signature `adhesions_a_relancer` ajoutée dans `Functions`.
- [x] **Validations Zod** (`lib/validations/adhesion.ts`) : `adhererGratuit`, `adhererEuros`, `adhererT99CP`. Constantes `MONTANT_ADHESION_EUR_CENTIMES = 1200` et `MONTANT_ADHESION_T99CP_UNITES = '12000000000000000000'` (12 * 10^18) — single source of truth.
- [x] **Server Actions** (`app/(public)/agir/adherer/actions.ts`) :
  - `adhererGratuit` : auth + Turnstile, insert direct.
  - `adhererEuros` : pré-insert au statut `active` + génère une session Stripe Checkout via `getPaymentService` (mock par défaut) avec montant 1200 centimes + url de retour. Pas de frais plateforme (l'adhésion vient en intégralité à la trésorerie).
  - `adhererT99CP` : appelle `getT99CPService().envoyerTransaction` (mock par défaut), stocke le tx_hash.
  - `confirmerAdhesionEuros(sessionId, adhesionId)` : appelée par `/agir/adherer/retour`, met à jour `stripe_session_id`.
  - `envoyerRelancesAdhesion(seuilJours = 14)` : cron applicatif, réservé admin national, envoie un mail transactionnel via `getEmailService()` avec gabarit HTML + texte sobre.
- [x] **Couche de requêtes** (`lib/adhesion/requetes.ts`) : `adhesionActive(personneId)`, `historiqueAdhesions(personneId)`.

### Composants

- [x] **`<FormulaireAdhesionGratuit>`** : Turnstile + bouton. Affiche un message de succès après création.
- [x] **`<FormulaireAdhesionEuros>`** : Turnstile + bouton « Payer 12 € ». Redirige vers Stripe Checkout (mock).
- [x] **`<FormulaireAdhesionT99CP>`** : Turnstile + champ tx_hash optionnel + bouton « Adhérer en 12 99-coin ». Cohérent avec dons T99CP de 3.3 et achats marché de 4.3.

### Pages

- [x] **`/agir/adherer`** : page hub avec 3 cartes (Gratuit / 12 € / 12 99-coin). Si la personne est déjà adhérente, alerte succès avec date d'expiration et chemin courant.
- [x] **`/agir/adherer/gratuit`**, **`/euros`**, **`/t99cp`** : 3 pages thin (auth requise) avec le formulaire approprié.
- [x] **`/agir/adherer/retour`** : page de retour Stripe Checkout qui confirme l'adhésion (lit `session_id` + `adhesion_id` en query string).

### Tests

- [x] **8 nouveaux tests unitaires** (`tests/unit/validations/adhesion.test.ts`) : constantes (12 € = 1200 ; 12 T99CP = 12*10^18 + BigInt OK), 3 schémas Zod (token vide, tx_hash optionnel, format hex). Total **200 tests verts** (+8).
- [x] **E2E Playwright** (`tests/e2e/adherer.spec.ts`) : 6 scénarios (hub, 3 cartes, redirections sans auth pour les 3 chemins, page retour sans paramètres).
- [x] **Lint Biome + typecheck tsc + build Next.js** : verts.

## Livré partiellement

- [ ] **Affichage du statut d'adhésion dans le profil** : la couche `adhesionActive` est prête mais l'intégration dans `/profil/dashboard` n'a pas été touchée pour ce chantier. Sera ajoutée en polish ou via un suivant qui consolide le tableau de bord profil.
- [ ] **Webhook Stripe** : la confirmation passe par `/agir/adherer/retour` (succès utilisateur). Le webhook serveur Stripe (qui détecte les paiements asynchrones / cartes 3DS) sera ajouté quand les clés Stripe seront branchées en prod.

## Non livré (et pourquoi)

- [ ] **Onboarding contextualisé selon le chemin d'entrée** : la spec §7A mentionne « onboarding contextualisé ». Pour 5.1 v1, les 3 pages exposent un texte différent mais court ; le parcours d'onboarding détaillé (collecte du code postal, choix des communes, etc.) viendra avec le chantier 5.2 (Communes libres) puis 1.3 polish.
- [ ] **Cron Cloudflare Worker pour relance J+365** : la Server Action `envoyerRelancesAdhesion` existe et est appelable manuellement par admin national. Le cron qui la déclenche quotidiennement sera posé au chantier 11.3 (déploiement prod).
- [ ] **Mise à jour de `agir/page.tsx`** : la page hub `/agir` reste sur le `PageEspaceStub` qui liste les 4 sous-espaces avec leur numéro de chantier. Pas de lien direct vers `/agir/adherer` depuis la page hub. Sera intégré quand 5.4 (D'autres moyens d'agir) terminera la phase 5 et permettra de remplacer le stub.

## Contenus à arbitrer

- [ ] **Gabarit du mail de relance J+365** (`app/(public)/agir/adherer/actions.ts:gabaritRelance` + `:textRelance`) : ton fonctionnel sobre posé (« Ton adhésion arrive à échéance. Pour la renouveler, c'est par ici. ») cohérent avec la doctrine §7A « pas d'argumentaire pesant ». Lilou/Ben peut affiner le wording final ; à arbitrer avant l'envoi prod (chantier 11.3).

## Décisions techniques prises

- **Cohérence chemin/montant enforced en BDD** via CHECK `adhesion_chemin_montant_coherent` : impossible d'avoir une adhésion `gratuit` avec un montant > 0 ou une adhésion `euros` à 0 €. Aligné avec la doctrine politique des 3 chemins.
- **Constantes `MONTANT_ADHESION_*` exportées depuis les validations** : une seule source de vérité pour 12 € (= 1200 centimes) et 12 T99CP (= 12 * 10^18 unités). Réutilisées par les Server Actions et les composants UI.
- **Pas de prélèvement récurrent** : adhésion à durée fixe (365 jours), renouvellement via nouvelle ligne (pas d'update). Cohérent avec la doctrine ouverte de §7A (« on entre, on en sort, on revient »).
- **Webhook Stripe différé** : pour 5.1 v1, la confirmation passe par `/agir/adherer/retour`. C'est cohérent avec le pattern cagnottes 3.3 (`/dons/retour`). Quand Stripe sera branché en prod, on ajoutera la route webhook réelle.
- **Cron applicatif via fonction RPC** : `adhesions_a_relancer(seuil_jours)` retourne la liste à traiter, la Server Action itère et marque chaque ligne. Pattern identique à `prestations_a_crediter` du SEL (4.2).

## Tests

- Unitaires : **200 tests verts** (+8 pour 5.1).
- E2E Playwright : 6 scénarios couvrant la navigation des 3 chemins + page retour.
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **Chantier 5.2 (Communes libres)** : l'onboarding contextualisé promis en §7A se concrétisera ici (choix de la commune après adhésion). Peut s'appuyer sur `adhesionActive` pour proposer un parcours différencié.
- **Chantier 7.4 (Sondages)** : restreindre certains sondages aux adhérent·es actif·ves → utiliser la vue `adherent_actif`.
- **Chantier 9.2 (Admin)** : dashboard trésorerie alimenté par `adhesion` (somme des montants par chemin et par période).
- **Chantier 11.3 (Cron prod)** : poser un cron quotidien qui appelle `envoyerRelancesAdhesion(14)` pour les adhésions expirant dans les 14 jours.
- **Chantier T99CP dédié** : la table `wallet_t99cp` (à créer) remplacera l'adresse stub `0xperso_<id>` utilisée par `adhererT99CP`.

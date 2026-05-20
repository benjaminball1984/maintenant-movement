# Manifest : Phase 3, Chantier 3.3 — Cagnottes (3 types + Stripe + T99CP)

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-3-chantier-3.3-cagnottes`
**Commit final** : `e0d657a`
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

### Schéma BDD (migrations 018 + 019)

- [x] **Table `cagnotte`** (018) : 3 types (`ouverte | lutte | cotisation`), slug, titre, texte, image, objectif euros, porteur·euse, `stripe_account_id` (KYC Stripe Connect), `wallet_t99cp`, statut (`publiee | suspendue | cloturee`), méta de suspension. 7 contraintes CHECK (type, statut, slug, objectif positif, cohérence suspension). 4 index.
- [x] **RLS `cagnotte`** : lecture publique sur les 3 statuts (transparence sur la suspension), porteur·euse voit tout, modé/admin tout. **Cas particulier `cotisation`** : la policy d'insert force `est_admin_national() = true` — seuls les admins peuvent créer les cagnottes structurelles type « sécurité sociale du logement / mobilités / alimentation, RBU » (cf. spec §5D).
- [x] **Table `don`** (019) : versement à une cagnotte, `personne_id` nullable (don anonyme), monnaie `EUR | T99CP`, `montant_centimes` (net), `frais_centimes`, références transactionnelles (`stripe_payment_intent_id`, `tx_hash`), statut `en_attente | confirme | echoue | rembourse`, opt-ins newsletter + contact créateurice. Contrainte CHECK qui interdit des frais > 0 sur T99CP (politique 0 %). Index uniques partiels sur `stripe_payment_intent_id` et `tx_hash` (anti-doublon).
- [x] **RLS `don`** : un don individuel n'est pas public (vie privée). Donatrice connectée, porteur·euse, modé/admin voient. Insert ouverte. Update réservée admin/modé (en prod, c'est le service_role via webhook Stripe qui passera en `confirme`).
- [x] **Vue `cagnotte_compteur`** + **fonction `compteurs_cagnotte(uuid)`** (SECURITY DEFINER) qui exposent total EUR + total T99CP + nombre de dons agrégés sans laisser lire la table.

### Service de paiement abstrait (`lib/payments/`)

- [x] **`types.ts`** : interface `PaymentService` avec 3 méthodes (`demarrerCheckout`, `verifierPaiement`, `creerCompteConnecte`). Modèles `DonneesCheckout`, `ResultatCheckout`, `StatutPaiement`, `DonneesCompteConnecte`, `ResultatCompteConnecte`.
- [x] **`MockPaymentService`** : retourne un sessionId préfixé `cs_mock_confirme_<uuid>`, redirige vers `/dons/mock/[sessionId]` pour simuler Stripe Checkout en local. `verifierPaiement` retourne `estConfirme: true` si le sessionId commence par `cs_mock_confirme_`. Logs `console.info` à chaque appel pour faciliter le debug.
- [x] **`StripePaymentService`** : stub qui throw avec un message explicite tant que l'implémentation réelle n'est pas branchée. Plan de branchement documenté en commentaire (clé `stripe.checkout.sessions.create({...})` avec `application_fee_amount` et `transfer_data.destination`).
- [x] **Factory `getPaymentService`** : choisit Mock/Stripe selon `PAYMENT_PROVIDER` (mock | stripe_test | stripe_live). Throw clairement sur valeur inconnue. Singleton réinitialisable pour les tests.
- [x] **Helpers de frais** : `calculerFraisEuros(montantTotalCentimes)` = 5 %, `calculerFraisT99CP(montantUnites)` = 0n. Tests unitaires couvrent l'arrondi, le 0, le négatif.

### Types + validations Zod

- [x] **`types/database.ts`** : ajout `cagnotte`, `don`, vue `cagnotte_compteur`, fonction `compteurs_cagnotte`, unions `TypeCagnotte | StatutCagnotte | MonnaieDon | StatutDon`. Alias `Cagnotte`, `Don`, `CagnotteCompteur`.
- [x] **`lib/validations/cagnotte.ts`** : `creerCagnotteSchema` (titre, texte, type, objectif, wallet optionnel), `faireDonEurosSchema` (montant >= 1 €, identité optionnelle), `faireDonT99CPSchema` (montant_unites en string pour bigint, tx_hash 0x+64hex), `suspendreCagnotteSchema` (raison >= 10 chars), `retablirCagnotteSchema`, `cloturerCagnotteSchema`.

### Server Actions

- [x] **`creerCagnotte`** : auth + Turnstile + slug unique + filtrage `cotisation` côté serveur (vérifie `est_admin_national`).
- [x] **`faireDonEuros`** : pré-insère une ligne `don` au statut `en_attente`, calcule les frais, appelle `PaymentService.demarrerCheckout`, met à jour le `stripe_payment_intent_id`, retourne l'URL de redirection. Bloque si la cagnotte n'a pas de `stripe_account_id` (KYC manquant).
- [x] **`confirmerDonEuros`** : appelée par la page de retour Stripe (`/dons/retour`), vérifie le paiement, passe le don en `confirme`. Idempotente grâce au filtre `.eq('statut', 'en_attente')`.
- [x] **`faireDonT99CP`** : insère directement au statut `confirme` (la signature wallet vaut confirmation côté client en v1). Contrainte unique sur `tx_hash` empêche le double-enregistrement.
- [x] **`suspendreCagnotte` / `retablirCagnotte` / `cloturerCagnotte`** : modération a posteriori, vérification de droit `cagnottes` (admin ou modérateurice avec l'onglet).

### Couche de requêtes (`lib/cagnottes/requetes.ts`)

- [x] **`listerCagnottesPubliees(type?, limite)`** : filtrable par type, hydratée avec porteur·euse + compteurs.
- [x] **`cagnotteAlaUne()`** : la plus récente publiée de type `ouverte` ou `lutte` (les cotisations ne sont pas en une, elles ont leur propre place).
- [x] **`cagnotteParSlug(slug)`** : fiche détail.
- [x] **`listerCagnottesAVerifier()`** : file de modération a posteriori (publiées + suspendues).

### Composants UI

- [x] **`<JaugeT99CPEuros>`** : compteur unifié euros + T99CP (convention 1 T99CP = 1 €), avec jauge `<progress>`, badge « Objectif atteint », répartition explicite en bas.
- [x] **`<CarteCagnotte>`** : carte de listing avec badge type + badge suspendue.
- [x] **`<FormulaireDonEuros>`** (Client) : boutons de montants suggérés (10/20/50/100 €), affichage transparent de la décomposition « montant − 5 % frais = montant pour la cagnotte », redirection vers Checkout au submit.
- [x] **`<FormulaireDonT99CP>`** (Client) : workflow « envoie depuis ton wallet, recopie le tx_hash ». Frais 0 affichés en clair. Wallet du porteur copiable.
- [x] **`<FormulaireCreationCagnotte>`** (Client) : radio des 3 types, l'option `cotisation` est désactivée pour les non-admins (avec explication).
- [x] **`<FormulaireModerationCagnotte>`** (Client) : bouton « Suspendre » avec raison ou « Rétablir » selon l'état.

### Pages

- [x] **`/mobiliser/cagnottes`** : liste avec **4 onglets** (toutes, ouvertes, caisses de lutte, cotisations) filtrés via `?type=`. Pied de page explicatif (modération a posteriori, blocage en cas de comportement louche).
- [x] **`/mobiliser/cagnottes/[slug]`** : fiche complète (image, jauge, présentation, **2 cartes de don** côte à côte : euros et T99CP, chacune apparaissant uniquement si possible). Bandeaux d'état (suspendue / clôturée / annulée / succès post-Checkout).
- [x] **`/mobiliser/cagnottes/nouvelle`** : auth requise + capacité `cotisation` détectée côté serveur via `est_admin_national`.
- [x] **`/admin/moderation/cagnottes`** : file FIFO des publiées + suspendues, formulaire de modération inline. Nav latérale `/admin` étendue à 4 onglets (Pétitions, Campagnes, Mobilisations, Cagnottes).

### Stripe Checkout en mock

- [x] **`/dons/mock/[sessionId]`** : page de paiement simulée (active uniquement en `PAYMENT_PROVIDER=mock`). Deux boutons : « Confirmer le paiement » / « Annuler », qui renvoient vers les URLs `succes`/`annulation` passées par la Server Action. Permet de tester le flux complet en local sans Stripe.
- [x] **`/dons/retour`** : page de retour post-Checkout qui appelle `confirmerDonEuros` puis affiche le récap. Compatible avec Stripe réel (même contrat de query params : `session_id` + `don_id`).

### Page d'accueil

- [x] **`<UneCagnotte>`** branchée sur `cagnotteAlaUne()`. Carte avec jauge + CTA « Soutenir » vers la fiche.

### Tests

- [x] **Unitaires** (24 nouveaux tests) :
  - `tests/unit/payments/frais.test.ts` (5 tests : 5 %, arrondi, 0, négatif, T99CP toujours 0).
  - `tests/unit/payments/factory.test.ts` (5 tests : mock par défaut, stripe_test, stripe_live, undefined, valeur inconnue → throw).
  - `tests/unit/validations/cagnotte.test.ts` (14 tests : création, dons EUR/T99CP, suspension).
- [x] **Total unit** : **145 tests verts** (+24 par rapport à 3.2).
- [x] **E2E** (`tests/e2e/cagnottes.spec.ts`, 6 scénarios) : liste + onglets, filtre type, redirections auth, 404, rendu page mock Stripe.
- [x] **Lint** (Biome) : zéro erreur après auto-fix (15 fichiers reformatés).
- [x] **Typecheck** : zéro erreur (fix d'un conflit RHF/Zod en remplaçant `z.boolean().default(false)` par `z.boolean()` simple + valeurs par défaut côté form).
- [x] **Build production vert** : **47 routes** (+4 par rapport à 3.2).

## Livré partiellement

- [ ] **Stripe Connect onboarding** : la Server Action `creerCompteConnecte` du PaymentService existe (mock fonctionnel), mais aucune UI dédiée n'expose le bouton « Lance ton KYC » à la créateurice après création de la cagnotte. La cagnotte se crée sans `stripe_account_id` ; les dons euros sont bloqués jusqu'à branchement manuel (ou KYC fait via l'UI quand celle-ci viendra en polish).
- [ ] **Webhook Stripe `checkout.session.completed`** : la confirmation passe actuellement par la route `/dons/retour` (ce que l'usager·ère traverse). En prod, on doit aussi exposer une route API `/api/webhooks/stripe` qui appelle `confirmerDonEuros` côté serveur si l'usager·ère ferme le navigateur avant le retour. À poser au moment du branchement Stripe réel.
- [ ] **Don T99CP avec signature native (Wallet Connect / MetaMask)** : v1 demande de copier-coller le `tx_hash`. Une intégration in-app viendra en polish.
- [ ] **Page éditoriale par cotisation** : les 4 cotisations structurelles (sécurité sociale du logement / mobilités / alimentation / RBU) sont des cagnottes permanentes ; la spec §5D les fait apparaître à part. Pour 3.3 elles sont créables par admin national et apparaissent dans l'onglet « Cotisations ». Une page dédiée listant uniquement ces 4 + explications éditoriales viendra dans un chantier transverse (4.2 SEL ou polish).

## Non livré (et pourquoi)

- [ ] **Reçus fiscaux PDF** : les dons sont enregistrés en BDD, l'email est stocké. La génération d'un PDF (article 200 du CGI pour les associations d'intérêt général) demande une décision de statut juridique (association loi 1901 ?) que Lilou/Ben n'a pas tranchée. Hors scope 3.3.
- [ ] **Carte unifiée `/carte` enrichie avec cagnottes locales** : la table `cagnotte` n'a pas de colonne `latitude`/`longitude` (les cagnottes ne sont pas géolocalisées dans le schéma v1). Spec §8A mentionne « cagnottes locales » sur la carte ; on l'ajoutera quand une colonne de localisation sera nécessaire (probablement avec les communes-cibles plutôt que des coordonnées libres).
- [ ] **Onboarding KYC Stripe Connect** : l'API est en place côté `PaymentService` (mock fonctionnel), mais aucune UI ne le déclenche encore. Sera ajouté quand `PAYMENT_PROVIDER=stripe_test` sera activé.
- [ ] **Signalement public d'une cagnotte louche** : la modération a posteriori passe pour 3.3 par la console admin (qui liste les 50 dernières). Une vraie file de signalements citoyens viendra avec la table `signalement` transverse.
- [ ] **Stripe réel** : l'implémentation `StripePaymentService` est un stub qui throw. Le branchement effectif demandera `npm install stripe` + clés `sk_test_...` côté Lilou/Ben.

## Contenus à arbitrer

Aucun nouveau placeholder éditorial. Le sous-espace cagnottes est entièrement fonctionnel ; les contenus de cagnotte sont saisis par les usager·es elles-mêmes.

## Décisions techniques prises

- **Frais 5 % « absorbés par la donatrice »**. Sur les boutons de montants suggérés (10/20/50/100 €), la donatrice voit en clair « 20 € payés · 1 € de frais · 19 € pour la cagnotte ». Si l'usage révèle un préférence pour le modèle « ajout par-dessus » (20 € pour la cagnotte → 21 € débités), une ADR + une migration de la convention `montant_centimes` (net vs brut) seront nécessaires.
- **Convention T99CP = euros 1:1 dans la jauge unifiée**. Cohérent avec spec §6E (SEL : 1 99-coin = 1 € = 1 minute). Si les cours divergeaient un jour, on introduirait une conversion mais ce n'est pas dans les hypothèses Maintenant!.
- **MockPaymentService écrit une vraie ligne `don` en BDD avant la redirection**. Évite de devoir tout réconcilier à la confirmation : la ligne existe déjà, on la passe juste de `en_attente` à `confirme`. Le webhook Stripe + la page de retour deviennent idempotents (filtre `.eq('statut', 'en_attente')`).
- **`don.montant_centimes` est le montant *net*** (ce qui abonde la cagnotte). Les frais sont stockés séparément (`frais_centimes`). Permet de calculer facilement les totaux affichés (somme des `montant_centimes` confirmés) sans avoir à soustraire les frais à chaque agrégation.
- **Page mock Stripe sous `/dons/mock/[sessionId]`**. Évite de polluer le sous-espace `/mobiliser/cagnottes` avec un détail d'implémentation. Le router Next.js gère naturellement le sessionId comme paramètre dynamique.
- **T99CP : workflow « colle le tx_hash »** plutôt qu'intégration Wallet Connect en v1. Permet de tester de bout en bout sans dépendance lourde JS-Web3 ; l'intégration in-app viendra en polish.
- **Validation `accepte_newsletter: z.boolean()` (sans `.default(false)`)**. Conflit RHF + Zod : `.default()` rend l'input optionnel côté type RHF tandis que l'output reste required, ce qui cassait le typage du resolver. Solution : booléens stricts dans le schéma + valeur par défaut côté `useForm`.

## Incertitudes techniques résolues

Aucune question soulevée à Lilou/Ben. Le périmètre était précisément cadré par la spec §5D + l'instruction CLAUDE.md §6 (pattern mock-par-défaut pour toutes les API externes). Décisions internes documentées ci-dessus.

## Tests

- Unitaires : **145 tests verts** (+24 pour 3.3).
- E2E Playwright : `tests/e2e/cagnottes.spec.ts` (6 scénarios). Le flux complet « créer → KYC → don EUR confirmé → suspension → rétablissement » dépend de Supabase branchée et sera vérifié manuellement au déploiement des migrations 018-019.
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **Branchement Stripe réel** : `npm install stripe` + remplacer le stub `StripePaymentService.demarrerCheckout` par l'implémentation décrite en commentaire. La route `/dons/retour` est compatible (mêmes query params).
- **Webhook Stripe** : exposer `/api/webhooks/stripe` (Next.js Route Handler avec `runtime = 'nodejs'`), vérifier la signature avec `stripe.webhooks.constructEvent`, appeler `confirmerDonEuros(sessionId, donId)` sur `checkout.session.completed`.
- **4.2 SEL** : la conversion 1 99-coin = 1 € est déjà câblée côté UI cagnotte. La table `participation_sel` (à venir) peut s'inspirer de `don` pour la traçabilité.
- **6.1 Carte unifiée** : pour ajouter les cagnottes locales, il faudra une colonne de localisation (`commune_id` plutôt que lat/lng pour respecter la doctrine « rattachées à une commune »).
- **9.2 Tableau de bord admin** : « gestion financière » prévue. La table `don` expose `frais_centimes` séparément, ce qui permettra le reporting (montant collecté, frais retenus, montant reversé) sans calcul complexe.
- **10.1 Migration Base44** : pas de cagnottes Base44 à reprendre selon la spec §9.
- **11.x Polish** : UI d'onboarding KYC, intégration Wallet Connect, page dédiée cotisations, signalement citoyen.

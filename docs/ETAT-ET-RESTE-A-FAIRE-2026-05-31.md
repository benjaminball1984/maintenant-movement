# Maintenant! : état du projet et reste à faire (2026-05-31)

> Document de synthèse autonome, destiné à préparer un prompt d'étude avec
> Claude.ai à partir du ZIP du dépôt. Il rappelle où trouver les cahiers des
> charges, ce qui a été fait dans le cycle V2.6, la décision d'architecture des
> paiements, et la liste exhaustive de ce qui reste à faire.
>
> Conventions d'écriture du projet (respectées ici) : pas de tiret cadratin, pas
> de flèche dans les textes ; deux-points, parenthèses, virgules à la place.

---

## 0. Comment lire le ZIP (guide rapide pour Claude.ai)

Le ZIP contient l'intégralité des fichiers suivis par git (code source complet,
documentation, migrations de base de données, tests). Il n'inclut PAS les
secrets (`.env*` non suivis), ni `node_modules`, ni les zips de livrables.

Points d'entrée par besoin :

- **Mémoire de projet et doctrine** : `CLAUDE.md` (racine). À lire en premier,
  intégralement. Contient la persona de codage, la doctrine de greffe, le
  vocabulaire, l'état courant.
- **Cahiers des charges cible V2** : `docs/cdc-v2/CDC-Maintenant-V2/`
  (principes transversaux, schéma de données, matrice de droits, fiches de
  sous-espaces). C'est la cible doctrinale, elle prime sur les specs V1 pour
  l'architecture.
- **Specs V1** : `docs/specs/` (architecture V1 livrée, design tokens, RGPD,
  stack, vocabulaire, plan de chantiers).
- **Master Plan V2.6** : `docs/MASTER-PLAN-V2.6.md` (plan de travail adopté le
  29/05/2026, avec ses 8 directives permanentes reprises dans `CLAUDE.md` §0bis).
- **Revue de code exhaustive (2026-05-31)** : `docs/revue/00-LISEZMOI.md` puis
  `01` à `09`. Synthèse CDC, conformité, responsivité/UX, accessibilité,
  performance, plan de correctifs, statut d'application, audit post-correctifs,
  plan de convergence vers le tronc commun.
- **Rapports détaillés par chantier (manifests)** : `docs/manifests/` (un
  fichier par chantier livré, format contractuel : livré, partiel, non livré,
  contenus à arbitrer, tests).
- **Contenus que Lilou/Ben doit fournir** : `docs/CONTENUS-A-ARBITRER.md` et
  `docs/A-FAIRE-LILOU-BEN.md`.
- **Code** : `app/` (pages et Server Actions Next.js App Router), `components/`
  (composants UI), `lib/` (logique métier pure et services), `types/`
  (`database.ts` = types de la base maintenus à la main), `supabase/migrations/`
  (schéma SQL, ordre chronologique par nom de fichier), `tests/unit/`.

---

## 1. Identité et doctrine (rappel court)

**Maintenant!** : plateforme citoyenne web en français, mouvement politique
populaire en construction. Trois couches superposées :

- **V1** : le code actuel du dépôt (phases 0 à 13 livrées, réseau social inclus).
  Tourne en distant Supabase Francfort.
- **V2** : nouvelle doctrine d'architecture, cible, formalisée dans
  `docs/cdc-v2/`. Se construit par GREFFE additive sur la V1 (on additionne, on
  ne soustrait jamais ; on backfill, on ne réinitialise jamais ; pas de migration
  lourde du modèle sans décision explicite).
- **Règle de travail Master Plan** : local strict jusqu'à la Phase M. Aucune
  écriture sur le distant tant que la Phase M (mise en ligne) n'est pas
  explicitement décidée. Les migrations sont posées et testées en LOCAL (Docker
  Supabase), poussées au distant seulement en Phase M.

Pilote : Lilou/Ben (non technicien). Vocabulaire fixe critique : Maintenant!,
99-coin (T99CP, tiret obligatoire), cosec gé, adhérent·e, Décider, levée
d'objections, Moments solidaires, Maintenant Médias, Commune libre.

---

## 2. Ce qui a été fait dans le cycle V2.6 (les étapes)

Le cycle V2.6 a consisté en une revue de code exhaustive suivie de l'application
des correctifs et des décisions, puis d'un arc d'alignement des paiements
99-coin. Branche `main`, tout en local, rien poussé au distant.

### 2.1 La revue (docs/revue/)

Revue en 8 blocs (synthèse CDC, conformité, responsivité/UX, accessibilité,
performance, plan de correctifs, statut, audit post-correctifs) plus un plan de
convergence vers le tronc commun (décision D3 : planifier, pas exécuter).

### 2.2 Correctifs appliqués (tous testés, 0 régression)

- **C5** : RPC `afficher_nom` (migration additive, local).
- **C6** : traçage `journal_admin` sur modération pétition et export/suppression RGPD.
- **C13** : numéro ORM organisation (migration écrite, table chantier B absente en
  local, donc Phase M).
- **C14** : snapshot du compte au moment de la signature (migration additive, local).
- **C15** : soft-delete du lien « porté par » organisation (migration additive,
  table chantier B, donc Phase M).
- **C16** : attestation de mandat obligatoire pour déclarer une organisation
  initiatrice (5 formulaires).
- **C17** : adhésion 99-coin sans wallet intégré (voir §2.4).
- **C24** : `FormulaireCommentaire` et `FormulairePosterMessage` passés à
  react-hook-form + zodResolver (en préservant compteur, accessibilité, libellés
  CMS).
- **C26** : `aria-label` nommant l'organisation sur les boutons badge de la console
  admin organisations.
- **Nettoyage écriture** : retrait des tirets cadratins (commentaires, docs) et des
  flèches d'affordance « voir » dans les textes publiés. Plages de date et notes
  internes conservées (autorisées par la spec vocabulaire §6).

### 2.3 Décisions produit (tranchées par Lilou/Ben, implémentées et testées)

- **D1** : « membre actif » = adhésion en cours de validité (moins d'un an).
  Fonction SQL `compter_membres_actifs` branchée sur le compteur de la home.
  Trois niveaux d'existence (profil silencieux, compte, adhérent·e) ; l'adhésion
  ouvre droit de vote et tirage au sort, et reste « active » même sans activité.
- **D2** : Décider, émargement plus bulletin secret. On garde QUI a participé
  (quorum), jamais le choix de chacun·e (deux enregistrements non joignables).
- **D3** : convergence vers le tronc commun PLANIFIÉE seulement (plan dans
  `docs/revue/09`), exécution = chantier séparé, `pg_dump` d'abord.
- **D4** : publier au nom d'un espace réservé au créateur et aux mandataires
  (`peutPublierAuNomEspace`).
- **D5** : frais de port du marché solidaire (voir §2.4, chantier V2.6.54).

### 2.4 Arc d'alignement des paiements 99-coin sur la doctrine §19

Objectif : la plateforme ne signe AUCUNE transaction 99-coin et n'intègre AUCUN
wallet (doctrine principes transversaux §19). La personne paie depuis son propre
wallet via the99coinproject.org, puis recopie le hash de transaction, dont
l'unicité est garantie par la table `t99cp_hash_consomme` (garde-fou
`enregistrerHashConsomme`).

| Chantier | Commit | Contenu |
|---|---|---|
| V2.6.54 | `5c9dfc5` | D5 : frais de port marché (champ `frais_port_centimes`, port euros via Stripe, port crypto en POL au taux du moment, alerte « Prévois du POL », helper pur testé) |
| V2.6.55 à 59 | divers | Revue : C24, C26, nettoyage flèches publiées, mises à jour de statut |
| V2.6.60 | `7e4a975` | C17 : adhésion 99-coin. tx_hash obligatoire, redirection the99coinproject.org, garde-fou anti-réutilisation branché pour la 1re fois |
| V2.6.61 | `782daae` | Marché 99-coin aligné pareil (retrait de la simulation, hash obligatoire, lien, garde-fou) |
| V2.6.62 | `4e1e586` | Référence wallet sur le profil (migration `personne.wallet_t99cp`, champ éditable dans /profil/informations). Fondation des paiements entre membres |
| V2.6.63 | `b4fd641` | SEL : retrait du faux versement trésorerie (code mort `crediterPrestationsEnAttente` plus `envoyerTransaction`, superseder par la réservation générique V2.2.2) |
| V2.6.64 | `dad15ab` | Mise à jour CLAUDE.md (état courant) |

**Résultat** : il n'y a plus AUCUNE simulation de transaction T99CP dans le code
applicatif. Les définitions du service T99CP (`lib/t99cp/`) restent (abstraction
normale, utilisée par `verifierTransaction` et `obtenirBalance`).

**Qualité** : 1021 tests unitaires verts, typecheck et lint au vert, base de
travail propre, rien poussé au distant.

---

## 3. Architecture des paiements (décision Lilou/Ben, 2026-05-31)

Décision structurante, à garder en tête pour toute la suite.

Tous les paiements de la plateforme se font DIRECTEMENT entre utilisateurices (en
euros via Stripe Connect, ou en 99-coin via la référence wallet 0x du ou de la
bénéficiaire), SAUF 4 cas qui vont à la plateforme ou à la trésorerie :

1. Don pour le financement du réseau social.
2. Don pour Maintenant Médias.
3. L'adhésion.
4. Cagnottes spécifiques lancées PAR la plateforme (sécurité sociale de
   l'alimentation, du logement, des mobilités, RBU). Distinctes des cagnottes
   ouvertes par un membre.

Règles de wallet et de gratuité :

- Un·e créateur·ice d'annonce (SEL, marché, prêt, hébergement, covoiturage) peut
  publier SANS renseigner son identifiant wallet 0x À CONDITION que l'offre soit
  gratuite.
- Pour créer une CAGNOTTE, le wallet est OBLIGATOIRE (pas d'option gratuite sur
  une cagnotte).
- La vérification « offre payante implique wallet requis » se fait côté
  application, par espace.

Stripe entre membres = Stripe Connect : chaque bénéficiaire qui veut recevoir des
euros onboarde un compte connecté (Stripe vérifie identité et RIB, KYC). Les
paiements sont routés directement vers son compte connecté ; la plateforme
orchestre sans encaisser (commission applicative possible, mais le CDC marché dit
« pas de commission »). Déjà câblé pour le marché euros (`stripeAccountId` dans
`acheterProduit`) et les cagnottes (KYC Connect au moment de la création). Pour
les 4 exceptions, le paiement va vers le compte Stripe de la plateforme.

Fondation posée (V2.6.62) : colonne `personne.wallet_t99cp` (adresse Polygon 0x
plus 40 hexadécimaux), éditable dans le profil. Décisions actées pour la suite :
wallet sur le profil ; le ou la bénéficiaire colle le reçu.

---

## 4. Reste à faire (exhaustif)

### 4.1 FEATURE : paiement 99-coin entre membres dans le flux de réservation

C'est la grosse pièce, et c'est une vraie fonctionnalité (pas un nettoyage). Elle
touche le modèle économique et l'argent : à concevoir avec Lilou/Ben.

Contexte : le SEL, le prêt, l'hébergement, le covoiturage et le marché passent par
le système de réservation générique V2.2.2 (table `reservation`,
`creerReservationAction`, machine d'états D8 : proposee, acceptee, realisee,
confirmee, litige, etc.). Ce système COORDONNE mais ne gère AUCUN paiement en
99-coin aujourd'hui.

À construire : intégrer le paiement entre membres, probablement à l'étape
« confirmee » : le ou la bénéficiaire paie la prestataire (ou le vendeur) vers son
wallet de profil, colle le reçu de transaction, et le garde-fou
`enregistrerHashConsomme` (type adapté : `sel`, etc.) assure l'unicité. En euros,
l'équivalent passe par Stripe Connect.

Points de conception à trancher avec Lilou/Ben :

- Où exactement le paiement s'insère dans la machine D8 (à la confirmation ?).
- Comment savoir qu'une offre est payante (catégorie de service SEL, champ prix,
  etc.) et donc qu'un paiement est requis.
- Le montant (pour le SEL : durée réelle en minutes, parité 1 minute = 1 99-coin =
  1 euro).
- La vérification « offre payante implique wallet du prestataire renseigné », à
  poser à la création de l'offre ET/OU à la réservation selon les rôles
  (rappel SEL : sens « propose » = créateur prestataire ; sens « cherche » =
  réservataire prestataire).
- Le cas gratuit (volontariat SEL, prêt gratuit, etc.) : confirmation sans
  paiement.

Prérequis déjà en place : `personne.wallet_t99cp` (V2.6.62), garde-fou
`t99cp_hash_consomme` (V2.1.1, déjà branché sur adhésion et marché).

Dette transitoire à nettoyer dans la foulée : l'ancien flux `prestation_sel`
(actions `reserverPrestation`, `declarerRealisee`, `contesterPrestation`,
`annulerPrestation`, plus la RPC `prestations_a_crediter`) est superseder par la
réservation générique mais subsiste (table encore lue par
`/admin/moderation/sel`, schémas encore testés). À retirer ou consolider une fois
la feature de paiement en place. Le texte CMS de la fiche SEL `[slug]` décrit
encore l'ancien « crédit automatique 2 h » : à réécrire quand le vrai flux
existe.

### 4.2 Petit reste : afficher le wallet du vendeur sur l'achat marché

Le marché en 99-coin (V2.6.61) dit encore « l'adresse t'est communiquée par la
vendeuse via la messagerie ». Maintenant que `personne.wallet_t99cp` existe, il
faut charger le wallet de la vendeureuse et l'afficher dans `FormulaireAchat`
(comme l'encadré trésorerie de l'adhésion). Deux petites modifications (requête
page plus prop formulaire). Sans risque.

### 4.3 Phase M : migrations à pousser au distant Francfort

Quand Lilou/Ben décide la mise en ligne, appliquer au distant (via
`supabase db push` ou l'API Management) les migrations posées et testées en
LOCAL. Ordre chronologique par nom de fichier. Liste à jour des migrations en
attente :

- `compter_membres_actifs` (D1).
- `afficher_nom` (C5).
- `signature_compte_snapshot` (C14).
- `organisation_numero_orm` (C13) : nécessite les tables du chantier B (absentes
  en local), donc s'applique au distant.
- `contenu_organisation_soft_delete` (C15) : idem chantier B.
- `produit_marche_frais_port` (D5).
- `personne_wallet_t99cp` (wallet profil).
- Index de performance C28 (voir revue 05).

Procédure de sécurité Phase M : `pg_dump` daté et vérifié AVANT toute écriture.
Données à préserver intactes : 17 746 signatures, 35 011 communes, 15 737 profils.
Dégradation propre garantie en attendant : le code traite les colonnes absentes
comme nulles (casts défensifs déjà en place pour `bio_html`, `wallet_t99cp`,
`frais_port_centimes`).

### 4.4 Actions manuelles de Lilou/Ben

- **S3 (sécurité)** : révoquer le jeton d'accès Supabase Management
  (`SUPABASE_ACCESS_TOKEN`) utilisé pour les pushs distants.
- **Adresse du wallet de trésorerie 99-coin** : à renseigner via le CMS (clé
  `adhesion.t99cp.wallet_tresorerie`) pour l'adhésion en 99-coin. Placeholder
  visible en attendant. Voir `docs/CONTENUS-A-ARBITRER.md` §3.3.
- **Clés des services externes** (au moment du câblage final, chantier unique de
  fin de projet) : Brevo (email), Stripe (clés test puis live, plus Stripe
  Connect), LiveKit (visio Décider), Cloudflare Turnstile (anti-robot), réseau
  Polygon (mainnet pour le 99-coin). Tout tourne en mock d'ici là.

### 4.5 Contenus éditoriaux et données à fournir (renvoi)

Liste complète et à jour dans `docs/CONTENUS-A-ARBITRER.md` et
`docs/A-FAIRE-LILOU-BEN.md`. En résumé :

- Pages éditoriales (Doctrine, Commune libre, Assemblée Confédérale, Monnaie
  99-coin, FAQ, Ressources, À propos, mentions légales, confidentialité) :
  textes à fournir (placeholders visibles en attendant).
- CSV de cartographie des communes pré-créées si complément.
- Coordonnées de l'association (adresse, RNA, email contact, email DPD) pour
  finaliser les mentions et la politique de confidentialité.
- Données factuelles : premiers signataires, organisations partenaires, citations
  attribuables.

### 4.6 Écarts et dettes connus (signalés, non bloquants)

- **Frais plateforme marché 5 %** : le code V1 applique une commission de 5 % en
  euros, alors que le CDC V2 dit « pas de commission Maintenant! » pour le marché
  (paiement direct). Écart préexistant, hors périmètre des chantiers récents, à
  arbitrer séparément. D5 n'applique volontairement aucune commission sur le port.
- **Crons à poser** (Cloudflare Workers, à la mise en ligne) : expiration des
  annonces marché et moments inactifs, relances d'adhésion J+365, transitions
  d'état des moments.
- **Réseau social V2** : refinements signalés non bloquants (types sondage et
  moment non câblés en UI pour le rattachement organisation).

---

## 5. Garanties de qualité au moment de ce document

- 1021 tests unitaires verts (`npx vitest run`).
- Typecheck TypeScript strict au vert (`npm run typecheck`), zéro `any`.
- Lint Biome au vert sur les fichiers touchés (warnings repo préexistants non liés).
- Toutes les migrations récentes sont ADDITIVES et appliquées au LOCAL seulement.
- Aucune écriture sur le distant. Aucune perte de données.
- Base de travail propre (tous les chantiers commités).

---

## 6. Suggestion de prompt pour Claude.ai

Pour étudier ce dossier avec Claude.ai, un prompt efficace serait du type :

« Voici le dépôt complet de la plateforme Maintenant! (code, cahiers des charges
V2 dans docs/cdc-v2, specs V1 dans docs/specs, revue de code dans docs/revue,
manifests par chantier dans docs/manifests). Lis d'abord CLAUDE.md et
docs/ETAT-ET-RESTE-A-FAIRE-2026-05-31.md. Puis aide-moi à concevoir la
fonctionnalité de paiement 99-coin entre membres dans le flux de réservation
générique (section 4.1 du document état), en respectant la doctrine de greffe, la
règle local-strict, le vocabulaire fixe, et la décision d'architecture des
paiements de la section 3. Ne propose aucune migration lourde du modèle ; reste
additif. »

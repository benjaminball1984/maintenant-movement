# Contenus à arbitrer par Lilou/Ben

> Index unique des contenus éditoriaux, données factuelles et arbitrages
> politiques que la plateforme attend pour passer du squelette technique
> (livré) à une publication réelle. Tant que ce fichier n'est pas
> entièrement coché, le site reste en preview interne, pas en production
> publique.

## Mode d'emploi

- En **dev** (`npm run dev`) : les pages concernées affichent le détail
  technique de ce qu'elles attendent (cf. `<PageEditorialeStub>`).
- En **prod** sans flag : ces pages affichent une bannière neutre
  « Cette page sera publiée prochainement ».
- En **prod** avec `NEXT_PUBLIC_AFFICHER_PLACEHOLDERS=true` : le détail
  technique redevient visible (utile pour une preview interne).

Pour fournir un contenu, Lilou/Ben peut soit modifier directement le
`<PageEditorialeStub>` correspondant pour remplacer `placeholder` par le
contenu rédigé, soit transmettre le texte à un·e dev qui s'en occupe.

---

## 1. Pages éditoriales publiques (chantier 2.2)

### 1.1 `/comprendre/doctrine`
- **Fichier** : `app/(public)/comprendre/doctrine/page.tsx`
- **Attendu** : explication des grands principes (empouvoirement vs
  captation de pouvoir, mouvement de service au service de nous-mêmes,
  équivalence, moindre violence, légitimité d'expression par ancrage
  territorial réel, subsidiarité par accord mutuel, populisme progressiste
  inclusif démocratique émancipateur).
- **Citations à insérer en mise en valeur** :
  - « Ce qui se fait pour les gens sans les gens se fait contre les gens. »
  - « Chanter aujourd'hui, pas seulement promettre demain. »
- **Ton** : sobre, éditorial, en accord avec `docs/specs/03_VOCABULAIRE.md`.

### 1.2 `/comprendre/faq`
- **Fichier** : `app/(public)/comprendre/faq/page.tsx`
- **Attendu** : questions fréquentes structurées en thématiques :
  adhésion ; fonctionnement collégial ; monnaie 99-coin ; commune libre ;
  RGPD et données ; modération.
- À enrichir au fil des questions remontées par les premier·ères
  utilisateur·ices.

### 1.3 `/comprendre/monnaie`
- **Fichier** : `app/(public)/comprendre/monnaie/page.tsx`
- **Attendu** : explication de la monnaie 99-coin (T99CP, The 99 Coin
  Project), équivalence 1 T99CP = 1 € = 1 minute, usages (adhésion
  12 99-coin, dons cagnottes, SEL, RBU 30 99-coin/mois), comment se créer
  un wallet certifié, adresse de contrat Polygon.
- Co-rédaction recommandée avec l'équipe T99CP.

### 1.4 `/comprendre/ressources`
- **Fichier** : `app/(public)/comprendre/ressources/page.tsx`
- **Attendu** : liens vers la doctrine complète, textes de référence,
  outils pour s'organiser (modèles de PV, kits porte-à-porte, charte
  modération), bibliographie politique.

### 1.5 `/a-propos`
- **Fichier** : `app/(public)/a-propos/page.tsx`
- **Attendu** : présentation du mouvement Maintenant!, histoire, doctrine
  générale, premiers signataires, structuration (cosec gé en collégial),
  liens vers `/comprendre/doctrine` et la page Commune libre quand elle
  existera.
- **Citation à mettre en avant** :
  - « Le but de la plateforme n'est pas que la plateforme fonctionne. »

### 1.6 `/contact`
- **Fichier** : `app/(public)/contact/page.tsx`
- **Attendu** : adresses email officielles (contact général, presse,
  adhésion, `dpd@...`), adresse postale, formulaire de contact avec
  Turnstile.
- **Préalable technique** : emails du domaine `maintenant-le-mouvement.org`
  actifs côté Brevo / OVH.

### 1.7 `/mentions-legales`
- **Fichier** : `app/(public)/mentions-legales/page.tsx`
- **Attendu** : éditeur (association Maintenant!), adresse postale,
  numéro RNA, directeur·rice de publication, hébergeur (Cloudflare Pages
  + Supabase Francfort), contact.

### 1.8 `/confidentialite`
- **Fichier** : `app/(public)/confidentialite/page.tsx`
- **Attendu** : politique de confidentialité v3 finalisée (session 7,
  mai 2026) avec adresse, RNA, nom et email DPD. Doctrine RGPD minimale
  légale : pas de cookie publicitaire, pas de traceur tiers, données en
  région UE (Supabase Francfort).
- **Mise à jour** : à tenir à jour à chaque changement substantiel
  (cf. `docs/specs/05_RGPD.md §9`).

---

## 2. Données factuelles d'association

À fournir une fois pour toutes, alimentent les pages ci-dessus, le
footer et la signature des emails sortants :

- [x] **Nom légal** : **« collectif Maintenant! »** (décision Lilou/Ben,
  2026-05-25). Maintenant! est pour l'instant un collectif, aucune association
  n'est encore déposée. Stocké dans `config/site.ts` (`SITE.entiteLegale`).
- [ ] **Adresse postale** du siège (en attente : pas d'association déposée).
- [ ] **Numéro RNA** : sans objet tant qu'aucune association n'est déposée.
- [ ] **Email de contact général** (typiquement `contact@...`).
- [ ] **Email DPD** (typiquement `dpd@...`) + **nom du·de la DPD bénévole**.
- [ ] **Email presse** (si dédié).
- [ ] **Email adhésion** (si dédié).
- [ ] **Premier·ères signataires publics** (liste à afficher sur `/a-propos`,
  avec accord explicite de chaque personne).

---

## 3. Données externes opérationnelles

### 3.1 Cartographie communes pré-créées (chantier 5.2)
- [ ] **CSV des 2100-2300 communes** au format :
  `slug,nom,code_insee,code_postal_principal,departement,region,latitude,longitude`.
- Import via : `npx tsx scripts/import-communes.ts <fichier.csv> --dry-run`
  puis `--confirm`.

### 3.2 Migration Base44 (chantier 10.1)
- [ ] 4 CSV extraits de l'admin Base44 :
  - `membres.csv` (946 adhérent·es)
  - `newsletter.csv` (~9000 abonné·es)
  - `petitions.csv` (pétitions à réécrire)
  - `signatures.csv` (~16000 signataires)
- Import via : `npx tsx scripts/migrer-base44.ts <dossier_csv> --dry-run`
  puis `--confirm`.
- **Préalable RGPD** : la politique de confidentialité v3 est publiée
  (point 1.8 ci-dessus). Cf. `docs/specs/05_RGPD.md §13`.

---

## 4. Clés et accès externes

À fournir lors du go-live (le code est prêt à les recevoir, aucun
changement applicatif requis) :

- [ ] **Supabase** : URL projet + anon key + service role key (région
  Francfort).
- [ ] **Brevo** : clé API + SMTP credentials + listes (Sympathisant·es,
  Adhérent·es, Donateur·ices).
- [ ] **Stripe** : clés live (`sk_live_...`, `pk_live_...`) + webhook
  secret + accès à Stripe Connect pour les porteur·euses de cagnottes.
- [ ] **LiveKit** : URL serveur + clés API.
- [ ] **Cloudflare Turnstile** : site key + secret key.
- [ ] **T99CP / Polygon mainnet** : ABI + clé de signature du compte
  Maintenant! + ratio frais validé.
- [ ] **Anthropic** : clé API pour les fonctions assistées (modération
  préliminaire, génération de récap mardi, etc.).
- [ ] **AzuraCast** : URL du flux Maintenant Médias.
- [ ] **Cloudflare Pages** : accès au compte (déploiement) + DNS du
  domaine `maintenant-le-mouvement.org`.

---

## 5. Arbitrages politiques (tranchés le 2026-05-25)

- [x] **Q5** : **ouvert à tou·tes les inscrit·es**. Aucune fonctionnalité n'est
  verrouillée par statut ; le statut sert à la reconnaissance et au droit de
  DÉCISION (voter dans Décider réservé aux adhérent·es). Donateur·ice = mêmes
  accès qu'adhérent·e.
- [x] **Q13** : **s'appuyer sur les notifications existantes, sans gamification**
  (récap mardi, newsletter vendredi, cloche, push). Pas de points/badges/
  classements. Rien de neuf à construire.
- [x] **Q14** : **3 compteurs publics** : nombre de membres (adhérent·es),
  nombre d'abonné·es (newsletter), nombre de signatures. Pas de chiffres
  financiers en public. Affichés sur la home et `/a-propos`.
- [x] **Affichage des membres d'une commune** : **visible entre membres**. Les
  membres connecté·es d'une même commune voient leurs co-membres (prénom +
  initiale), dans le respect des réglages de visibilité ; rien de nominatif en
  public (les pages publiques restent au compteur). RGPD : appartenance =
  donnée sensible.

---

## 6. Préalables techniques opérationnels (à programmer côté ops)

Une fois le code déployé sur Cloudflare Pages, les crons suivants doivent
être posés (Cloudflare Workers ou équivalent) :

- [ ] **SEL** : `crediterPrestationsEnAttente` toutes les heures.
- [ ] **Adhésion** : `envoyerRelancesAdhesion(14)` quotidien.
- [ ] **Marché** : expiration des annonces inactives 3 mois (quotidien).
- [ ] **Moments solidaires** : transition annonce → en_cours → terminé
  (horaire).
- [ ] **Récap mardi** + **Newsletter vendredi** : hebdomadaires.
- [ ] **Backup BDD** : `supabase db dump` quotidien avec rétention.

Cf. `docs/LANCEMENT.md` pour la procédure complète.

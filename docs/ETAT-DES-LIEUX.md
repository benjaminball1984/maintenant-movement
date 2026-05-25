# État des lieux du code — Maintenant! (V1)

> **But de ce document** : donner à une instance Claude (ou à toute personne)
> une vue **exhaustive et fidèle** du code existant, pour comprendre l'ensemble
> et proposer un **cahier des charges V2**. Rédigé le 2026-05-25. Source de
> vérité du code : le dépôt lui-même ; ce document en est le résumé navigable.

---

## 1. Résumé exécutif

Plateforme citoyenne **Maintenant!** : application web Next.js (App Router),
TypeScript strict, Supabase (Postgres + Auth + Storage), rendu majoritairement
en Server Components avec Server Actions pour les mutations. ~90 pages, 40
migrations SQL, ~45 tables, 27 fichiers de tests unitaires (300 tests) + 10
fichiers E2E Playwright.

**Doctrine de build (CLAUDE.md)** : code « scolaire » lisible, exhaustif (pas de
bouton mort), pas d'invention de fond politique/éditorial (placeholders sinon),
chaque service externe a un **adapter mock par défaut** pour tourner à 100 % en
local sans clé d'API.

**État global** : squelette fonctionnel complet des phases 0 à 13. Le réseau
social (7.5) vient d'être construit. Restent en stub honnête : Décider (7.6,
visio), Maintenant Médias journal-affiche (7.3), et le player Radio (7.2) est
minimal. 8 pages éditoriales (2.2) attendent leurs textes.

---

## 2. Stack technique

| Brique | Choix | État |
|---|---|---|
| Framework | Next.js 14 (App Router) | en place |
| Langage | TypeScript strict (pas de `any`) | en place |
| BDD / Auth / Storage | Supabase (Postgres, RLS partout) | distant Francfort, actif |
| Styles | Tailwind CSS + CSS variables (design tokens) | en place |
| UI | composants maison `components/ui/*` (pas de shadcn finalement) | en place |
| Validation | Zod + react-hook-form | en place |
| Lint/format | Biome | en place (hook lefthook pre-commit) |
| Tests | Vitest (unitaires) + Playwright (E2E) | en place |
| Cartes | MapLibre GL JS | en place |
| Email | Brevo (adapter) | **mock par défaut** |
| Paiements | Stripe Checkout + Connect (adapter) | **mock par défaut** |
| Visio | LiveKit (adapter) | **mock par défaut**, UI stub |
| 99-coin | Polygon contract (adapter) | **mock par défaut** |
| Anti-bot | Cloudflare Turnstile (adapter) | **mock par défaut** |
| Hébergement cible | Cloudflare Pages (`@cloudflare/next-on-pages`) | pas encore branché |

Runtime : Node >= 20. Pas de Vercel (décision). `next.config.mjs` pose une CSP
stricte + headers de sécurité.

---

## 3. Architecture & conventions

- **Server Components par défaut** ; `'use client'` seulement si nécessaire
  (état, événements DOM, hooks).
- **Server Actions** pour les mutations (`app/.../actions.ts`), pattern de retour
  uniforme `ResultatAction = { ok: true; ... } | { ok: false; message }`.
- **Couche de requêtes** par domaine dans `lib/<domaine>/requetes.ts` : les
  pages ne tapent pas Supabase directement.
- **RLS Supabase activée sur toutes les tables** ; helpers SQL SECURITY DEFINER
  (`est_admin_general`, `est_moderateurice(onglet)`, `est_membre_commune`,
  `personne_affichage`, etc.) pour les agrégats/visibilité.
- **Nommage** : métier en français (`creerCommuneLibre`, `signature_petition`),
  technique en anglais (`created_at`, `getServerSession`).
- **Pas de tirets cadratins** dans les textes/commentaires (marqueur IA).
  Inclusivité variée (épicène, point médian, doublets).
- **Adapter pattern** systématique pour les API externes (`lib/<service>/` avec
  `types.ts` + `MockXxx` + `XxxReel` + `index.ts` factory selon variable d'env).

Dossiers `lib/` : adhesion, admin, agenda, auth, autres-moyens, cagnottes,
campagnes, carte, communes, email, entraide, home, livekit, marche, media,
mobilisations, moments, notifications, payments, petitions, profil, reseau, sel,
sondages, supabase, t99cp, turnstile, validations.

---

## 4. Modèle de données (≈45 tables, 40 migrations)

Toutes les migrations sont dans `supabase/migrations/` (horodatées). RLS sur
chaque table. Tables groupées par domaine :

- **Identité / orga** : `personne`, `commune`, `appartenance_commune`,
  `federation` (+`appartenance_federation`), `confederation`
  (+`appartenance_confederation`), `gt_thematique` (+`appartenance_gt`),
  `droit_admin` (6 niveaux : national, admin, moderation, tresorerie, animation,
  dpd), `journal_admin` (audit RGPD).
- **Mobiliser** : `petition`, `signature_petition`, `mobilisation`,
  `participation_mobilisation`, `campagne`, `module_campagne`, `cagnotte`,
  `don`.
- **S'entraider** : `offre_entraide` (hébergement/transport/prêt/fruits),
  `service_sel`, `prestation_sel`, `produit_marche`, `boutique_marche`,
  `minimarche_solidaire`, `notation_marche`.
- **Agir** : `adhesion`, `mandat_confederal`, `moment_solidaire`,
  `organisation_partenaire`.
- **S'informer** : `media`, `sondage` (+`reponse_sondage`), et **réseau social**
  (voir §6).
- **Notifications** : `notification`, `preference_notification` (5 canaux).
- **Plateforme de données (phase 13)** : `commune_reference` (35 011 communes +
  arrondissements), `correspondance_cp_insee`, fonction `compteurs_commune`,
  `profil_unifie` (identité durable, numéro public **M + 7 lettres**).
- **Réseau social (7.5)** : `relation_reseau`, `post_reseau`,
  `commentaire_reseau`, `reaction_reseau`, `message_reseau`.

**Profil unifié (clé V2)** : chaque signataire (même importé sans compte) a un
`profil_unifie` avec un numéro stable `M+7` indépendant de l'email. À la
vérification de l'email, le compte récupère ses signatures (rattachement par
email). Le numéro sert aussi de **handle public** du profil réseau.

---

## 5. Espaces fonctionnels & état (par route)

Légende : ✅ livré fonctionnel · 🟡 stub honnête · 🟧 bloqué (contenu/clé externe).

### Accueil / Comprendre / utilitaires
- ✅ `/` (home : unes, compteurs publics membres/abonné·es/signatures, modale signature)
- 🟧 `/comprendre/{doctrine,faq,monnaie,ressources}`, `/a-propos`,
  `/mentions-legales`, `/confidentialite`, `/contact` : pages éditoriales en
  attente de textes (chantier 2.2), bannière neutre en prod.
- ✅ `/design-system`

### Mobiliser
- ✅ Pétitions (`/mobiliser/petitions/*`) : création, modération a priori,
  signature anonyme/connectée, compteur stretch, édition équipe (`/admin/petitions`).
- ✅ Mobilisations, Campagnes, Cagnottes (Stripe **mock**, dons €/T99CP mock).

### S'entraider
- ✅ Hébergement, Transport, Qui prête tout, Fruits de la terre (`offre_entraide`).
- ✅ SEL (services + prestations + crédit 99-coin mock).
- ✅ Marché solidaire (produits, boutiques, minimarchés, notation 5 étoiles).

### Agir
- ✅ Adhérer (gratuit / 12 € / 12 T99CP, paiements mock).
- ✅ Communes libres + Fédérations + Confédérations + Assemblée (tirage au sort).
  Doctrine §7B **révisée** : coquilles vides désormais matérialisées pour TOUT
  le référentiel (35 011 communes pré-créées sur le distant).
- ✅ Moments solidaires (8 types, génération RDV, tracker Tupperwares).
- ✅ Autres moyens d'agir.
- ✅ Carte référentiel `/communes` (clusterisée) + fiche `/communes/[code_insee]`.

### S'informer
- ✅ Média Maintenant (`/s-informer/media`) : éditos/articles/etc.
- 🟡 Radio (`/s-informer/radio`) : player AzuraCast minimal.
- 🟡 Maintenant Médias journal-affiche (7.3) : stub.
- ✅ Sondages (classique + pondéré).
- ✅ **Réseau social (7.5)** : voir §6.
- 🟡 Décider (`/s-informer/decider`, 7.6) : **stub** (visio LiveKit + modes de
  décision non implémentés).

### Espace membre
- ✅ `/profil/*` : dashboard, informations (+ numéro unifié), confidentialité
  (visibilité par champ, export ZIP, suppression différée 30 j, 2FA),
  contributions (pétitions signées + recontact), communes, notifications, wallet.

### Admin
- ✅ `/admin` (stats), `/admin/moderation/*` (11 onglets dont `reseau`),
  `/admin/national/*` (super admin, gestion des droits), `/admin/petitions` (édition).

### Transverses
- ✅ `/carte` (carte unifiée MapLibre), `/agenda` (agrégé).
- ✅ API : `/api/communes/geojson` (référentiel pour la carte).

---

## 6. Réseau social (chantier 7.5) — le plus récent

Migration `20260525140000_reseau_social.sql`. Voir
`docs/manifests/phase-13-chantier-7.5-reseau-social.md`.

- **Relations** : `relation_reseau` (suivi one-way ; **ami·e = suivi mutuel**
  calculé, pas de demande/acceptation en v1).
- **Flux** `/s-informer/reseau` : tri **strictement transparent** (mes posts →
  suivi·es → reste, puis récence), sans pub ni pondération cachée, encart
  financement, composer (Turnstile).
- **Profil** `/s-informer/reseau/[numero]` (handle = numéro M+7), identité
  masquée selon `preferences_visibilite` via `personne_affichage`.
- **Messagerie interne** `/s-informer/reseau/messages` (+ modal réutilisable +
  notification cloche `dm`).
- **Modération a posteriori** `/admin/moderation/reseau`.
- **Décision A** (Lilou/Ben) intégrée : sur la page commune, liste des
  co-membres **visible entre membres seulement**, **nom+prénom complets**, nom
  **cliquable vers le profil réseau** + **bouton message**.
- **Limites v1** : le flux n'agrège pas encore « contenus du site » + « entraide
  5 % » (tiers 3-4 de la spec §4E) ; pas de messagerie temps réel ; pas de
  signalement utilisateur (modération via console).

---

## 7. Services externes (adapters mock/réel)

Tous pilotés par variable d'env (cf. `.env.example`), **mock par défaut** :

| Service | Variable | Mock | Réel |
|---|---|---|---|
| Email | `EMAIL_PROVIDER` | log/fichier | Brevo |
| Paiements | `PAYMENT_PROVIDER` | succès simulé | Stripe (test/live) |
| Visio | `LIVEKIT_PROVIDER` | UI sans WebRTC | LiveKit |
| 99-coin | `T99CP_NETWORK` | tx simulées | Polygon (mumbai/mainnet) |
| Anti-bot | `TURNSTILE_PROVIDER` | token mock | Cloudflare Turnstile |

Conséquence : `npm run dev` fonctionne sans aucune clé externe. Brancher = changer
la variable + fournir les clés.

---

## 8. État du déploiement

- **Local** : `npm run dev` → localhost:3000 → Supabase distant. Vérifié (smoke
  test 2026-05-25 : routes réseau 200/307, communes 200).
- **Supabase distant (Francfort)** : schéma appliqué (40 migrations). Données
  réelles présentes : 35 011 communes pré-créées, 17 746 signatures importées,
  15 737 profils unifiés. Migrations 038/039 appliquées (historique à
  régulariser, voir `supabase/README.md`).
- **GitHub** : **tout fusionné dans `main`** le 2026-05-25 (fast-forward depuis
  `feature/phase-13-integration`, tip `a778861`). `main` contient désormais
  l'ensemble (phases 0 à 13 + réseau social). Historique linéaire.

---

## 9. Tests & qualité

- **Unitaires** : 300 tests (Vitest) verts, surtout sur les schémas de
  validation Zod et la logique métier (frais, stretch, dates, numéro unifié,
  réseau).
- **E2E** : 10 fichiers Playwright (auth, home, communes, cagnottes, entraide,
  adherer, carte/agenda, design-system, crawl des liens morts…). Nécessitent
  `npx playwright install` (navigateurs) + un état distant.
- **typecheck** (tsc) et **lint** (Biome) verts. Hook pre-commit lefthook :
  biome + typecheck + convention de message.
- **Manquant** : Lighthouse mobile + audit WCAG complet (à faire après un
  staging Cloudflare).

---

## 10. Décisions arbitrées récemment (2026-05-25)

- **Membres de commune** : visibles **entre membres** (nom+prénom, respect
  visibilité), pas public.
- **Q5 accès par statut** : tout ouvert aux inscrit·es ; statut = reconnaissance
  + droit de vote (Décider).
- **Q13 engagement** : s'appuyer sur les notifications existantes, pas de
  gamification.
- **Q14 compteurs publics** : membres + abonné·es + signatures (pas de finances).
- **Entité légale** : « collectif Maintenant! » (pas d'association déposée → pas
  de RNA). Dans `config/site.ts` (`SITE.entiteLegale`).
- **Doctrine §7B** : coquilles vides autorisées pour tout le référentiel.

---

## 11. Pistes & questions ouvertes pour le cahier des charges V2

Points où une V2 a le plus de valeur (à arbitrer/concevoir) :

1. **Décider (7.6)** : implémenter la visio LiveKit réelle + les 3 modes
   (consensus, levée d'objections, jugement majoritaire) + PV automatiques.
2. **Réseau social v2** : agréger « contenus du site » + « entraide 5 % » dans
   le flux ; messagerie temps réel ; signalement utilisateur (table
   `moderation_signal`) ; fil d'actualité par commune/GT.
3. **Branchement des API réelles** : Brevo (emails + newsletter), Stripe
   (Checkout + Connect KYC), T99CP (Polygon), Turnstile, AzuraCast (radio).
4. **Pages éditoriales (2.2)** : rédaction des 8 textes (doctrine, FAQ, monnaie,
   ressources, à propos, contact, mentions, confidentialité).
5. **Migration Base44 (10.1)** : import des 946 membres + 9k newsletter (les
   16k signataires sont déjà importés).
6. **Maintenant Médias journal-affiche (7.3)** : 30 modèles + génération PDF.
7. **Performance & accessibilité** : Lighthouse mobile ≥ 90, WCAG 2.1 AA.
8. **Ops** : crons (SEL, relances adhésion, expiration annonces/moments, récap
   mardi, newsletter vendredi), backups, monitoring Sentry.
9. **Déploiement Cloudflare Pages** + DNS `maintenant-le-mouvement.org`.

---

## 12. Pointeurs

- Specs figées : `docs/specs/` (01_ARCHITECTURE, 02_STACK, 03_VOCABULAIRE,
  04_DESIGN-TOKENS, 05_RGPD, 06_DOCTRINES, 08_PLAN_CHANTIERS).
- Mémoire de build : `CLAUDE.md` (§11 = état courant).
- Manifests de fin de chantier : `docs/manifests/`.
- Contenus/arbitrages en attente : `docs/CONTENUS-A-ARBITRER.md`.
- Décisions techniques : `docs/ARCHITECTURE-decisions.md`.
- Lancement / ops : `docs/LANCEMENT.md`.
- Migrations + procédure distant : `supabase/README.md`.

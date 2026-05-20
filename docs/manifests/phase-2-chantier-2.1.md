# Manifest : Phase 2, Chantier 2.1 — Page d'accueil définitive

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-2-chantier-2.1-page-accueil`
**Commit final** : `fd03f5e`
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

- [x] **Layout public** (`app/(public)/layout.tsx`) avec `<Header>` sticky + `<Footer>`, qui enveloppe désormais toutes les routes publiques.
- [x] **`<Header>`** (`components/layout/Header.tsx`) Server Component auth-aware :
  - Logo Maintenant! à gauche (lien vers `/`).
  - Nav des 5 espaces au centre desktop, scrollable horizontalement sur mobile, libellés depuis `config/espaces.ts`.
  - À droite : Si déconnecté·e, liens « Se connecter » + bouton gradient « Créer un compte ». Si connecté·e, `<HeaderProfilMenu>` (Client Component avec dropdown : email, lien profil, déconnexion, fermeture sur clic extérieur + Échap).
- [x] **`<Footer>`** : grille 3 colonnes (identité du mouvement + nav éditoriale + Réseaux placeholder), bandeau RGPD/copyright en bas. Lien vers les 4 pages éditoriales (`/a-propos`, `/mentions-legales`, `/confidentialite`, `/contact`) : aucune n'est morte (cf. stubs).
- [x] **Page d'accueil définitive** (`app/(public)/page.tsx`) qui assemble :
  - `<BlocTitre>` : surtitre / titre « Maintenant! » avec gradient signature appliqué via `bg-clip-text` / sous-titre, textes exacts depuis spec §3.
  - 4 unes empilées (`<UnePetition>`, `<UneArticle>`, `<UneMobilisation>`, `<UneCagnotte>`) basées sur un composant générique `<UneSection>`. Chaque carte gère son état vide proprement avec un lien « voir tous » vers l'index de l'espace correspondant.
  - `<PreFooterCompteurs>` : 3 cartes Newsletter / Membres / Signataires en gros chiffre + note de bas de section précisant que les compteurs newsletter et signataires se rempliront aux chantiers 8.1 et 3.1 (et que les ~10 000 personnes Base44 seront importées au chantier 10.1).
- [x] **Helper `getCompteursHome`** (`lib/queries/home.ts`) : `count(personne where statut='actif')` pour les membres. Newsletter et signataires à 0 (chantiers 8.1 et 3.1). Tolérance d'erreur : retourne `{0,0,0}` si Supabase indisponible plutôt que de crasher la home.
- [x] **`<ModaleSignaturePetition>`** (`components/modales/ModaleSignaturePetition.tsx`) : composant réutilisable basé sur `<dialog>` HTML5 natif (cf. ADR-009). Formulaire complet exigé par la spec §3 (nom, prénom, email, code postal, téléphone optionnel, Turnstile, cases newsletter + autorisation contact créateurice). Server Action stub `signerPetition` qui valide tout (Zod + Turnstile) mais n'écrit pas en BDD : le branchement réel arrive au chantier 3.1.
- [x] **Schéma Zod `signerPetitionSchema`** (`lib/validations/petition.ts`) : UUID v4 de la pétition + identité + cases + token.
- [x] **9 pages stub** pour les liens du header et du footer (aucun lien mort) :
  - **5 espaces racines** : `/s-informer`, `/mobiliser`, `/s-entraider`, `/agir`, `/comprendre`. Composant générique `<PageEspaceStub>` qui liste les sous-espaces avec leur chantier de référence (sans lien, parce que les sous-espaces ne sont pas tous prêts).
  - **`/comprendre`** (cas particulier) lie aux 4 sous-pages (qui existent en stub éditorial).
  - **4 pages éditoriales** : `/a-propos`, `/mentions-legales`, `/confidentialite`, `/contact`. Composant générique `<PageEditorialeStub>` avec placeholder `[TEXTE À FAIRE — …]` visible et listé en MANIFEST « Contenus à arbitrer ».
  - **4 sous-pages comprendre** : `/comprendre/{monnaie,doctrine,faq,ressources}` (idem placeholders).
  - **4 sous-espaces** liés depuis les unes : `/mobiliser/petitions`, `/mobiliser/mobilisations`, `/mobiliser/cagnottes`, `/s-informer/media`. Composant générique `<PageSousEspaceStub>` qui pointe vers leur chantier futur.
- [x] **Page 404** (`app/not-found.tsx`) : sobre, message clair, lien retour `/`.
- [x] **Tests unitaires** : `tests/unit/validations/petition.test.ts` (7 tests Zod). Total **69 tests unit verts** (+7 par rapport à 1.3).
- [x] **Tests E2E** : `tests/e2e/home.spec.ts` réécrit pour la nouvelle structure (7 tests : titre, 4 unes, compteurs, header nav, footer nav, navigation espaces, navigation footer, 404). Total **29 tests E2E verts** (+6 par rapport à 1.3).
- [x] **ADR-009** (`<dialog>` HTML5 plutôt que Radix) ajoutée à `docs/ARCHITECTURE-decisions.md`.
- [x] **Build production vert** : 25 routes (14 routes 1.3 + nouvelles : 4 éditoriales + 4 comprendre + 5 espaces racines + 4 sous-espaces stubs + 404). Middleware 82.5 kB.

## Livré partiellement

- [ ] **`<ModaleSignaturePetition>` posée mais non déclenchée sur la home** : la une pétition est en état vide (pas de pétition active en 2.1). Le composant est prêt et testé en isolation par Playwright (via le showcase, à ajouter en 0.2bis si on veut le voir vivre avant 3.1).
- [ ] **Compteur Membres** : compte réel via Supabase mais retourne 0 tant que personne ne s'est inscrit·e. Affichage propre.

## Non livré (et pourquoi)

- [ ] **4 unes avec contenu réel** : nécessite les tables `petition` (3.1), `article` (7.1), `mobilisation` (3.2), `cagnotte` (3.3). Les 4 cartes affichent un état vide honnête + lien « voir tous ». La logique de sélection « plus récente », « plus signée », etc. arrive avec chaque chantier de phase 3 et 7.
- [ ] **Compteurs Newsletter et Signataires** : à brancher aux chantiers 8.1 et 3.1.
- [ ] **Pages stub à finaliser éditorialement (chantier 2.2)** : `/a-propos`, `/mentions-legales`, `/confidentialite`, `/contact`, `/comprendre/{monnaie,doctrine,faq,ressources}`. Posées en placeholder visible dès maintenant pour ne pas casser les liens du footer/header.
- [ ] **5 espaces racines avec leur design propre** : pour 2.1 ils sont en stub liste de sous-espaces. Chaque espace aura sa vraie page racine au chantier qui pose le premier sous-espace (ex : `/mobiliser` sera enrichi au chantier 3.1 ou 3.2).
- [ ] **Sous-espaces eux-mêmes** : `/mobiliser/petitions`, `/mobiliser/mobilisations`, `/mobiliser/cagnottes`, `/s-informer/media` sont en stub minimaliste. Branchement réel à leur chantier (3.x ou 7.1).
- [ ] **Migration Base44 (~10 000 personnes)** : chantier 10.1.
- [ ] **Nav mobile avancée** : pour 2.1, simple barre scrollable. Une vraie navigation hamburger viendra si nécessaire en chantier de polish (phase 11).
- [ ] **Modale d'auth depuis le header** : la spec ne l'impose pas, on garde le redirect vers `/connexion` qui est la convention courante. À ré-évaluer en phase 11 si UX demande mieux.

## Contenus à arbitrer

Tous listés ici, à rédiger au chantier 2.2 par Lilou/Ben :

- [ ] `app/(public)/a-propos/page.tsx` : présentation du mouvement, doctrine générale, premiers signataires, structuration cosec gé, citation « Le but de la plateforme n'est pas que la plateforme fonctionne. »
- [ ] `app/(public)/mentions-legales/page.tsx` : éditeur, adresse, RNA, directeur·rice de publication, hébergeur.
- [ ] `app/(public)/confidentialite/page.tsx` : politique de confidentialité v3 finalisée (adresse, RNA, DPD désigné·e).
- [ ] `app/(public)/contact/page.tsx` : emails officiels, adresse postale, formulaire de contact.
- [ ] `app/(public)/comprendre/monnaie/page.tsx` : explication 99-coin (T99CP), équivalence, usages.
- [ ] `app/(public)/comprendre/doctrine/page.tsx` : principes (empouvoirement vs captation, équivalence, moindre violence, etc.) + 2 citations.
- [ ] `app/(public)/comprendre/faq/page.tsx` : questions fréquentes par thématiques.
- [ ] `app/(public)/comprendre/ressources/page.tsx` : doctrine, textes, outils, bibliographie.

## Décisions techniques prises (ADR à archiver)

- **ADR-009** : `<dialog>` HTML5 natif pour la modale signature pétition (et probablement toutes les futures modales). Voir `docs/ARCHITECTURE-decisions.md`.

## Incertitudes techniques résolues avec Lilou/Ben

- **Compteurs réels vs hérités Base44** : on affiche 0 en 2.1 (et le code lit `count(personne)`), avec une note précisant que les ~10 000 personnes Base44 arriveront au chantier 10.1. Pas de tricherie sur le nombre.
- **Liens « voir tous » dans les unes** : on a créé 4 stubs minimaux (`/mobiliser/petitions`, etc.) pour ne pas faire de lien mort, tout en signalant chantier par chantier que la vraie page arrivera plus tard.

## Tests

- **Unitaires (Vitest)** : 6 fichiers, **69 tests verts** (+7 par rapport à 1.3).
- **E2E (Playwright, chromium)** : 6 fichiers, **29 tests verts** (+6 par rapport à 1.3) : home (8 dont 404) + design-system (3) + crawl (1) + auth (7) + profil (10).
- **Lint (Biome)** : 0 erreur sur 144 fichiers.
- **Typecheck (tsc strict)** : 0 erreur.
- **Build (`next build`)** : OK. **25 routes** au total : 9 statiques (`/`, `/_not-found`, `/design-system`, `/inscription`, `/verifier-email`, `/profil`, et 3 pages stubs prerendered) + 16 dynamiques (toutes les routes auth-aware ou Supabase-dépendantes). Middleware 82.5 kB.
- **Lighthouse** : à mesurer maintenant que la home a sa vraie structure. Tester aussi en mode dark (toggle dans le profil). Non exécuté dans cette session ; à reporter en phase 11.1.

## Notes pour les chantiers suivants

- **Pattern stub** : trois composants génériques (`<PageEspaceStub>`, `<PageEditorialeStub>`, `<PageSousEspaceStub>`) sont posés. Tout chantier futur qui veut « réserver » une route sans avoir le contenu peut les réutiliser. Ça permet de garder le crawl test vert dès qu'on lie depuis une page existante.
- **`<UneSection>` réutilisable** : la une est conçue pour recevoir un objet d'entité plus tard. Quand 3.1 livre la table `petition`, il suffira de réécrire `<UnePetition>` pour qu'elle fasse `getPetitionsActives()` (à brancher avec Supabase) et passe les données réelles à `<UneSection>`.
- **`<ModaleSignaturePetition>` réutilisable** : déjà prête à être déclenchée n'importe où dès qu'il y a une vraie pétition (depuis `<UnePetition>` ou depuis une page `/mobiliser/petitions/[slug]`).
- **`<dialog>` HTML5 pour toutes les futures modales** (auth modale, adhésion 3 chemins, etc.) sauf cas spécifique justifié par ADR. Pattern documenté dans `ModaleSignaturePetition.tsx`.
- **Header `sticky top-0`** : posé. Si des sous-pages futures ont besoin d'un header non-sticky, on conditionnera via une variante de layout.
- **Footer minimaliste** : les Réseaux sont un placeholder texte. À enrichir quand les comptes officiels Mastodon (etc.) seront créés.
- **Préalables externes** : inchangés. Le seul point bloquant qui reste pour avancer concrètement est l'application des migrations 1.1 sur Supabase (`supabase db push`) pour que les Server Actions qui touchent la BDD fonctionnent (inscription, profil, etc.) en flux complet.

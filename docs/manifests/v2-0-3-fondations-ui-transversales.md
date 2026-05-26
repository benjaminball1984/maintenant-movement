# Manifest — V2 Vague 0, Chantier V2.0.3 : fondations UI transversales (ET1-ET4)

**Date de fin** : 2026-05-26 (nuit)
**Branche** : `feature/v2-0-3-fondations-ui-transversales`
**Commit final** : (voir `git log -1 --format=%h` sur cette branche)
**Durée approximative** : 1 session
**Base** : `main` (tip `1862e8c`, V2.0.2)

---

## Livré et fonctionnel

### ET4 — Variant `primary` du `Button` en dégradé

- [x] `components/ui/Button.tsx` : ajout du variant **`primary`** qui porte les tokens `--grad` (violet → magenta → framboise) + `--shadow-brand`, dans les deux modes clair/sombre via les tokens. Variants `ghost`, `outline`, `link` inchangés : ils restent neutres (règle anti-saturation : le dégradé est le point fort, pas le fond sonore).
- [x] Variant `gradient` **préservé comme alias** de `primary` (même style, même classe) pour ne pas casser la documentation V1 ni d'éventuels usages externes. Pas de DROP (doctrine de greffe, interdit n°1).
- [x] Défaut du `<Button>` passé de `gradient` à `primary`. Aucun usage explicite de `variant="gradient"` dans le code (grep), donc impact d'API nul.
- [x] `app/design-system/page.tsx` : section « Boutons » mise à jour, titre passé en « Primary — CTA principal (dégradé signature) ».

### ET3 — Bouton bascule clair/sombre branché sur `personne.mode_theme`

- [x] **Composant `ThemeToggle` complété** (`components/ui/ThemeToggle.tsx`) : maintenant qu'on a écrit `localStorage`, on appelle aussi la Server Action `mettreAJourMaPreferenceTheme` en **fire-and-forget**. Pour la personne connectée, sa préférence est miroitée en BDD ; pour la déconnectée, rien ne se passe côté serveur (silencieux par design). Pas de blocage UX si offline ou pas de session.
- [x] **Server Action `mettreAJourMaPreferenceTheme`** (`app/actions/theme.ts`) : valide que le mode est dans `'auto' | 'light' | 'dark'`, vérifie la session via `getSession()`, met à jour `personne.mode_theme` en BDD. Retour `{ ok: boolean }` silencieux (pas de message d'erreur côté client, car appel fire-and-forget).
- [x] **Intégration dans le `Header`** (`components/layout/Header.tsx`) : `<ThemeToggle />` ajouté dans la barre de navigation principale, juste avant le menu profil/connexion. Visible en un geste sur toutes les pages publiques et membre.
- [x] Colonne `personne.mode_theme` déjà présente depuis la migration `20260520120002_personne.sql` (chantier 1.1, contrainte CHECK `auto | light | dark`). **Aucune migration créée**.

### ET2 — Composant `TeleverseurImage` + adapter Image Storage

- [x] **Adapter Image Storage** (`lib/storage/`) avec pattern cohérent vs les autres services externes :
  - `types.ts` : interface `ImageStorageService`, types `RoleImage` (`couverture | vignette | icone`), constantes `MIME_AUTORISES` (JPEG/PNG/WebP) et `TAILLE_MAX_OCTETS` (5 Mo).
  - `MockImageStorage.ts` : convertit en data URL base64, fonctionne sans aucune dépendance externe (idéal en dev et en tests).
  - `SupabaseImageStorage.ts` : pousse vers le bucket `media` de Supabase Storage (provisionné par la migration de ce chantier).
  - `index.ts` : factory qui choisit selon `IMAGE_STORAGE_PROVIDER`.
- [x] **Variable d'env `IMAGE_STORAGE_PROVIDER=mock`** ajoutée à `.env.example`. Valeurs : `mock` (défaut) ou `supabase`. Le site fonctionne 100 % en local sans clé Supabase Storage.
- [x] **Migration SQL `supabase/migrations/20260526220000_storage_media_bucket.sql`** : crée le bucket public `media` (taille max 5 Mo, MIME JPEG/PNG/WebP) + 4 policies RLS (lecture publique, insert authentifié, update/delete par le propriétaire). **À appliquer manuellement avec `supabase db push` ou `scripts/appliquer-sql-distant.ts`** : pas appliquée au distant cette nuit (consigne « pas de touche au distant Supabase »).
- [x] **Composant `TeleverseurImage`** (`components/ui/TeleverseurImage.tsx`), Client Component unique réutilisable :
  - Props : `role`, `valeurInitiale`, `prefixeChemin`, `onChange`, `libelle`, `name`, `className`. Conçu pour s'intégrer à un formulaire HTML standard (via `name`) ou via callback (`onChange`).
  - Validation MIME et taille côté client (UX feedback instantané), puis re-validation côté serveur dans la Server Action.
  - Aperçu de l'image, bouton de remplacement, bouton de suppression (qui retourne à l'image par défaut).
  - Indicateur de chargement, gestion d'erreur affichée sous le bouton.
  - **Pas de champ URL** : exclu par principe (ET2). Bouton d'upload uniquement.
- [x] **Server Action `televerserImage`** (`app/actions/storage.ts`) : authentification requise, validation MIME + taille (deuxième ligne de défense), délégation à l'adapter. Retour `ResultatTeleversement` discriminé.
- [x] Export du composant dans `components/ui/index.ts`.

### ET1 — Bibliothèque d'images par défaut par type d'objet

- [x] **Matrice `lib/images-defaut.ts`** : type union `TypeObjet` (24 types), constante `TYPES_OBJETS` itérable, `IMAGES_DEFAUT: Record<TypeObjet, string>` qui mappe vers `/defaults/*.svg`. Helper `imageDefautPour(type)` qui retombe sur `generique` pour un type inconnu.
- [x] **Helper unifié `lib/images.ts`** : `getImageObjet(objet)` qui applique la règle d'or « image téléversée gagne sinon image par défaut sinon générique ». Type `ObjetAvecImage` documenté pour les appelants.
- [x] **15 placeholders SVG** dans `public/defaults/` (un par type principal, avec partage parmi types similaires) : `petition`, `mobilisation`, `campagne`, `cagnotte`, `moment-solidaire`, `offre-marche`, `commune`, `gt-thematique`, `article`, `sondage`, `service-sel`, `offre-entraide`, `organisation`, `profil`, `generique`. Format 1200×675 (ratio Open Graph) ou 800×800 pour le profil. **Ces SVG sont explicitement marqués « Image par défaut · à remplacer par une vraie image curée »** — ce sont des placeholders honnêtes en attendant les images réelles arbitrées par Lilou/Ben.

## Livré partiellement

- [ ] **Lecture initiale de `personne.mode_theme` depuis la BDD** au chargement de page (pour qu'un user change d'appareil et retrouve son thème). Reportée à un chantier ultérieur : nécessite de propager la préférence depuis `getSession()` jusqu'au layout, puis au script anti-FOUC via cookie ou prop. Hors périmètre V2.0.3 (fondation, pas finalisation). Le compromis actuel : à chaque ré-ouverture sur un nouvel appareil, la personne devra cliquer une fois.
- [ ] **Bucket `media` Supabase Storage en distant** : la migration est posée localement, **pas appliquée au distant** (consigne explicite). À appliquer au matin avec `supabase db push` quand le mode `IMAGE_STORAGE_PROVIDER=supabase` sera activé en prod.

## Non livré (et pourquoi)

- [ ] **Vraies images curées de la bibliothèque par défaut**. Les 15 placeholders SVG installés sont explicitement marqués comme « à remplacer » : ils donnent au système la forme et la mécanique, pas le contenu visuel définitif. Le contenu visuel relève d'une **décision politique et esthétique de Lilou/Ben**, donc consigné en « Contenus à arbitrer » ci-dessous.
- [ ] **Redimensionnement client des images pour les vignettes**. Le composant gère le téléversement tel quel sans réduire la résolution côté navigateur. Pour des vignettes, c'est un peu lourd (5 Mo possibles). À ajouter dans un chantier de durcissement (`createImageBitmap` + Canvas, ou bibliothèque Pica). Non bloquant.

## Contenus à arbitrer

Liste des images à fournir par Lilou/Ben pour remplacer les placeholders de la bibliothèque par défaut. Chaque image doit être **libre de droit**, **générique du type** (pas du contenu d'un objet particulier), au format JPEG ou WebP, ratio 1200×675 (16:9, Open Graph) sauf indication contraire.

- `public/defaults/petition.svg` → vraie image **« Pétition »** (foules, banderoles, dialogue civique).
- `public/defaults/mobilisation.svg` → vraie image **« Mobilisation »** (rassemblement, action coordonnée).
- `public/defaults/campagne.svg` → vraie image **« Campagne »** (mobilisation organisée dans la durée).
- `public/defaults/cagnotte.svg` → vraie image **« Cagnotte »** (entraide financière, sans représentation d'argent agressif).
- `public/defaults/moment-solidaire.svg` → vraie image **« Moment solidaire »** (rencontre conviviale, repas partagé).
- `public/defaults/offre-marche.svg` → vraie image **« Marché solidaire »** (étals, produits, échange).
- `public/defaults/commune.svg` → vraie image **« Commune »** (paysage rural ou urbain, place de village).
- `public/defaults/gt-thematique.svg` → vraie image **« Groupe de travail »** (réunion, idéation collective).
- `public/defaults/article.svg` → vraie image **« Article »** (presse, lecture, plume — pour Maintenant Médias).
- `public/defaults/sondage.svg` → vraie image **« Sondage »** (graphique participatif, urne).
- `public/defaults/service-sel.svg` → vraie image **« Service SEL »** (mains qui se passent un objet, échange non monétaire).
- `public/defaults/offre-entraide.svg` → vraie image **« Entraide »** (covoiturage, hébergement, prêt — image qui couvre les trois).
- `public/defaults/organisation.svg` → vraie image **« Organisation partenaire »** (logos, façade associative).
- `public/defaults/profil.svg` → **avatar par défaut** (carré 800×800, silhouette neutre — celui actuel est déjà acceptable).
- `public/defaults/generique.svg` → fallback ultime, identité **Maintenant!** assumée (l'actuel sur fond dégradé est cohérent avec l'identité visuelle).

Note : il est possible de **fusionner** certains types vers la même image (déjà fait pour `offre_transport`, `offre_hebergement`, `offre_pret` qui pointent tous vers `offre-entraide.svg`). Lilou/Ben peut ajuster la matrice dans `lib/images-defaut.ts` sans toucher au code applicatif.

## Décisions techniques prises (ADR à archiver)

Aucune décision structurante qui mérite une ADR formelle. Les choix techniques (data URL pour le mock, bucket public Supabase, MIME JPEG/PNG/WebP, taille max 5 Mo, pattern adapter cohérent vs les autres services externes) découlent directement des conventions déjà en place dans le repo et des spécifications V2 (ET1-ET2).

## Incertitudes techniques résolues avec Lilou/Ben

Aucune incertitude à arbitrer durant ce chantier (cycle V2 autonome de nuit).

## Écarts V1→V2 appliqués

Rubrique dédiée au cycle V2 (cf. CLAUDE.md §0.4).

- **Variant `primary` du Button** : la spec V1 (`docs/specs/04_DESIGN-TOKENS.md` §10 + code Button.tsx) nommait le CTA principal `gradient`. L'exigence ET4 du V2 le renomme `primary`. **Compromis appliqué** : `primary` devient le nom canonique (cohérent avec ET4 et la convention industrie shadcn/ui), `gradient` est **conservé comme alias** (même style) pour ne pas casser l'historique V1. Aucun usage explicite trouvé dans le code, donc l'impact d'API est nul. Le défaut du composant est passé de `gradient` à `primary`.

- **`ThemeToggle` synchronisé avec `personne.mode_theme`** : avant V2.0.3, le composant V1 (chantier 1.3, cf. tokens.css commentaires) ne persistait qu'en `localStorage`. L'exigence ET3 du V2 demande la synchro côté BDD. **Compromis appliqué** : on **ajoute** la synchro BDD en fire-and-forget par-dessus le localStorage existant. Le localStorage reste la source de vérité côté client (pour l'anti-FOUC). Aucune donnée n'a été touchée : `personne.mode_theme` existait déjà.

- **Aucun écart sur le grand modèle V2** (tronc `Objet`/`Espace`). Le `type_objet` introduit dans `lib/images-defaut.ts` est un **type TypeScript pur**, pas une colonne BDD. Il sert d'index de la matrice d'images par défaut. La convergence vers le tronc commun reste reportée (interdit n°3 de la doctrine de greffe).

## Tests

- **Unitaires (Vitest)** : `npm test` → **29 fichiers, 318 tests, tous verts**. Dont 18 nouveaux tests pour V2.0.3 :
  - `tests/unit/images/getImageObjet.test.ts` : 6 tests sur la règle de résolution `image_url → défaut du type → générique`, plus couverture exhaustive de `imageDefautPour`.
  - `tests/unit/storage/MockImageStorage.test.ts` : 12 tests sur le mock de Storage (acceptation JPEG/PNG/WebP, refus PDF/GIF/sans MIME, validation de taille max, idempotence de `supprimer`).
- **Build Next.js** : `npx next build` → succès, toutes les routes produites, pas de régression de bundle.
- **Lint (Biome)** : `npm run lint` → 415 fichiers (vs 404 avant ce chantier), 0 issue. `lint:fix` a auto-formaté les imports des 5 nouveaux fichiers.
- **Typecheck (tsc)** : `npm run typecheck` → 0 erreur.
- **E2E Playwright** : non lancés. Recommandé d'ajouter dans un chantier suivant : (1) test du toggle de thème dans le Header, (2) test de téléversement d'image avec un fichier valide / invalide / trop gros.
- **Lighthouse** : non applicable à un chantier de fondations sans page complète.

## Notes pour les chantiers suivants

- **Lecture initiale `mode_theme` depuis la BDD** (cf. « Livré partiellement »). Mécanique à mettre en place : (a) propager `session.personne?.mode_theme` depuis le `RootLayout` jusqu'au `ScriptInitTheme` via cookie HTTP-only ou via la prop `initialMode` ; (b) le script anti-FOUC lit le cookie avant le localStorage.
- **Redimensionnement client des vignettes** : avant push vers Supabase Storage, scaler à la taille cible côté navigateur pour économiser bande passante et stockage. Bibliothèque `pica` ou `createImageBitmap` natif.
- **Test de pression du bucket `media`** : à faire avant prod. Définir un quota par compte et un anti-spam si l'upload se généralise.
- **Lecture serveur de `mode_theme` pour les emails et les pages SSR** : si on génère des HTML statiques pour l'OG ou pour les emails, il faut décider si on choisit le mode clair (par défaut) ou si on respecte `mode_theme` côté serveur.
- **Application au matin** : `supabase db push` pour appliquer `20260526220000_storage_media_bucket.sql` si Lilou/Ben veut activer `IMAGE_STORAGE_PROVIDER=supabase` immédiatement. Sinon, le mock continue de fonctionner.
- **Refresh éventuel de la liste `TYPES_OBJETS`** : ajouter les types manquants au fil des nouveaux sous-espaces (cf. fiches `03-Sentraider/` du CDC V2). L'union TypeScript est la source de vérité ; tout ajout là-bas oblige à fournir un placeholder SVG correspondant.
- **CLÔTURE DE LA VAGUE 0** : V2.0.1 (préséance + CDC + coquilles), V2.0.2 (CSP), V2.0.3 (fondations UI) → la VAGUE 0 du `03-PLAN-IMPLEMENTATION.md` est désormais terminée. La VAGUE 1 (greffes additives : retrait wallet, Consentement, Droit atomique) peut commencer le matin.

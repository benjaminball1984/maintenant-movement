# Manifest : V2.6.92, fix images de brèves (chasseurs spécialisés) + carte annexe relookée

**Date de fin** : 2026-06-12
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare (suite de session)
**Commit final** : d48c0bb
**Durée approximative** : 1 session courte

## Contexte (constat Ben, captures à l'appui)

Trois brèves de la revue de presse s'affichaient au format annexe (petit logo,
3-4 lignes, grand blanc sous le texte) alors que leurs articles sources ont une
vraie image : 2 brèves Libération (Stellantis « made in Europe », Coupe du monde
Mexique) et 1 brève New York Times (nécrologie de David Hockney).

**Cause racine** : Libération et le New York Times bloquent la lecture de leurs
pages article par les robots (HTTP 403, protection anti-robot par empreinte
réseau, pas seulement par User-Agent). L'étape « og:image de la page » de la
chasse à l'image échouait donc toujours pour ces sites, et le flux RSS de
Libération ne contient aucune image (l'item Hockney du flux NYT n'en avait pas
non plus). Repli sur le logo : format annexe.

## Livré et fonctionnel

- [x] **Chasseurs d'image spécialisés par domaine** (`lib/import-breves/importer.ts`) :
  nouvelle étape de chasse entre l'og:image et le logo de secours.
  - `chercherImageSitemapArc` (Libération, Arc Publishing) : le sitemap public
    `/arc/outboundfeeds/sitemap/?outputType=xml` du site liste les articles
    récents AVEC leur image (`image:loc`). Accessible aux robots alors que les
    pages article ne le sont pas. Partie pure extraite et testée :
    `extraireImageLocSitemap` (décodage des entités XML `&amp;` inclus).
  - `chercherImageOembed` (New York Times) : l'endpoint oEmbed
    `https://www.nytimes.com/svc/oembed/json/?url=...` (prévu pour les
    intégrations automatiques) renvoie `thumbnail_url`. Le CDN d'images
    (`static01.nyt.com`) sert les fichiers aux robots sans restriction.
  - Table `CHASSEURS_PAR_HOTE` extensible : ajouter un site bloquant = une
    entrée dans la table, pas un refacto.
  - Ordre final de la chasse : 1. image du flux RSS ; 2. og:image de la page ;
    3. chasseur spécialisé du domaine ; 4. logo du média source (annexe).
- [x] **Carte annexe relookée** (`components/media/MosaiqueMedias.tsx`,
  demande Ben : « si pas d'image mettre le logo plus gros, et un peu plus de
  texte, ne surtout pas faire un truc moche ») : logo 96 px (au lieu de 64),
  fond surface + liseré, titre en `text-base`, extrait jusqu'à 9 lignes en
  `text-sm` (au lieu de 4 lignes en `text-xs`), lien « Lire la suite ↗ » comme
  sur les autres cartes. Plus de grand blanc sous les brèves sans vraie image.
- [x] **Réparation des 3 brèves en base de production**
  (`data-migration/reparer-images-breves.mjs`, hors git comme tout
  data-migration/) : rejoue la chasse (og:image puis chasseur spécialisé),
  copie l'image au bucket `media/breves/<slug>.jpg`, PATCH `vignette_url` +
  `importante=true`. Résultat : 3/3 réparées (photo usine Stellantis AFP,
  portrait Hockney NYT, Raul Jimenez Reuters), vérifiées servies en 200 sur
  le site déployé. Plus AUCUNE brève au format annexe en base au moment du
  déploiement (le format annexe reste le repli légitime des futurs imports).

## Non livré (et pourquoi)

- [ ] Rien : périmètre complet.

## Décisions techniques prises

- Les chasseurs spécialisés n'utilisent QUE des endpoints publics prévus pour
  les robots (sitemap, oEmbed) : pas de contournement de protection, pas de
  service tiers payant, pas de clé API (directive 0bis.2 respectée).
- Le script de réparation duplique volontairement la logique des chasseurs en
  JavaScript pur (`.mjs` autonome, conventions de `corriger-petitions.mjs`) :
  un script one-shot hors build ne peut pas importer le TypeScript du projet.

## Tests

- Unitaires : 1106 tests verts (`npm test`), dont 3 nouveaux sur
  `extraireImageLocSitemap` (image du bon bloc, entités décodées, null si
  absent).
- Lint (Biome) + typecheck : verts. Hooks pre-commit passés.
- Vérification en ligne : `/s-informer/media` sert les 3 vraies images
  (HTTP 200, image/jpeg, 96-125 Ko) après `npm run cf:deploy` sur
  maintenant-le-mouvement.org.

## Notes pour les chantiers suivants

- Si un autre média bloquant apparaît (brève qui retombe au logo alors que
  l'article a une image) : ajouter une entrée dans `CHASSEURS_PAR_HOTE`.
  La plupart des sites Arc Publishing (groupes de presse) exposent le même
  sitemap ; beaucoup de grands sites ont un oEmbed.
- Les flux cassés signalés au V2.6.90 (Politis, Haaretz, Arrêt sur images,
  Afrique XXI) restent à réparer (chantier distinct).

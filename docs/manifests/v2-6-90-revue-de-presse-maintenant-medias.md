# Manifest — V2.6.90 : revue de presse sur Maintenant Médias (mosaïque, import RSS, cron horaire)

**Date de fin** : 2026-06-12
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (commit de ce chantier)
**Durée approximative** : 1 session Claude Code (suite de la revue bêta)

## Contexte (demande Ben, 2026-06-12)

Une revue de presse type reuters.com intégrée à `/s-informer/media`
(l'espace « Brèves » dédié disparaît) : brèves importées des médias
indépendants et internationaux (titre + image + 5 à 7 lignes, « Lire la
suite » vers le site source, langue du site conservée), mêlées aux
contenus maison (toujours affichés), avec l'article épinglé à la une de
la home en tête (image plus grande, au moins 7 lignes), classement
antichronologique, tags élaborés sur le corpus initial. Import initial
3 jours / 24 max par jour (= 72), puis 1 brève par heure (80 % liste
prioritaire, 20 % sources du Portail des médias indépendants de Basta!).

## Livré et fonctionnel

- [x] **Migration additive appliquée au distant** (feu vert explicite
  Ben) : `20260612180000_media_langue_importante.sql` : colonnes
  `media.langue` (ISO 639-1, null = fr) et `media.importante`
  (mosaïque : brève illustrée = importante 5-7 lignes ; sans visuel =
  annexe 3-4 lignes).
- [x] **Registre des sources** (`lib/import-breves/sources.ts`) :
  23 sources prioritaires (liste Ben : Regards, Politis, Basta!, Vert,
  Blast, Le Média, Mediapart, Courrier international, L'Humanité,
  Libération, StreetPress, Le Monde diplomatique, Haaretz, El País,
  The Guardian, Le Monde, Contretemps, Frustration, Arrêt sur images,
  QG Média, Jeune Afrique, NYT, Le Grand Continent) + 15 sources
  complémentaires du Portail des médias indépendants (Reporterre,
  Disclose, Splann!, Acrimed, CQFD, Lundi matin, Au Poste, etc.,
  élargissable une ligne à la fois). Tirage horaire 80/20 (testé).
- [x] **Analyseur RSS/Atom maison** (`lib/import-breves/rss.ts`, pur,
  testé) : CDATA, entités, dates RFC822/ISO, images (enclosure,
  media:content, première img), extrait 5-7 lignes coupé sur un mot.
- [x] **Import** (`lib/import-breves/importer.ts`) : sélection par jour
  calendaire Europe/Paris (diversité des sources : 2 max par source au
  premier passage, prioritaires d'abord, complément Portail), images
  COPIÉES dans le bucket (`breves/`, anti-hotlink, CSP inchangée),
  idempotence par `source_url`, brève = media `type='breve'` publié sans
  auteur avec provenance + lien source + langue + tags.
- [x] **Import initial exécuté** : 65 brèves créées (72 sélectionnées,
  7 écartées : flux à description trop courte), 35/38 flux opérationnels.
- [x] **Banque de tags** (`lib/import-breves/tags.ts`) : 17 tags élaborés
  sur le corpus d'amorçage (~96 titres) + les articles maison : Luttes et
  mobilisations, Extrême droite, Police et justice, Féminismes,
  Antiracisme, Migrations, Écologie, Guerre et paix, Social et travail,
  Médias, Santé, Tech et IA, Économie, Politique, International, Culture,
  Sports. Mots-clés fr/en/es, mots courts protégés (« RN », « IA »),
  3 tags max par brève (testé).
- [x] **Page mosaïque** (`MosaiqueMedias` + refonte de
  `/s-informer/media`) : article À LA UNE en tête (même épingle que la
  home, image plus grande, extrait ~10 lignes), contenus maison toujours
  au format important, brèves importantes (image + 5-7 lignes) et annexes
  (3-4 lignes, format réduit), provenance + heure relative + langue,
  filtres par tags (chips), « Lire la suite ↗ » vers le site source en
  nouvel onglet. Onglet « Brèves » retiré de la navigation (l'URL
  ?type=breve reste fonctionnelle). Vue par type inchangée.
- [x] **Cron horaire** : route `/api/cron/import-breves` (Bearer
  CRON_SECRET) + Worker `maintenant-cron-breves` (cron `12 * * * *`),
  déployé, secret posé via l'API Cloudflare, testé en réel (1 brève
  Contretemps importée).
- [x] Vérifié en prod : page 200 avec une, tags, 148 liens sources
  externes, images servies depuis le bucket.

## Contenus à arbitrer

- [ ] Intro de la page (fallback réécrit : « Les articles de la rédaction
  et la revue de presse de Maintenant! … ») : éditable via CMS, à relire.
- [ ] La banque de 17 tags et leurs intitulés : à ajuster si souhaité
  (un tag = quelques lignes dans `lib/import-breves/tags.ts`).

## Non livré (et pourquoi)

- [ ] Flux Politis, Haaretz, Arrêt sur images, Afrique XXI en échec
  (URL de flux à retrouver ou parsing spécifique) : sources sautées
  proprement, à réparer au fil de l'eau.
- [ ] Le portail Basta! complet (900+ sources) n'est pas consommé
  dynamiquement : sélection de 15 sources représentatives, extensible.

## Tests

- Unitaires : **1 104 tests verts**, dont 13 nouveaux (analyseur RSS et
  Atom, extrait, tags et garde-fous des mots courts, sélection par jour
  avec plafond et diversité, tirage 80/20).
- Lint Biome + typecheck : verts.

## Notes pour les chantiers suivants

- Question juridique « revue de presse » (titres + extraits + image +
  lien source) : usage type agrégateur ; à confirmer avec Légicoop si
  besoin (droits voisins de la presse).
- Si un éditeur demande un retrait : retirer la brève (statut `retire`)
  et ajouter la source à une liste d'exclusion (à créer si le cas se
  présente).
- L'admin peut basculer `importante` d'une brève en base ; une console
  d'édition rapide serait un petit chantier utile.

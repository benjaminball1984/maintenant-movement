# Manifest — V2.6.87 : cartes réparées (fond OSM + points des mobilisations importées + à venir uniquement)

**Date de fin** : 2026-06-12
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (commit de ce chantier)
**Durée approximative** : 1 session Claude Code (suite de la revue bêta)

## Contexte (signalement Lilou/Ben, 2026-06-12)

« Les cartes n'ont pas de fond de carte et les événements importés dans
mobilisation n'ont pas de points sur la carte. » Plus une règle métier :
« sur la carte il est important de ne mettre que les mobilisations à venir,
les mobilisations passées disparaissent de la carte pour ne pas saturer. »

## Livré et fonctionnel

- [x] **Fond de carte de la carte unifiée (/carte) réparé.** Cause : la
  CSP (Content-Security-Policy, l'en-tête de sécurité qui liste les
  origines autorisées) n'autorisait que `https://*.tile.openstreetmap.org`,
  or `CarteUnifiee` charge ses tuiles sur le domaine NU
  `https://tile.openstreetmap.org` (forme recommandée par OSM depuis la
  dépréciation des sous-domaines a/b/c) ; le joker `*.` ne couvre pas le
  domaine nu. Ajout de l'origine nue dans `img-src` et `connect-src`
  (`next.config.mjs`). Vérifié en prod : fond OSM affiché sur /carte.
  La carte des communes (fond CARTO `a/b/c/d.basemaps.cartocdn.com`,
  couvert par le joker) fonctionnait déjà ; revérifiée en prod (le
  chargement des ~35 000 communes prend quelques secondes).
- [x] **54 mobilisations géocodées (base distante).** L'import AMI ne
  renseignait que `lieu` (texte libre) : aucune n'avait de coordonnées,
  donc aucun point sur la carte. Nouveau script
  `data-migration/geocoder-mobilisations.mjs` (dry-run puis confirm) :
  géocodage Nominatim (géocodeur libre d'OpenStreetMap, 1 requête/s,
  User-Agent identifiant) avec requêtes candidates en cascade. Résultat :
  **54/54 géocodées, 0 échec**, compteurs et autres colonnes intouchés.
- [x] **Géocodage branché dans l'import quotidien.** Nouveau module
  `lib/geocodage.ts` (`candidatsGeocodage` pure + `geocoderLieuFr`),
  utilisé par `lib/import-agenda/importer-agenda-militant.ts` : les
  événements importés chaque matin par le cron arrivent désormais avec
  leurs coordonnées (2 tentatives max, échec non bloquant). Budget du
  Worker respecté : la route `/api/cron/import-agenda` passe de 8 à
  7 événements par exécution (jusqu'à 6 fetch par événement, limite de
  50 sous-requêtes du plan Free).
- [x] **Carte = mobilisations à venir uniquement** (décision Lilou/Ben
  2026-06-12). `lib/carte/donnees.ts` filtre désormais
  `date_debut >= maintenant OU date_fin >= maintenant` (un événement en
  cours reste visible jusqu'à sa fin). Vérifié : 51 points affichés sur
  54 publiées (3 passées exclues). Les pages listes de mobilisations ne
  changent pas, seule la carte filtre.

## Contenus à arbitrer

Néant (aucun texte politique touché).

## Tests

- Unitaires : **1 056 tests verts** (`npx vitest run`), dont 11 nouveaux
  sur `candidatsGeocodage` (préfixes de salles, lieux sans virgules,
  code postal + ville, suffixe « France »).
- Lint Biome + typecheck : verts sur les fichiers touchés.
- Vérification en prod (maintenant-le-mouvement.org, après `cf:deploy`) :
  /carte affiche le fond OSM + 51 points mobilisations (capture via
  navigateur) ; /communes affiche fond CARTO + clusters ; en-tête CSP
  vérifié (origine nue présente 2 fois).

## Notes pour les chantiers suivants

- Les mobilisations créées via le formulaire du site ne sont pas
  géocodées automatiquement (champs latitude/longitude manuels) :
  brancher `geocoderLieuFr` à la création serait un petit chantier utile.
- Le filtre « à venir » de la carte s'appuie sur `date_fin` quand elle
  existe ; les événements importés sans date de fin disparaissent dès que
  `date_debut` est passée (comportement voulu).
- Politique Nominatim : faible volume uniquement (cron quotidien ≤ 7
  événements). Pour un géocodage de masse futur, prévoir un délai ≥ 1 s
  par requête comme dans le script de backfill.

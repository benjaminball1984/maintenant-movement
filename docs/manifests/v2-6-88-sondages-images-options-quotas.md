# Manifest — V2.6.88 : sondages V2 (images par option, 20 options, bascule brut/pondéré, sondage présidentielle)

**Date de fin** : 2026-06-12
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (commit de ce chantier)
**Durée approximative** : 1 session Claude Code (suite de la revue bêta)

## Contexte (demandes Lilou/Ben, 2026-06-12)

1. « Noter les options dans le cadre ne suffit pas, il faut la possibilité de
   rajouter des images pour chaque option. Il faut augmenter le nombre
   d'options jusqu'à 20. »
2. « Ce n'est pas le créateur qui décide si le sondage est pondéré : il
   s'affiche en brut d'office tant qu'il n'y a pas assez de données et en
   pondéré d'office dès qu'il y en a plus ; un toggle permet au visiteur de
   choisir sa vue. »
3. Créer le sondage « Pour qui voteriez-vous si l'élection présidentielle
   avait lieu dimanche prochain ? » avec 18 candidat·es, un portrait par
   option, et une mosaïque des portraits avec le titre incrusté comme image
   de couverture et de partage.

## Livré et fonctionnel

- [x] **Migration additive appliquée au distant** (feu vert explicite Ben) :
  `supabase/migrations/20260612110000_sondage_options_images_et_quotas.sql`.
  CHECK options élargi (2..20), colonne `options_images text[]` (tableau
  parallèle de `options`, CHECK de cohérence des longueurs), vue
  `sondage_resultats_par_tranche` (agrégat anonyme par tranche d'âge, aucune
  donnée individuelle). Aucune donnée existante touchée.
- [x] **Validation** : `creerSondageFactory` accepte 2..20 options +
  `options_images` aligné ; champ `mode` RETIRÉ du schéma de création (la
  colonne SQL reste, historique + console admin) ; `option_index` de vote
  étendu à 0..19. Nouveau message `optionsImagesIncoherentes`.
- [x] **Création** (`FormulaireCreationSondage`) : plus de choix de mode ;
  sous la zone de texte des options, un téléverseur d'image PAR option
  (`TeleverseurImage`, préfixe bucket `sondages/options`) ; libellés 2 à 20.
  L'action `creerSondage` insère `options_images` (null si aucune image).
- [x] **Vote** (`FormulaireVote`) : vignette 48px à côté de chaque option ;
  champs sociodémo toujours proposés (plus conditionnés au mode).
- [x] **Résultats** : nouveau `ResultatsSondage` (client) avec bascule
  visiteur Brut / Pondéré : brut par défaut sous 300 répondant·es (bouton
  Pondéré grisé avec compteur {total}/300), pondéré PAR DÉFAUT au-delà.
  Vignettes d'options affichées.
- [x] **Pondération** : `lib/sondages/ponderation.ts` : redressement par
  quotas sur la tranche d'âge déclarée (parts cibles INSEE population
  adulte), votes sans tranche ou moins de 18 ans à poids 1, fonction pure
  testée. `sondageParSlugAvecResultats` calcule bruts + pondérés (dégradation
  propre si la vue manque).
- [x] **Partage** : l'image de couverture du sondage alimente désormais les
  métadonnées Open Graph de la page (avant : toujours l'image par défaut).
- [x] **Sondage présidentielle créé en prod** :
  `/s-informer/sondages/presidentielle-dimanche-prochain`, 18 options
  (liste de Ben), un portrait par option (image principale de l'article
  Wikipédia francophone de chaque candidat·e, hébergées sur le bucket),
  mosaïque de couverture 1200x630 (bandeau titre en haut, grille 9x2,
  les 18 visages visibles : neutralité d'affichage). Vérifié en ligne
  (formulaire, vignettes, résultats, bascule). Script reproductible :
  `data-migration/creer-sondage-presidentielle.mjs` (gitignoré), crédits
  sources dans `data-migration/sondage-presidentielle/credits-sondage.json`.

## Correctif post-livraison (même journée, signalement Ben)

- [x] **Vote bloqué** : en rendant le bloc sociodémo toujours visible, le
  sélecteur de tranche d'âge non renseigné envoyait `''` que le schéma de
  vote refusait (enum strict) : tout vote échouait. Corrigé (`''` accepté
  puis converti en null côté action) + test de régression.
- [x] **Résultats cachés avant le vote** (décision Ben) : la section
  Résultats ne s'affiche plus que si la personne a voté, ou si le sondage
  est clos. Avant le vote : uniquement le formulaire (pas d'influence) ;
  après : uniquement les résultats (le formulaire disparaît, comme avant).

## Correctif post-livraison n°2 (même journée, signalement Ben)

- [x] **Vote toujours bloqué (« Invalid input »)** : vraie cause trouvée :
  sur des boutons radio, le `valueAsNumber` de react-hook-form renvoie NaN
  (la propriété DOM n'existe que pour les champs numériques), et Zod v4
  refusait avec son message générique. Corrigé : le schéma accepte
  chaîne OU nombre (union + transform + pipe), le formulaire n'utilise
  plus `valueAsNumber`, et plus AUCUNE option n'est précochée (un choix
  explicite est exigé, message « Choisis une option pour voter. »).
  3 tests de régression ajoutés (chaîne « 2 » acceptée et convertie,
  vote sans choix refusé).
- [x] **Badge « Pondéré » retiré de la liste des sondages** + intro et
  description mises à jour (plus de « 2 modes »).
- [x] **Mosaïque affichée** : en grand sous le titre de la page du sondage
  (ImageAffiche, image entière sur fond flouté) et en vignette sur les
  cartes de la liste. La miniature de partage (og:image) pointait déjà
  vers la mosaïque (vérifié dans le HTML) : les réseaux sociaux mettent
  leurs aperçus en cache, utiliser leurs outils de re-scrape au besoin.

## Contenus à arbitrer

- [ ] **Méthodologie de pondération** (`lib/sondages/ponderation.ts`) :
  un seul critère de quota en v1 (tranche d'âge, parts INSEE population
  adulte). Le code postal et le genre déclaré sont déjà collectés et
  pourraient enrichir le redressement. À valider par Lilou/Ben.
- [ ] **Antoine Mikolajczak (Équinoxe)** : aucune image libre trouvée
  (ni Wikipédia ni Wikimedia Commons) : vignette aux initiales « AM,
  photo à venir » générée. Fournir une photo (avec droit d'usage) pour la
  remplacer dans le bucket `sondages/presidentielle-dimanche-prochain/`.
- [ ] Orthographes corrigées par rapport à la liste fournie (à confirmer) :
  « Raphaël Glucksmann » (Glucksman), « Reconquête » (Reconquêtes),
  accents (Édouard, Éric, Équinoxe, Génération Écologie).

## Décisions techniques prises

- `options_images` : tableau PARALLÈLE à `options` plutôt qu'une table fille
  (doctrine de greffe : on additionne une colonne, `options` reste la source
  de vérité ; cohérence garantie par CHECK + validation Zod).
- La colonne `mode` est conservée en base (historique + filtres admin) mais
  l'affichage ne s'en sert plus : le seuil (300) et la disponibilité du
  calcul pondéré décident de la vue par défaut.
- Vue d'agrégat par tranche (lecture publique) plutôt que calcul via
  service_role : cohérent avec `sondage_resultats`, aucune PII exposée.

## Tests

- Unitaires : **1 070 tests verts** (`npx vitest run`), dont 14 nouveaux :
  7 sur la validation (20 options, images alignées, mode refusé,
  option_index 19) et 8 sur `pondererResultats` (quotas, poids, bords).
- Lint Biome + typecheck : verts.
- Vérification en prod (après `cf:deploy` + migration + publication) :
  page du sondage rendue avec 18 portraits, captcha, résultats avec bascule
  (Brut actif, Pondéré grisé 0/300), réseau : 18 images du bucket en 200.

## Notes pour les chantiers suivants

- La liste des sondages (`/s-informer/sondages`) n'affiche pas encore les
  images de couverture : petit chantier d'embellissement possible.
- Le formulaire de création attache les images d'options PAR POSITION de
  ligne : si on réordonne les lignes après téléversement, les images ne
  suivent pas (aide affichée). Un éditeur d'options ligne par ligne serait
  l'étape suivante.
- 503 intermittents observés sur des prefetch `_rsc` (limites CPU du plan
  Workers Free, connu depuis le 2026-06-09) : sans rapport avec ce chantier,
  le plan Paid reste recommandé.

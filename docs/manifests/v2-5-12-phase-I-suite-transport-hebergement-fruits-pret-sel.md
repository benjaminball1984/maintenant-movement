# Manifest — Chantier V2.5.12 : Phase I suite (transport, hébergement, fruits de la terre, prêt, SEL)

**Date de fin** : 2026-05-30
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~25 min.

## Découverte qui change le ratio impact/effort

L'audit a montré que **4 sous-espaces partagent un composant unique** : `<PageListeSousEspace>` (transport, hébergement, fruits-de-la-terre, qui-prête-tout). Ce composant délègue le rendu de chaque annonce à `<CarteOffre>`. Donc **une seule refonte de `<CarteOffre>` embellit les 4 sous-espaces** d'un coup. Le SEL a son propre composant `<CarteService>` (refondu séparément).

## Livré

- [x] **Refonte `<CarteOffre>`** (`components/entraide/CarteOffre.tsx`) en style vignette photo carrée :
  - Photo carrée en hero (aspect-square, object-cover, transition zoom au survol).
  - Image par défaut `/defaults/offre-entraide.svg` si pas de photo (préparée pour mapping par type plus tard).
  - Badge sens (Offre/Demande) en surimpression haut-gauche.
  - Titre 2 lignes max, lieu compact MapPin, description 3 lignes max.
  - Toute la carte cliquable via overlay invisible.
- [x] **Refonte `<CarteService>` SEL** (`components/sel/CarteService.tsx`) sans photo (le SEL n'a pas d'objet matériel) :
  - Hero typographique central : « X min · X 99-coin attendus » mis en évidence comme un prix Vinted.
  - Badges catégorie (Service/Volontariat) + sens (Offre/Demande) en haut.
  - Titre 2 lignes max, description 3 lignes max.
  - Lieu + auteurice en pied avec icônes compactes.
  - Toute la carte cliquable.
- [x] **Grilles densifiées partout** : `lg:grid-cols-3` → `lg:grid-cols-4` sur les 5 pages liste (PageListeSousEspace pour les 4 espaces partagés, page SEL).

## Impact visible immédiat (depuis le navigateur)

Aller au matin sur :
- `/s-entraider/transport` → grille 4 colonnes avec photos + badge Offre/Demande en surimpression
- `/s-entraider/hebergement` → idem
- `/s-entraider/fruits-de-la-terre` → idem
- `/s-entraider/qui-prete-tout` → idem
- `/s-entraider/sel` → cartes hauteur-largeur avec « X min » en gros bloc central

Les 5 pages partagent maintenant la même grammaire visuelle « grille de vignettes » que le marché solidaire (V2.5.11). C'est l'esprit du Master Plan §I : copier la grille de vignettes des leaders grand public.

## Non livré (volontairement reporté)

- [ ] **Grammaire visuelle spécifique par type** : Master Plan demande « transport façon BlaBlaCar » (carte horizontale avec départ → arrivée mise en évidence), « hébergement façon Airbnb » (photo grande, info host). Pour cette première passe, on a unifié sur la grammaire vignette-photo (Vinted-like). La différenciation BlaBlaCar/Airbnb par type viendra dans des chantiers dédiés (V2.5.12.a, V2.5.12.b) qui liront le `meta` JSON spécifique (départ/arrivée pour transport, dates dispo pour hébergement).
- [ ] **Tooltip survol pour transport** (« Départ → Arrivée, horaires ») demandé par Lilou/Ben dans l'arbitrage §11. Demande de lire `offre.meta.depart`, `offre.meta.arrivee`, etc. Reportée à V2.5.12.a.
- [ ] **Images par défaut différenciées par type** : pour l'instant on retombe sur `/defaults/offre-entraide.svg` partout. Le mapping `IMAGE_DEFAUT_PAR_TYPE` est en place dans le code, prêt à recevoir des SVG spécifiques.
- [ ] **Boutiques et minimarchés du marché** (`app/(public)/s-entraider/marche/boutiques`, `minimarches`) : ont leurs propres composants spécifiques, pas refondus cette nuit. Cohérent visuellement avec la home marché mais pas en style Vinted strict.

## Décisions techniques

- **Pas d'invention de nouvelle iconographie** : tous les badges sont en composants `<Badge>` existants, toutes les icônes viennent de `lucide-react` déjà utilisé partout.
- **Overlay invisible cliquable** : `<span aria-hidden="true" className="absolute inset-0" />` à l'intérieur du `<Link>` du titre. Permet à toute la carte de réagir au clic sans casser l'accessibilité (lecteur d'écran lit juste le titre).
- **Image par défaut via `/defaults/`** : la bibliothèque existe déjà (chantier ET1 référence dans les manifests précédents), on s'en sert.
- **`<CarteService>` SEL sans photo** : le SEL est par nature immatériel (du temps). La grammaire visuelle s'adapte = bloc central typographique sur la valeur (durée + 99-coin attendus) comme un prix. Plus authentique qu'une photo générique inventée.

## Tests

- **941 tests verts** (inchangé, aucun test ciblait les anciennes cartes).
- **Typecheck** vert sur les 4 fichiers modifiés.
- **Lint biome** propre.

## Notes pour les chantiers suivants

- **V2.5.12.a Transport spécifique** : lire `offre.meta` pour afficher départ/arrivée/horaires + tooltip au survol. ~30 min.
- **V2.5.12.b Hébergement spécifique** : afficher dates de disponibilité, capacité, type de couchage si présents dans `meta`. ~30 min.
- **Phase J réseau social plus chaleureux** : prochaine grande étape Master Plan. Vraies cartes de publication avec avatars en taille respectable, hiérarchie typographique, micro-animations.
- **Phase K CMS amélioré** : pour les 1200+ clés éditables, console organisée avec recherche/regroupement/aperçu.

## Bilan global Phase I

Phase I est désormais à **6/6 espaces couverts** par une grammaire visuelle vignette :
1. Marché solidaire (V2.5.11) → grille 4 col + photo carrée + badges surimpression
2-5. Transport, hébergement, fruits de la terre, prêt (V2.5.12) → idem via CarteOffre partagée
6. SEL (V2.5.12) → variante sans photo avec hero typographique durée+coin

La doctrine « copier la grammaire visuelle des leaders » est respectée : le geste est connu (grille de vignettes), la couleur et le vocabulaire restent ceux de Maintenant! (dégradé, badges).

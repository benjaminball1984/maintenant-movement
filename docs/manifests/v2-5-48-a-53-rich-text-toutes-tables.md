# Manifest groupé — Cycle V2.5.48 → V2.5.53 : rich text étendu à toutes les tables de contenu long

**Date de fin** : 2026-05-29
**Branche** : `main`
**Commit final** : `9ae43b3`
**Durée approximative** : ~1h sessions Claude Code.

## Objectif

Étendre l'infrastructure rich text (foundations posées en V2.5.23) à toutes les tables de la base qui ont un champ texte long affiché côté visiteur. Cohérence : n'importe quelle description longue dans le site peut désormais être enrichie (couleurs, polices, listes, citations, images, embeds vidéo) sans toucher au code.

## Livré

### V2.5.48 — Recherche console CMS étendue à `valeur_html` (commit `0fbf926`)

- [x] **`ConsoleContenusCMS`** : la barre de recherche cherche aussi dans `valeur_html` après strip des balises HTML. Permet de retrouver les contenus migrés en rich text dont `valeur_md` est obsolète.

### V2.5.49 — Bio rich text sur profil personne (commit `7a869e1`)

- [x] **Migration `20260530800000_personne_bio_html.sql`** : colonne `bio_html` nullable additive sur `personne`.
- [x] **Migration `20260530810000_personne_affichage_bio_html.sql`** : DROP + CREATE de la RPC `personne_affichage(uuid)` pour ajouter `bio_html` au RETURN TABLE. Visibilité suit le même flag `bio` dans `preferences_visibilite`.
- [x] **`types/database.ts`** : `personne.bio_html` ajouté.
- [x] **`mettreAJourProfilSchema`** : `bio_html` optionnel (max 20 000 chars).
- [x] **Server Action `mettreAJourProfil`** : sanitize via `sanitizeRichHtml`.
- [x] **UI `FormulaireInformations`** : switch Riche/Markdown au-dessus du champ bio. Mode Riche = `EditeurRicheAvecToolbar`. Pré-remplissage au bascule via `markdownLegerEnHtml`.
- [x] **Rendu profil réseau** : `ProfilReseau.bioHtml` consommé, prioritaire sur `bio` plat.

### V2.5.50 — Rich text infrastructure pour campagne (commit `fafaa75`)

- [x] **Migration `20260530900000_campagne_texte_html.sql`** : colonne `texte_html` nullable additive.
- [x] **`types/database.ts`** : `campagne.texte_html` ajouté.
- [x] **`creerCampagneFactory`** : `texte_html` optionnel (max 50 000 chars).
- [x] **Server Action `creerCampagne`** : sanitize.
- [x] **Rendu page `/mobiliser/campagnes/[slug]`** : priorise `texte_html`, fallback texte brut.

### V2.5.51 — UI rich text dans `FormulaireCreationCampagne` (commit `7532ade`)

- [x] **Switch Riche/Markdown** au-dessus du champ Présentation. Mode Riche = `EditeurRicheAvecToolbar`. Pré-remplissage au bascule.
- [x] **Champ texte plat reste obligatoire** (Zod min 100 chars) mais devient pliable en mode Riche : résumé/fallback pour SEO et lecteurs de RSS / mail texte.

### V2.5.52 — Rich text infrastructure pour mobilisation (commit `8767762`)

- [x] **Migration `20260530910000_mobilisation_description_html.sql`** : colonne `description_html` nullable additive.
- [x] **`types/database.ts`** : `mobilisation.description_html` ajouté.
- [x] **`creerMobilisationFactory`** : `description_html` optionnel (max 50 000 chars).
- [x] **Server Action `creerMobilisation`** : sanitize.
- [x] **Rendu page `/mobiliser/mobilisations/[slug]`** : priorise `description_html`, fallback texte brut.

### V2.5.53 — Rich text infrastructure pour pétitions et cagnottes (commit `9ae43b3`)

- [x] **Migration `20260530920000_petition_cagnotte_texte_html.sql`** : 2× `ALTER TABLE ADD COLUMN texte_html`.
- [x] **`types/database.ts`** : `petition.texte_html` et `cagnotte.texte_html` ajoutés.
- [x] **Schemas Zod `creerPetition` et `creerCagnotte`** : `texte_html` optionnels.
- [x] **Server Actions `creerPetition` et `creerCagnotte`** : sanitize.
- [x] **Rendu pages `/mobiliser/petitions/[slug]` et `/mobiliser/cagnottes/[slug]`** : priorisent `texte_html`, fallback texte brut.

## Total

À la fin de ce cycle, **toutes les surfaces de contenu long du site** ont une version HTML riche optionnelle :

| Table | Colonne md | Colonne html | Chantier UI |
|---|---|---|---|
| `contenu_editorial` | `valeur_md` | `valeur_html` | V2.5.25, V2.5.26 |
| `journal_affiche` | `contenu_md` | `contenu_html` | V2.5.33 |
| `reunion_decider` | `ordre_jour_md`, `pv_md` | `ordre_jour_html`, `pv_html` | V2.5.37 |
| `personne` | `bio` | `bio_html` | V2.5.49 |
| `campagne` | `texte` | `texte_html` | V2.5.51 |
| `mobilisation` | `description` | `description_html` | infrastructure V2.5.52, UI à brancher |
| `petition` | `texte` | `texte_html` | infrastructure V2.5.53, UI à brancher |
| `cagnotte` | `texte` | `texte_html` | infrastructure V2.5.53, UI à brancher |

## Non livré (volontairement reporté)

- [ ] **UI éditeur rich text dans `FormulaireCreationMobilisation`, `FormulaireCreationPetition`, `FormulaireCreationCagnotte`** : l'infrastructure est posée (Server Actions acceptent `*_html`, sanitization, rendu prioritaire), il manque le switch Riche/Markdown dans les formulaires. Pattern identique à V2.5.51 (campagne). ~15 min par formulaire. **V2.5.54 à V2.5.56**.
- [ ] **Édition des contenus après création** (`mettreAJourPetition`, `mettreAJourMobilisation`, `mettreAJourCampagne`) : pour permettre d'ajouter du rich text après coup à un contenu déjà publié. ~30 min par table. **V2.5.57 à V2.5.59**.

## Décisions techniques

- **Pattern stable répété 6 fois** : Migration additive `*_html text` nullable → Server Action sanitize via `sanitizeRichHtml` → page de rendu priorise HTML déjà sanitizé. Le pattern est tellement régulier qu'il pourrait être factorisé en helper SQL (template de migration) et helper TS (`sanitizeOuNull(html)`), mais 6 répétitions reste sous le seuil rentable.
- **Limite 50 000 chars** pour `*_html` vs 5 000 pour les textes plats : permet du rich text étendu sans risque de DOS (HTML compact comparé au markdown pré-rendu).
- **Sanitization au save, pas au render** : appliquée 1 fois à l'enregistrement, jamais à la lecture. Stratégie inchangée depuis V2.5.23.
- **DROP + CREATE de la RPC `personne_affichage`** (V2.5.49) : PostgreSQL refuse `CREATE OR REPLACE` quand la signature `RETURNS TABLE` change. Aucune donnée perdue (RPC sans state, calcul à la volée).
- **Le rich text reste optionnel** : aucune migration ne casse le texte plat existant. Les contenus actuels continuent de s'afficher exactement comme avant.

## Tests

- **1002 tests verts** (inchangé depuis V2.5.42, cap 1000 franchi).
- **Typecheck** vert.
- **Lint biome** propre.

## Cas d'usage immédiats (vérifiables au navigateur)

1. **Bio rich text** : `/profil/informations` → section Présentation publique → bouton « Riche » → écrire une bio avec couleurs, listes, liens → enregistrer → aller sur `/s-informer/reseau/{numero}` voir le rendu riche.
2. **Recherche console CMS** : `/admin/national/contenus` → chercher un mot qui est uniquement dans la version riche d'une clé → la clé apparaît dans les résultats.
3. **Campagne riche** : `/mobiliser/campagnes/nouvelle` → bouton « Riche » au-dessus de la présentation → écrire avec mise en forme → soumettre → après modération, la fiche affiche le HTML riche.

## Migrations en attente d'application au distant

Ce cycle ajoute **4 nouvelles migrations** à appliquer au distant via `supabase db push` quand la Phase M sera ouverte :

- `20260530800000_personne_bio_html.sql`
- `20260530810000_personne_affichage_bio_html.sql`
- `20260530900000_campagne_texte_html.sql`
- `20260530910000_mobilisation_description_html.sql`
- `20260530920000_petition_cagnotte_texte_html.sql`

Toutes additives, doctrine de greffe respectée. Aucune perte de donnée possible.

## Notes pour les chantiers suivants

- Le pattern « SwitchMode + EditeurRicheAvecToolbar + champ texte plat pliable obligatoire » est désormais éprouvé (V2.5.33, V2.5.37, V2.5.49, V2.5.51). À répliquer pour mobilisation/pétition/cagnotte UI quand le besoin se présente.
- Pour activer pleinement le rich text sur les contenus existants, lancer `npx tsx scripts/convertir-tout-en-riche.ts --confirm` (V2.5.41) après application des migrations au distant.

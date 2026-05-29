# Manifest, Phase V2.5, Chantier V2.5.55 : centralisation du rendu rich text des pages de détail

**Date de fin** : 2026-05-29
**Branche** : main
**Commit final** : `d288e70`
**Durée approximative** : 1 session Claude Code (courte)

## Contexte

Le cycle rich text (V2.5.23 à V2.5.54) a doté 8 champs de texte long
(contenu éditorial, journal, OJ et PV Décider, bio profil, campagne,
mobilisation, pétition, cagnotte) d'une version HTML riche optionnelle, et
créé le composant Server `RenduRiche` (`components/rich-text/RenduRiche.tsx`)
comme chemin de rendu canonique : typographie complète via sélecteurs
Tailwind (titres h1 à h4, paragraphes, listes, citations, liens, images,
iframes/embeds, tables, code, pre, hr) et fallback Markdown léger.

Or 7 pages de détail rendaient encore leur HTML via un `dangerouslySetInnerHTML`
inline accompagné d'une **chaîne `className` `prose ...` dupliquée et
incomplète** (elle ne stylait que a, blockquote, h2, h3, ol, p, ul). Deux
défauts réels en découlaient :

1. **Rendu incomplet** : un contenu riche contenant une image, un embed
   YouTube/Vimeo, un tableau, un bloc de code ou un séparateur s'affichait
   **sans style** sur ces 7 pages, alors qu'il était correct partout où
   `RenduRiche` était déjà utilisé (PageEditorialeCMS, emails, page démo).
2. **Dette DRY** : la même chaîne de ~200 caractères dupliquée 7 fois, plus
   7 copies du `dangerouslySetInnerHTML` à maintenir en parallèle.

## Livré et fonctionnel

- [x] Migration des 4 pages de détail `mobiliser` (`cagnottes/[slug]`,
  `campagnes/[slug]`, `mobilisations/[slug]`, `petitions/[slug]`) : le bloc
  HTML inline est remplacé par `<RenduRiche valeurHtml={html}
  className="text-text-2 leading-relaxed" />`. Le fallback texte brut
  (`whitespace-pre-line`) est conservé tel quel.
- [x] Migration `s-informer/journal/[slug]` (bloc HTML de l'article) :
  `<RenduRiche valeurHtml={html} />` (la couleur est héritée du wrapper
  `<article>` `text-text-1`). Fallback Markdown léger et placeholder
  éditable vide conservés.
- [x] Migration `s-informer/decider/[slug]/[reunionId]` (2 blocs : ordre du
  jour et procès-verbal) : `<RenduRiche valeurHtml={...} />`. Fallback
  Markdown et placeholders éditables vides conservés.
- [x] Migration de la bio rich text sur `s-informer/reseau/[numero]` :
  `<RenduRiche>` enveloppé dans un parent `max-w-2xl` pour **préserver la
  contrainte de largeur** d'origine (RenduRiche pose `max-w-none` en
  interne ; le parent contraint donc la largeur sans conflit de classes
  Tailwind, puisque le `cn` du projet est une simple concaténation sans
  tailwind-merge). Fallback texte brut conservé.

**Bilan** : 7 fichiers, 8 blocs, net -36 lignes (56 supprimées, 20
ajoutées). Aucune perte de comportement (RenduRiche est un sur-ensemble
typographique des classes inline) ; gain de style sur les images, embeds,
tables et code des contenus riches de ces pages.

## Livré partiellement

(rien)

## Non livré (et pourquoi)

- [ ] Test de rendu unitaire de `RenduRiche` : non ajouté. L'environnement
  Vitest est en mode `node` (cf. `vitest.config.ts`, jsdom prévu « à partir
  du chantier qui introduira des tests React » mais pas encore activé).
  Ajouter jsdom + testing-library aurait été du périmètre hors sujet pour ce
  refactor. Le rendu HTML de `RenduRiche` est par ailleurs déjà éprouvé en
  conditions réelles (PageEditorialeCMS, emails) et son sanitize couvert par
  18 tests (`tests/unit/rich-text-sanitize.test.ts`).

## Contenus à arbitrer

(aucun ; chantier purement technique)

## Décisions techniques prises

- Pour la bio réseau, préservation de `max-w-2xl` via un `<div>` parent
  plutôt qu'en surchargeant la classe de `RenduRiche` : le `cn` maison
  concatène sans résoudre les conflits Tailwind (`max-w-none` vs
  `max-w-2xl`), donc un override par className serait non déterministe selon
  l'ordre du CSS généré. Le parent contraignant est robuste et sans
  ambiguïté.

## Tests

- Unitaires : 1002 tests, tous verts (`npm test`), inchangé (refactor sans
  logique nouvelle).
- Lint (`npm run lint`, biome) : 7 fichiers touchés impeccables (0 warning,
  0 erreur). Les 18 warnings du projet sont préexistants et hors périmètre
  (éditeurs TipTap).
- Typecheck (`npm run typecheck`, tsc) : vert.
- Smoke test dev (`next dev` contre le Supabase local, lecture seule) :
  routes de liste en 200, les 7 pages `[slug]` migrées en 404 propre
  (`notFound`, jamais 500), zéro erreur de compilation dans le log.

## Notes pour les chantiers suivants

- `RenduRiche` est désormais le chemin de rendu rich text unique sur toutes
  les pages de détail. Tout nouveau champ HTML riche doit l'utiliser plutôt
  que de réintroduire un `dangerouslySetInnerHTML` inline.
- Reste hors de ce composant : la page admin `rich-text-demo` et les
  éditeurs (`EditeurRiche`, `EditeurRicheAvecToolbar`, `ContenuEditableAdmin`)
  qui ont des besoins d'aperçu/édition spécifiques.
- Le `cn` maison reste sans tailwind-merge ; si un futur chantier a besoin de
  surcharger proprement des classes en conflit, c'est le moment d'évaluer
  `clsx` + `tailwind-merge` (cf. note dans `lib/utils.ts`).

# Manifest — V2 Vague 2, Chantier V2.2.4 : Open Graph côté serveur (§10)

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-2-4-open-graph`
**Base** : `main` (tip `0a7f9ec`, V2.2.3)

---

## Livré et fonctionnel

- [x] **`lib/og-metadata.ts`** : helper `metadataPourPartage({ objet, cheminPage, ogType })` qui produit une `Metadata` Next.js complète :
  - **title** + **description** (tronquée à 200 caractères pour OG/Twitter).
  - **alternates.canonical** : URL absolue de la page (basée sur `SITE.urlProd`).
  - **openGraph** : title, description, url canonique, siteName, locale `fr_FR`, type (`website` par défaut, `article` pour Maintenant Médias), images (URL absolue, 1200×675, alt).
  - **twitter** : card `summary_large_image`, title, description, images (URL absolue).
  - S'appuie sur `lib/images.ts:getImageObjet` (V2.0.3) pour la règle « image uploadée gagne sinon défaut par type ». L'URL d'image est rendue ABSOLUE (les crawlers OG WhatsApp/Facebook/X exigent des URL absolues).
- [x] **4 pages partageables branchées** via `metadataPourPartage` dans leur `generateMetadata` :
  - `app/(public)/mobiliser/petitions/[slug]/page.tsx` (`type_objet: 'petition'`)
  - `app/(public)/mobiliser/cagnottes/[slug]/page.tsx` (`type_objet: 'cagnotte'`)
  - `app/(public)/mobiliser/mobilisations/[slug]/page.tsx` (`type_objet: 'mobilisation'`)
  - `app/(public)/agir/moments-solidaires/[slug]/page.tsx` (`type_objet: 'moment_solidaire'`, pas d'`image_url` en V1 → image par défaut)
- [x] **Tests unitaires** `tests/unit/og/metadata.test.ts` — **8 tests** (title/description, URL canonique absolue, image par défaut vs uploadée, troncation 200 chars, ogType article vs website, URL d'image rendue absolue).

## Livré partiellement

- [ ] **Pages partageables non encore branchées** : campagne, sondage, article (Maintenant Médias), produit_marche, service_sel, offre_entraide, commune, fédération. Le helper est posé, l'ajout sur chaque page se fait en 3 lignes — à compléter au fil des chantiers VAGUE 3 dédiés à chaque sous-espace.

## Non livré (et pourquoi)

- [ ] **Test E2E réel avec un crawler OG** : aucun test ne vérifie que WhatsApp / Facebook / X récupèrent bien les balises. Recommandé d'utiliser des outils publics (https://www.opengraph.xyz, l'outil Facebook Sharing Debugger) une fois la prod déployée.
- [ ] **Pré-rendu statique des OG** : pour l'instant, les balises sont générées dynamiquement à chaque requête. Si une page partageable a beaucoup de trafic crawler, on pourra ajouter `force-static` + ISR plus tard.

## Décisions techniques prises

- **URL absolues via `SITE.urlProd` plutôt que `getSiteUrl()`** : `urlProd` est la canonique figée utilisée pour le SEO ; `getSiteUrl()` lit `NEXT_PUBLIC_SITE_URL` qui peut pointer sur `localhost` en dev. Les crawlers OG voient toujours `https://maintenant-le-mouvement.org/...`.
- **Image dimensions 1200×675** : ratio Open Graph standard (16:9), cohérent avec les placeholders SVG par défaut posés en V2.0.3.
- **`alternates.canonical`** posé en plus de `openGraph.url` : Next.js ne déduit pas automatiquement l'un de l'autre, certains crawlers SEO préfèrent l'un, d'autres l'autre.
- **Cast `Record<string, unknown>` pour tester `type` Open Graph** : le type Next.js `OpenGraph` est discriminé par le champ `type` lui-même, ce qui empêche un accès direct en TypeScript. Le cast évite un `any` plus large.

## Écarts V1→V2 appliqués

- **Open Graph minimal V1 → complet V2** : avant V2.2.4, `generateMetadata` ne renvoyait que `title` + `description` (Next.js dérivait des balises OG sans image). Le V2 §10 exige titre + description + IMAGE par défaut ou uploadée, sur chaque page partageable. **Compromis** : on **ajoute** le helper + on branche 4 pages clés. Les autres pages partageables (campagne, article, marché, etc.) restent en mode minimal V1 jusqu'à leur chantier VAGUE 3 dédié — pas de régression, juste pas encore enrichies.

## Tests

- **Unitaires (Vitest)** : 35 fichiers, **373 tests verts** (+8 nouveaux).
- **Build Next.js** : non lancé spécifiquement, mais le `npm run build` du hook pre-commit consomme la nouvelle metadata et passe.
- **Lint Biome** : 439 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **E2E Playwright** : non lancés.

## Notes pour les chantiers suivants

- **Brancher `metadataPourPartage` sur les pages restantes** au fil des chantiers VAGUE 3 :
  - Campagne : `app/(public)/mobiliser/campagnes/[slug]/page.tsx`, `type_objet: 'campagne'`.
  - Article (Maintenant Médias) : `app/(public)/s-informer/media/[slug]/page.tsx`, `type_objet: 'article'`, `ogType: 'article'`.
  - Sondage : `app/(public)/s-informer/sondages/[slug]/page.tsx`, `type_objet: 'sondage'`.
  - Marché : `app/(public)/s-entraider/marche/produits/[slug]/page.tsx`, `type_objet: 'produit_marche'`. Idem boutiques + minimarchés.
  - SEL : `app/(public)/s-entraider/sel/[slug]/page.tsx`, `type_objet: 'service_sel'`.
  - Offre entraide : `app/(public)/s-entraider/offre/[slug]/page.tsx`, `type_objet: 'offre_entraide'`.
  - Commune libre : `app/(public)/agir/communes/[slug]/page.tsx`, `type_objet: 'commune_libre'`.
- **Vérifier avec un crawler réel** une fois la prod déployée : Facebook Sharing Debugger, WhatsApp Link Preview, X Card Validator. Mettre les résultats dans un MANIFEST de chantier dédié.
- **Open Graph pour les profils membres** (réseau social) : selon la spec V2 §17 « numéro M+7 stable », on peut afficher des balises OG sur `/s-informer/reseau/[numero]`. À traiter avec attention RGPD (afficher_nom de D11 doit être respecté).

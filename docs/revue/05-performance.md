# Revue 2026 : Bloc 5 : Performance, rapidité d'affichage, scalabilité

> Échelle réelle : 35 011 communes, 17 746 signatures, 15 737 profils. Distant en région Francfort.

## Synthèse

- **Rapidité d'affichage : BON.** Requêtage homogène et soigné : hydratation par lot (`in(...)` + `Map`), `Promise.all` systématique, listes plafonnées (`.limit()`), pagination réelle (`.range()` + `count`) sur les grosses consoles (communes 35k, personnes 15k), `next/image` + `sizes`, MapLibre et TipTap-édition isolés en `dynamic({ssr:false})`, `RenduRiche` zéro-JS pour la lecture.
- **Tenue en charge : MOYEN.** Trois points à l'échelle réelle : (1) **index manquant** sur `signature_petition.code_postal` → seq scan sur la fiche commune (page chaude, indexable SEO) ; (2) **aucune page publique cachée** (home recalcule des `count` à chaque visite) ; (3) **comptages N+1 « doux »** alors que des **vues d'agrégat existent déjà**. Aucun blocage critique ; fondations saines.

## Problèmes par sévérité

| Sévérité | Catégorie | Problème | Fichier:ligne | Correctif |
|---|---|---|---|---|
| **Haute** | Index | `compteurs_commune()` fait 2× `count(*)` sur `signature_petition WHERE code_postal IN (...)` ; seul index = `substring(code_postal,1,2)`, inutilisable → seq scan de 17 746 lignes ×2 par fiche commune. | `supabase/migrations/20260525120000_compteurs_commune.sql:43-58` | Migration additive : `create index signature_petition_code_postal_idx on signature_petition (code_postal);`. |
| Moyenne | Cache | Toutes les pages publiques rendues dynamiquement (cookies Supabase) ; la home recalcule 3 `count` à chaque visiteur. | `lib/home/requetes.ts:31` ; `app/(public)/page.tsx:25` | Compteurs home via client sans cookies + `unstable_cache(revalidate:300)` ou route `export const revalidate`. |
| Moyenne | N+1 doux | `hydraterPetitions` : 1 RPC `nombre_signatures` **par pétition** alors que la vue `petition_compteur` agrège tout. | `lib/petitions/requetes.ts:35-63` | `from('petition_compteur').select('petition_id, nombre_signatures').in('petition_id', ids)` (1 requête). |
| Moyenne | N+1 doux | Idem cagnottes : 1 RPC `compteurs_cagnotte` par cagnotte (vue `cagnotte_compteur` dispo). | `lib/cagnottes/requetes.ts:27-60` | `from('cagnotte_compteur').in('cagnotte_id', ids)`. |
| Moyenne | N+1 doux | `chargerIdentites` : 1 RPC `personne_affichage` par personne (≈60 RPC sur un flux). | `lib/reseau/requetes.ts:98-118` | RPC batch `personne_affichage_lot(cibles uuid[])` SECURITY DEFINER (1 appel). |
| Basse | Pagination | `listerConversations` charge tous les `message_reseau` sans `.limit()` puis agrège en JS. | `lib/reseau/requetes.ts:673-676,718` | Borner (`.limit(500)`) ou DISTINCT ON SQL. |
| Basse | Bundle | TipTap (StarterKit + 8 extensions, ~150 Ko) importé **statiquement** dans 3 composants d'édition. | `FormulaireCreationCampagne.tsx:10` ; `ContenuEditableAdmin.tsx:4` ; `EditeurInlineCMS.tsx:4` | `next/dynamic({ssr:false})` (comme la carte). Rendu public déjà zéro-JS. |
| Basse | Images | 2 `<img>` bruts (réseau) sans `next/image` ; `remotePatterns: []` bloquerait `next/image` sur Supabase de toute façon. | `CartePost.tsx:146` ; `AvatarReseau.tsx:19` ; `next.config.mjs:191` | Ajouter le hostname Supabase dans `remotePatterns` puis passer en `next/image`. |
| Basse | Payload | Route GeoJSON sérialise ~35 011 communes (~3-4 Mo) ; mitigé par cache 24 h + clustering MapLibre. | `app/api/communes/geojson/route.ts:25-63` | Acceptable ; tuiles vectorielles plus tard si besoin. |

## Risques de tenue en charge (échelle réelle)
1. **Fiche commune = point chaud n°1** (page par commune, SEO) : sans index `code_postal`, 2 seq scans de 17k lignes par vue. **Correctif prioritaire = l'index** (+ cache `revalidate` 1 h, ces compteurs bougent lentement).
2. **Home non cachée** : 3 `count` par visiteur anonyme ; rapides avec index mais gâchés sans cache, charge évitable sous pic viral.
3. **N×round-trip vers Francfort** : les N+1 doux ne sont pas des seq scans mais multiplient la latence réseau ; 1 vue = 1 aller-retour.
4. **Listes plafonnées non paginées côté public** : bornées (pas d'explosion), mais prévoir la vraie pagination publique quand le volume dépassera les plafonds (`Pagination` + `lib/pagination.ts` déjà prêts).

## Déjà bien optimisé (à préserver)
Hydratation par lot partout (`communes`, `marche`, `mes-creations`, `reseau:hydraterPosts`, `reservation` FK polymorphe en ≤6 requêtes) ; pagination réelle sur consoles communes/personnes ; compteurs home `head:true` ; ~120 index (statut, `created_at desc` partiels, FK, géoloc partiels, slugs, FK polymorphes composites) ; cartes lazy `dynamic({ssr:false})` + clustering 35k ; `RenduRiche` Server Component ; `next/image`+`sizes` (AVIF/WebP) ; tolérance d'erreur home (retourne 0).

## Correctifs ajoutés
- **C28 (P0, Haute)** : index `signature_petition.code_postal` (migration additive). *(local)*
- **C29 (P1)** : compteurs pétitions/cagnottes via vues `petition_compteur`/`cagnotte_compteur` (supprime 2 N+1). *(local)*
- **C30 (P1/P2)** : cache des compteurs home (`unstable_cache` revalidate) + fiche commune. *(local)*
- **C31 (P2)** : RPC batch `personne_affichage_lot` ; TipTap en `dynamic()` ; `.limit()` sur conversations ; `remotePatterns` Supabase + `<img>`→`next/image`. *(local, migration additive pour la RPC)*

*Fin du Bloc 5. Tous les audits (Blocs 1-5) sont terminés. Suit la consolidation + Bloc 6 (application des correctifs).*

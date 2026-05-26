# Manifest — V2 Vague 3, Chantier V2.3.1 : Open Graph sur pages restantes

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-1-og-pages-restantes`
**Base** : `main` (tip `c6bed79`, V2.2 fermée)

---

## Livré et fonctionnel

V2.3.1 est volontairement **resserré** sur la finition Open Graph (suite directe de V2.2.4), pas sur la création de nouveaux sous-espaces. Constat à l'ouverture de la VAGUE 3 : tous les sous-espaces S'entraider mentionnés dans le plan (hébergement, transport, prêt, marché, SEL, fruits) **existent déjà en V1** (pages liste + détail + nouvelle). Le travail V2 sur ces sous-espaces est de **les enrichir** avec les composants transversaux V2 (FilDeGroupe, Réservation, TeleverseurImage, Open Graph), pas de les créer. La voie la plus mécanique et la moins risquée pour cette nuit : étendre l'Open Graph côté serveur posé en V2.2.4.

- [x] **10 pages détail branchées sur `metadataPourPartage`** (helper V2.2.4) :
  - `app/(public)/mobiliser/campagnes/[slug]/page.tsx` → `campagne`
  - `app/(public)/s-informer/sondages/[slug]/page.tsx` → `sondage` (image par défaut)
  - `app/(public)/s-informer/media/[slug]/page.tsx` → `article`, `ogType: 'article'`, `vignette_url`
  - `app/(public)/s-entraider/marche/produits/[slug]/page.tsx` → `produit_marche`
  - `app/(public)/s-entraider/marche/boutiques/[slug]/page.tsx` → `boutique_marche`
  - `app/(public)/s-entraider/marche/minimarches/[slug]/page.tsx` → `minimarche_solidaire`
  - `app/(public)/s-entraider/sel/[slug]/page.tsx` → `service_sel` (image par défaut)
  - `app/(public)/s-entraider/offre/[slug]/page.tsx` → mapping fin selon `offre.type` (transport/hebergement/pret_objet/...) avec fallback `offre_entraide`
  - `app/(public)/agir/communes/[slug]/page.tsx` → `commune_libre` (image par défaut)
  - `app/(public)/agir/federations/[slug]/page.tsx` → `federation` (image par défaut)
- [x] **Cumul V2.2.4 + V2.3.1** : 14 pages de détail ont désormais des balises OG complètes (title + description tronquée + image absolue 1200×675 + twitter card + canonical absolu).

## Livré partiellement

- [ ] **Sous-espaces S'entraider — autres enrichissements** : pas branché `FilDeGroupe`, `Réservation`, `TeleverseurImage` sur les formulaires V1 existants. Chacun mérite son chantier dédié avec contenus à arbitrer.
- [ ] **Description fédération générique** : `description: \`Fédération ${federation.nom} du mouvement Maintenant!\`` est une formule fonctionnelle, à enrichir quand le champ `description` sera ajouté à la table (chantier V2 dédié).

## Non livré (et pourquoi)

- [ ] **V2.3.1 (plan original) — nouveaux sous-espaces** : hébergement/transport/prêt/marché solidaire/groupe d'entraide local. Constat : les 5 premiers existent déjà en V1. Le 6e (groupe d'entraide local) est vraiment nouveau et demande une migration BDD complète (nouvelle table avec RLS + helpers + UI). Reporté en chantier dédié.
- [ ] **V2.3.2 — location mutualisée** : composant transversal §12 (bus/car/salle, organisateur tampon, euros only). Non démarré, demande conception UI + conformité juridique.
- [ ] **V2.3.3 — compléments S'informer / Agir** : seulement les pages OG cette nuit ; les compléments propres aux fiches (réseau social affinements, Décider, etc.) sont des chantiers à part.

## Contenus à arbitrer

Aucun nouveau contenu à arbitrer. La VAGUE 3 « réelle » (création de sous-espaces) demandera des contenus éditoriaux de Lilou/Ben qui ne sont pas dans le pack CDC V2.

## Décisions techniques prises

- **Pages liste non branchées** : seules les pages **détail** (slug) ont besoin d'OG riche. Les pages de liste (`/s-entraider/sel`, `/mobiliser/petitions`, etc.) gardent leur metadata existante de section.
- **Mapping fin `offre.type`** : la page `offre/[slug]` distingue 3 sous-types `transport` / `hebergement` / `pret_objet` qui pointent vers 3 images par défaut distinctes (toutes fusionnées sur `offre-entraide.svg` actuellement, mais le typage est prêt si Lilou/Ben veut différencier).
- **Description fallback pour les entités sans description** : `commune` et `federation` n'ont pas de champ description riche en V1 ; on utilise une formule générique sobre. À enrichir quand le champ sera ajouté.

## Écarts V1→V2 appliqués

- **OG minimal → complet** : continuation de V2.2.4. Aucun écart d'architecture, simple enrichissement de `generateMetadata`. Aucune donnée touchée.

## Tests

- **Unitaires (Vitest)** : 35 fichiers, **373 tests verts** (pas de nouveau test, le helper `metadataPourPartage` était déjà couvert en V2.2.4).
- **Lint Biome** : 439 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur (un fix en cours de route : `offre.type === 'pret_objet'` au lieu de `'pret'`).
- **Build Next.js** : non lancé séparément ; le hook pre-commit valide en CI.
- **E2E Playwright** : non lancés.

## Notes pour les chantiers suivants

- **Tester le partage réel** : une fois en prod, vérifier sur https://www.opengraph.xyz ou via Facebook Sharing Debugger qu'une URL de pétition, cagnotte, mobilisation, moment, campagne, sondage, article, produit, boutique, minimarché, service SEL, offre entraide, commune, fédération affiche bien l'image + titre + description.
- **Groupe d'entraide local** : table SQL à créer (`groupe_entraide_local`), helpers, UI (création + liste + détail), branchement `FilDeGroupe` (cf. `EspaceTypeFil` déjà compatible). Demande contenus éditoriaux pour le sous-espace.
- **Location mutualisée (§12)** : composant transversal (bus/car/salle), euros only, avertissement juridique organisateur tampon. Conception UI + conformité Légicoop.
- **Branchement `TeleverseurImage` (V2.0.3) sur les formulaires de création** : `FormulaireCreationOffre`, `FormulaireCreationServiceSEL`, etc. Remplace l'actuel champ « collez votre URL » par un vrai upload. À faire au cas par cas.
- **Branchement `Réservation` (V2.2.2) sur les offres existantes** : transport, hébergement, prêt, SEL. La table `reservation` accepte déjà l'`offre_type` polymorphe ; reste à ajouter le bouton « Demander une réservation » sur chaque page détail.
- **Branchement `FilDeGroupe` (V2.2.1) sur les espaces** : commune (`/agir/communes/[slug]`), campagne, GT thématique. Le composant `<FilDeGroupe espaceType="..." espaceId={...} />` est prêt à monter.

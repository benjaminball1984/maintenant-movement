# Manifest — Chantier V2.5.4 : Master Plan V2.6 Phase C (gabarit riche espaces collectifs)

**Date de fin** : 2026-05-29 (nuit du 29 au 30)
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~10 min (audit + 2 corrections ciblées).

## Constat préalable

L'audit du gabarit des pages d'espaces collectifs montre que la plupart sont DÉJÀ riches : tous ont un fil de discussion (`FilDeGroupe`), un bouton admin, des libellés CMS, et la majorité affiche déjà l'image de couverture. Les vrais manques détectés :

- **Page commune** (`app/(public)/agir/communes/[slug]/page.tsx`) : un commentaire affirmait à tort que la colonne `image_url` n'existait pas. Or elle existe bien dans `commune` (migration `20260520120003`, ligne 29). La page ne l'affichait donc pas.
- **Page fédération** (`app/(public)/agir/federations/[slug]/page.tsx`) : `image_url: null` codé en dur dans `metadataPourPartage`, et aucun affichage de l'image dans le JSX.
- **Page GT thématique** (`app/(public)/co-construire/[slug]/page.tsx`) : OK, affiche déjà l'image.
- **Page groupe entraide local** (`app/(public)/s-entraider/groupes-locaux/[slug]/page.tsx`) : OK, utilise `getImageObjet`.

## Livré

- [x] **Page commune** : ajout de l'affichage de `commune.image_url` en 16/9 avec `next/image`, comme sur la page campagne. Correction du commentaire obsolète qui affirmait à tort que `image_url` n'existait pas. Métadonnée Open Graph mise à jour pour utiliser la vraie valeur (au lieu de `null`).
- [x] **Page fédération** : idem (ajout image 16/9 + correction du metadata).
- [x] **Cohérence visuelle** : les 5 types d'espaces collectifs (campagne, commune, fédération, GT thématique, groupe entraide local) affichent maintenant tous une image de couverture quand elle existe, dans le même format (16/9, rounded-lg, border).

## Non livré (et pourquoi)

- [ ] **Boîte à outils d'action complète** sur chaque espace collectif : le Master Plan §3.1 décrit un « composant d'espace agrégateur universel » qui permettrait depuis n'importe quel espace (commune, GT, fédération, groupe entraide) de lancer une pétition, mobilisation, cagnotte, sondage, événement, mini-blog, fil de discussion, carte. Aujourd'hui, seules les **campagnes** ont vraiment ça via la table `module_campagne` + la fonction `attacherModule`. Pour étendre aux autres espaces, il faudrait soit (a) généraliser `module_campagne` en `module_espace(espace_type, espace_id, cible_type, cible_id)`, soit (b) créer 4 tables filles. C'est un chantier d'ampleur (migration + UI), pas viable en une nuit sans risque. **Reporté** : à programmer comme un chantier V2.6 ou V2.7 dédié, à arbitrer avec Lilou/Ben.
- [ ] **Logo dédié par espace** (différent de l'image de couverture) : la doctrine du Master Plan parle de « image de couverture, logo, bloc descriptif ». Aucune table n'a aujourd'hui de colonne `logo_url` distincte. Soit on considère que `image_url` joue les deux rôles (acceptable, c'est ce que font les autres réseaux sociaux), soit on ajoute des colonnes `logo_url` (additif, conforme à la doctrine de greffe §0.3). À arbitrer aussi.

## Décisions techniques

- **Pas de nouvelle colonne BDD ajoutée** cette nuit : tous les `image_url` existaient déjà. Stricte conformité à la doctrine de greffe §0.3 (additif uniquement, sur décision explicite).
- **Pas de généralisation `module_espace`** : trop gros pour une nuit sans validation.

## Tests

- **918 tests verts** (inchangé).
- **Typecheck** global vert.
- **Lint** propre.

## Notes pour les chantiers suivants

- Les seedings démo V2.5.1 incluent des images Picsum pour `petition`, `mobilisation`, `cagnotte` mais PAS pour `commune` (les 6 communes démo n'ont pas d'image_url). À voir si on enrichit le seeding plus tard. Pour la démo immédiate, les pages commune affichent juste leur description, ce qui reste lisible.
- La **boîte à outils universelle** est un vrai sujet d'architecture (Phase C ambitieuse du Master Plan) qui mériterait son propre chantier explicite avec arbitrage de Lilou/Ben.

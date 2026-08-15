# Manifest — V2.6.123 : suppression de la rubrique « Lives »

**Date de fin** : 2026-06-15
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Durée approximative** : 1 session Claude Code

## Demande Ben (2026-06-15)

« Supprime la catégorie live et tous les contenus live déjà uploadés, n'upload
plus de live dans tes routines. »

## Livré et fonctionnel

### 1. Plus d'import de lives dans les routines
- [x] **Cron Twitch désactivé** : `app/api/cron/import-twitch-lives/route.ts`
  réduit à un no-op explicite (`{ ok, desactive: true }`), plus aucun appel à
  `importerTwitchLives`. Le Worker `maintenant-cron-twitch` est supprimé côté
  Cloudflare (cf. § Déploiement).
- [x] **Format `live` retiré de l'import médias** : `lib/import-medias/`
  - `FormatMedia` = `'podcast' | 'video' | 'dessin'` (plus de `'live'`).
  - Les ~40 chaînes YouTube anciennement taguées `format: 'live'` (Blast, Le
    Média, syndicats, partis, ONG, personnalités…) **basculées en `'video'`** :
    elles continuent d'alimenter les vidéos, rien n'est perdu (elles étaient de
    toute façon stockées en `type='video'` depuis V2.6.116).
  - `SOURCES_PAR_FORMAT` sans clé `live` ; `importerFormat`/`articleExploitable`/
    `telechargerEtInsererMedia` simplifiés (plus de branche live).
  - `app/api/cron/import-medias/route.ts` : `FORMATS = ['podcast','video','dessin']`.
  - `scripts/import-medias-initial.ts` : idem.

### 2. Rubrique « Lives » retirée de l'interface
- [x] `app/(public)/s-informer/media/page.tsx` : `TYPES_ONGLETS` sans `'live'`
  (onglets restants : Rédaction, Dessins, Podcasts, Vidéos). `?type=live`
  n'est plus un filtre valide.
- [x] Sélecteurs de type admin sans « Live » : `EditeurClassementMedia`
  (reclassement inline), `FormulaireEditionMedia` (édition admin),
  `admin/national/medias/page.tsx` (filtre).
- [x] Validations : `'live'` retiré des 3 enums Zod de `lib/validations/media.ts`
  (création / mise à jour / reclassement) → plus aucun moyen de recréer un
  `type='live'`.

### 3. Contenus live existants retirés
- [x] `data-migration/retirer-lives.mjs` (`--lister` / `--appliquer` /
  `--supprimer`) : **24 contenus `type='live'`** trouvés en prod (9 encore
  publiés) → tous passés en **`statut='retire'`** (HTTP 204). RÉVERSIBLE
  (doctrine de greffe : on ne perd pas la donnée). Option `--supprimer` (DELETE
  dur) disponible si Ben veut une purge définitive.

## Choix techniques
- Le type DB `live` (colonne `media.type`, `TypeMedia`) est **conservé** : des
  lignes historiques le portent (retirées). On ne touche pas au schéma
  (additif). Le code d'affichage défensif (`MosaiqueMedias`, `MediaEmbed`)
  garde sa gestion de `live`, devenue branche morte inoffensive.
- Code Twitch (`lib/twitch`, `lib/import-twitch`) conservé **dormant** (non
  appelé), pour réversibilité.

## Vérifications
- **1161 tests verts** (`vitest run`) ; `tsc --noEmit` vert ; Biome propre sur
  les fichiers touchés.
- E2E `tests/e2e/media.spec.ts` recalé : vérifie les onglets réels et l'absence
  de « Lives ».

## Reste / limites
- [ ] Worker `maintenant-cron-twitch` : suppression côté Cloudflare (cf. infra).
- [ ] Code Twitch dormant : à retirer définitivement si Ben confirme ne jamais
  revouloir les directs.

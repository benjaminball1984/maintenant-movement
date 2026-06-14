# Manifest — V2.6.116 : « Lives » = Twitch uniquement + reclassement admin inline

**Date** : 2026-06-14
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (à venir)

## Contexte (demande Ben, 2026-06-14)

En vérifiant en conditions réelles le premier vrai direct Twitch (Valeur
Anarchiste, EN DIRECT), une capture de l'onglet **Lives** a révélé qu'il
affichait **6 cartes pour 1 seul vrai direct** : 5 rediffusions YouTube
(embeds `youtube-nocookie`) titrées « 🔴 » / « [EN DIRECT] » avaient été
classées `live` par l'heuristique de titre (V2.6.114) et **ne se retiraient
jamais** (le cron Twitch ne retire que les `twitch-*`).

Ben a alors demandé la vraie solution durable : **« pouvoir modifier les
types, les tags et catégories en mode admin directement sur chaque
contenu »** (plutôt qu'une correction par script à chaque fois).

## Livré

### 1. `live` réservé aux vrais directs Twitch (correctif d'import)
- `lib/import-medias/importer-medias.ts` : un flux RSS/YouTube ne pouvant PAS
  attester d'un direct EN COURS (il ne sert que des rediffusions, sans statut
  « live »), tout import vidéo/live est désormais stocké en **`video`**. Le
  type `live` n'est plus produit que par `lib/import-twitch` (API Helix temps
  réel, avec retrait automatique à la fin du direct).
- L'ancienne `estLiveDApresTitre` est remplacée par **`nettoyerTitreLive`** :
  on ne devine plus un live, on se contente de RETIRER du titre le badge
  trompeur (🔴, `[EN DIRECT]`, `[LIVE]`, « EN DIRECT : … » en tête) pour une
  rediffusion. Conservateur : ne touche pas au mot « direct »/« live » au fil
  d'une phrase (« directive », « action directe », « alive »).
- Tests : `tests/unit/import-medias/classification.test.ts` réécrit pour
  `nettoyerTitreLive` (3 cas verts).

### 2. Reclassement admin inline (type + tags) sur chaque carte
- Schéma `reclasserMediaSchema` (`lib/validations/media.ts`) : MINIMAL, n'accepte
  que `media_id` + `type` + `tags`.
- Server Action `reclasserMedia` (`app/(public)/s-informer/media/actions.ts`) :
  réservée admin (`estAdminCourant`), n'écrit QUE `type` + `tags` (+ `updated_at`).
  Impossible d'effacer titre/corps/image/source par mégarde (contrairement au
  formulaire complet `mettreAJourMedia`).
- Composant `components/media/EditeurClassementMedia.tsx` (client) : replié =
  bouton « Classer » (icône tag) ; déplié = `<select>` de type (9 valeurs) +
  17 puces de tags à bascule + Enregistrer/Annuler. `router.refresh()` au
  succès.
- Branché sur les 3 cartes de `components/media/MosaiqueMedias.tsx` (une,
  importante, annexe), à côté du bouton « Mettre à la une », visible aux
  admins seulement.

### 3. Données — les 5 faux lives existants
Identifiés (script de secours `data-migration/reparer-faux-lives.mjs`,
`--lister`/`--appliquer`, gitignoré). **Correction laissée à l'admin** via le
nouvel éditeur inline (choix de Ben) : passer chaque carte de Live → Vidéo.
Le correctif d'import (point 1) empêche déjà tout NOUVEAU faux live.

## Logique de prévention (pour ne plus refaire le travail)

| Symptôme | Correctif d'import livré |
|---|---|
| Rediffusion YouTube « 🔴 » classée `live`, jamais retirée, polluant l'onglet Lives | `type` vidéo/live RSS → TOUJOURS `video` ; `live` réservé à Twitch (temps réel + retrait auto). Constat encodé dans le commentaire du code. |
| Badge « 🔴 / [EN DIRECT] » trompeur sur une vidéo enregistrée | `nettoyerTitreLive` nettoie le titre à l'import (et a servi à nettoyer les 5 titres existants). |
| Mauvais type / mauvais tags sur un contenu importé | L'admin corrige en 2 clics sur la carte (`reclasserMedia`), sans script ni risque d'effacement. |

## Vérifications
- `tsc --noEmit` vert ; Biome propre (imports réordonnés).
- Tests `import-medias` verts (3/3).
- Premier vrai direct Twitch vérifié en prod (Valeur Anarchiste) : carte bien
  formée (embed `player.twitch.tv`, vignette CDN Twitch, titre, tags).

## Reste / à faire
- Reclasser les 5 rediffusions (Live → Vidéo) via le nouvel éditeur (Ben, ou
  moi sur feu vert).
- Twitch : agrandir >100 chaînes, corriger les handles invalides, étoffer
  écologie/décroissance + hispanophone (cf. v2-6-115).

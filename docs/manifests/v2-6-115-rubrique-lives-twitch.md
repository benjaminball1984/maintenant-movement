# Manifest — V2.6.115 : rubrique « Lives » alimentée par Twitch

**Date de fin** : 2026-06-14
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (à venir)
**Durée approximative** : 1 session Claude Code

## Contexte (demande Ben, 2026-06-14)

Après le reclassement des faux « lives » YouTube en vidéos (V2.6.114), la
rubrique « Lives » était quasi vide. Ben : Twitch = vrai direct, donc parfait
pour les Lives ; « va chercher les chaînes Twitch engagées… une cinquantaine…
puis dépasse 100 en suivant le réseau de recommandation ». Critères stricts :
gauche radicale / révolutionnaire, féminisme INTERSECTIONNEL, antiracisme,
LGBTQIA+/queer/trans, élu·es à la gauche de la gauche ; pas de personnages
masqués ; féminin ≠ féministe.

## Recherche des sources (3 passages multi-agents)

- 3 workflows successifs (≈ 36 agents) → ~67 chaînes candidates, sourcées
  (Politis, RTBF, StreetPress, DSA, Red Pepper, Socialter, Wikipedia…).
- Validation via l'API Twitch `helix/users` : **59 handles existent** (8
  écartés car orthographe invalide : danyetraz, djelib, krokoku, ultiaa,
  violine__, shiranamioff, berniesanders, tomasrebord — à corriger plus tard).
- Liste complète et sourcée : `docs/sources-twitch-lives-proposition.md`.

## Livré et fonctionnel

- [x] **Adapter Twitch** `lib/twitch/` (pattern projet) : `types.ts`,
  `MockTwitchService` (sans clé → []), `TwitchHelixService` (app token
  client_credentials caché + `helix/streams` par lots de 100), `index.ts`
  (factory selon `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET`).
- [x] **Sources** `lib/twitch/sources-twitch.ts` : 59 chaînes engagées
  (handle, nom, thème, langue). Élargissable (1 ligne).
- [x] **Import** `lib/import-twitch/importer-twitch-lives.ts` : interroge qui
  est EN DIRECT, upsert (fusion sur slug `twitch-<handle>`) des `media
  type='live'` (embed `player.twitch.tv`, vignette du direct, tags auto), et
  RETIRE (statut='retire', réversible) les lives terminés. Slug assaini pour
  le CHECK SQL.
- [x] **Route** `app/api/cron/import-twitch-lives/route.ts` (protégée
  `CRON_SECRET`).
- [x] **Cron** `infra/cron-twitch/` (worker + wrangler) : Worker
  `maintenant-cron-twitch`, toutes les **15 min** (directs éphémères).
- [x] **Lecteur** `components/media/MediaEmbed.tsx` : branche Twitch (ajout du
  paramètre `parent` = domaine, requis par le player Twitch).
- [x] **CSP** `next.config.mjs` : `frame-src` + `player.twitch.tv`, `img-src`
  + `static-cdn.jtvnw.net` (miniatures des directs).
- [x] **Clés** : `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` posées en secrets
  du Worker `maintenant-movement` (et dans `.env.local`, gitignoré) ;
  `CRON_SECRET` posé sur `maintenant-cron-twitch`.

## Comportement

La rubrique « Lives » (et le haut du flux, car `publie_le` = maintenant)
montre les chaînes engagées EN DIRECT à l'instant ; vide quand personne ne
streame (honnête). Les handles invalides sont ignorés par l'API (filet
anti-erreur). Sans clé Twitch, l'adapter mock → rubrique vide.

## Vérifications

- `helix/users` + `helix/streams` testés avec la clé : jeton OK, 59/67 valides.
- `tsc --noEmit` vert ; Biome propre. Workers cron déployés (cron-twitch
  `*/15`).

## Reste / à faire

- [ ] **Agrandir > 100** (demande Ben) : relancer des passes quand le
  rate-limit de recherche sera retombé ; corriger les 8 handles invalides ;
  étoffer écologie/décroissance et hispanophone.
- [ ] Vérifier l'aperçu d'un vrai direct en conditions réelles (au prochain
  live d'une des chaînes).

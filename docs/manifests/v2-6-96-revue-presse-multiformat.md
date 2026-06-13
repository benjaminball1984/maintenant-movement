# Manifest : V2.6.96, revue de presse multi-format (podcasts, vidéos, lives, dessins)

**Date de fin** : 2026-06-13
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare (suite de session)
**Commits** : voir `git log` (analyseur RSS + import-medias ; UI + CSP + cron)
**Durée approximative** : 1 session

## Contexte (demande Ben 2026-06-13)

Étendre la revue de presse de Maintenant Médias (jusque-là des brèves
texte) à quatre nouveaux formats : podcasts, vidéos, lives, dessins de
presse. Sources engagées (féministes, antiracistes, antivalidistes,
LGBTQIA+, décoloniales, écolos, sociales, enfantistes, luttes, philo,
éco, socio, sciences, effondrisme, politique, marxisme, communalisme),
~80 % FR / 20 % international. 27 sources par format puis 9 nouveaux
contenus par format et par jour. Toujours : titre, tags, nom du média
source, renvoi vers la source. Et les 3 logiques d'affichage (à la une,
bandeau rédaction, séparateur « Revue de presse ») sur chaque onglet.

## Livré et fonctionnel

- [x] **Sources validées par Ben** : 3 listes de 27 (podcasts, vidéos+lives,
  dessins), flux vérifiés un par un, dans `docs/sources-podcasts-videos-
  dessins-proposition.md`. Charlie Hebdo exclu (décision Ben), France
  Culture gardé.
- [x] **Analyseur RSS étendu** (`lib/import-breves/rss.ts`, additif) :
  `ArticleFlux` gagne `audioUrl` (enclosure podcast) et `videoId`
  (`yt:videoId` YouTube) ; `extraireImage` capte aussi `itunes:image`
  (pochettes de podcasts). Aucune régression brèves (23 tests verts).
- [x] **Module `lib/import-medias/`** :
  - `sources-medias.ts` : 27 podcasts + 27 vidéos/lives + 27 dessins,
    avec `format` (`podcast`/`video`/`live`/`dessin`).
  - `importer-medias.ts` : import type-aware (audio pour podcast, embed
    YouTube sans cookie pour vidéo/live, image pour dessin), images
    copiées au bucket `media/medias/<format>/` (anti-hotlink), repli
    `og:image` pour les dessins dont l'image n'est pas dans le flux,
    règle 1 source/24 h, rotation déterministe des sources par jour,
    itération sur plusieurs articles par source (le plus récent peut
    échouer), log exhaustif des sources écartées.
- [x] **Peuplement initial** (`scripts/import-medias-initial.ts`) — état
  en base : **41 dessins, 35 podcasts, 27 vidéos, 9 lives** (+ 85 brèves).
- [x] **UI multi-format** :
  - `components/media/MediaEmbed.tsx` (client) : façade vidéo/live
    (vignette + bouton lecture → iframe YouTube sans cookie au clic,
    perf + RGPD) ; lecteur audio HTML5 natif pour les podcasts.
  - `MosaiqueMedias` généralisé aux 4 formats : `VisuelMedia` choisit
    embed / dessin en grand (object-contain) / image ; libellé d'action
    par format (« Écouter / Regarder / Voir sur le site source ↗ »).
  - Page média : TOUS les onglets (brèves, dessins, podcasts, vidéos,
    lives, + types maison) suivent les 3 logiques (une / rédaction /
    séparateur « Revue de presse »). Vérifié en ligne.
- [x] **CSP** (`next.config.mjs`) : `frame-src` autorise
  `youtube-nocookie.com` (embeds), `img-src` autorise `i.ytimg.com`
  (miniatures de repli).
- [x] **Cron quotidien** : route `app/api/cron/import-medias` (9 par
  format, rotation par quantième du jour, `CRON_SECRET`) + Worker
  `maintenant-cron-medias` (déployé, cron `17 5 * * *`, secret posé).
  Endpoint testé en prod : podcast +9, vidéo +9, dessin +9, live 0 (les
  9 sources live venaient d'être peuplées : la règle 1 source/24 h les
  rouvrira le lendemain).

## Non livré (et pourquoi)

- [ ] **Pas de migration** : la table `media` avait déjà `media_url`
  (audio/embed), `vignette_url`, `type`, `tags` — greffe pure.
- [ ] Quelques sources dessins sans flux exploitable (Cartoon Movement,
  Cartooning for Peace : pas d'image extractible ; Siné Mensuel : 403
  anti-bot ; Allan Barte/Gee/Soulcié Mastodon : à reprendre). Compensé
  par le repli og:image (41 dessins obtenus, au-delà des 27 visés).
- [ ] Les podcasts/dessins en format « annexe » (sans vignette) n'ont pas
  le lecteur/visuel : marginal, la quasi-totalité a une image.

## Décisions techniques prises

- Distinction vidéo/live PAR SOURCE (le flux YouTube ne marque pas les
  directs) : médias à diffusion régulière (Blast, Le Média, Au Poste,
  Mediapart, QG, Backseat, Le Canard Réfractaire, Novara, Democracy Now!)
  → `live` ; vidéastes et formats produits → `video`.
- Embed YouTube en façade (pas d'iframe au chargement) : performance (pas
  20 iframes d'un coup) et vie privée (pas de cookie YouTube avant lecture).

## Tests

- 1114 tests verts (analyseur RSS étendu couvert). Lint + typecheck verts,
  hooks pre-commit passés. Build OpenNext + déploiement Cloudflare OK.
- Vérifié en ligne (maintenant-le-mouvement.org) : 4 onglets en 200,
  séparateur « Revue de presse », 20 lecteurs audio, 18+9 façades vidéo
  avec embeds youtube-nocookie, onglet maison sans séparateur.

## Notes pour les chantiers suivants

- Élargir les sources et récupérer les épisodes les plus récents
  régulièrement : prévu par Ben « plus tard » (le cron quotidien assure
  déjà le flux entrant).
- Reprendre les sources dessins en échec (Mastodon, Cartoon Movement).
- Quand la rédaction publiera un podcast/vidéo/dessin maison, il
  deviendra automatiquement la « une » de son onglet (structure déjà là).

# Manifest — V2.6.114 : texte des contenus, faux « lives », catégories (revue de presse)

**Date de fin** : 2026-06-13
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (à venir)
**Durée approximative** : 1 session Claude Code (suite V2.6.113)

## Contexte (retours Ben, 2026-06-13)

1. Un dessin (Basta!, presqu'île de Crozon) n'affichait aucun texte alors que
   l'article source en a.
2. Beaucoup de contenus étaient classés « LIVE » alors que ce sont des vidéos
   normales (ex. « Blocage de Bayer » des Soulèvements de la Terre).
3. Le flux semblait figé (« pas d'import depuis 2 h »).
4. Consigne transverse : « à chaque correction, encoder la logique pour les
   prochains imports, pour ne plus refaire le travail. »

## Diagnostic

- **Texte manquant** : (a) l'analyseur de flux ne lisait pas `<media:description>`
  (texte des vidéos YouTube) ; (b) seules les brèves allaient chercher du texte
  sur la page, pas les dessins/vidéos.
- **Faux « lives »** : la classification se faisait PAR SOURCE (une chaîne
  déclarée « live » marquait tout son contenu en `live`). Le flux YouTube
  n'indique pas le direct.
- **Flux figé** : NON, le cron tournait (imports à 20:33). Le flux est trié par
  date de PUBLICATION ; le cron importe aussi des contenus anciens (décision
  Ben « garder les vieux, en bas »), qui passent sous les récents. Comportement
  attendu, déjà expliqué en V2.6.98. Aucun correctif.

## Livré et fonctionnel

- [x] **Texte des vidéos** : `lib/import-breves/rss.ts` lit désormais
  `<media:description>` (flux YouTube) → les vidéos ont un corps.
- [x] **Texte des dessins/articles** : `lib/import-breves/importer.ts` expose
  `chercherDescriptionArticle` (méta `og:description` = résumé PROPRE du site) ;
  `lib/import-medias/importer-medias.ts` l'appelle quand le corps est court.
- [x] **Classification live/vidéo par le TITRE** :
  `importer-medias.ts:estLiveDApresTitre` (🔴, « en direct », « live »,
  « [direct] »…). On ne marque `live` que si le titre le signale, sinon
  `video` (+ 5 tests unitaires).
- [x] **Catégories** : ajout de `violences sexuelles` / `violences sexistes` /
  `agression(s) sexuelle(s)` au tag Féminismes (le dessin Crozon était classé
  « Politique »). (Le resserrement de `agricol` + `nitrate` datait de V2.6.113.)
- [x] **Correction de l'existant (prod, réversible)** :
  `data-migration/reparer-medias-revue.mjs` (`--lister`/`--appliquer`) :
  40 faux « lives » repassés en `video` ; 97 dessins/podcasts re-textés depuis
  `og:description` ; puis `scripts/retaguer-medias.ts --tout` a recalculé les
  catégories.

## Incident corrigé en cours de route (honnêteté)

Un PREMIER essai de remplissage du texte raclait les paragraphes `<p>` de la
page et a ramassé l'encart de don de Basta! (« …le RN rêve de 2027… faites un
don ») sur ~16 contenus → faux tags « Extrême droite / Tech et IA ». Repéré et
corrigé : on n'utilise plus le raclage de `<p>` mais la méta `og:description`
(résumé propre), côté import ET dans le nettoyage de l'existant. Feu vert
explicite de Ben avant l'écriture corrective en prod.

## Logique de prévention (pour ne plus refaire) — consigne Ben

| Défaut constaté | Correctif données (one-shot) | Prévention encodée à l'import (durable) |
|---|---|---|
| Doublon vidéo/brève (V2.6.113) | `dedup-medias.mjs` | `fusionnerDansVideoMemeSujet` (brèves) + `chercherBreveMemeSujet` (médias) |
| Mauvaise catégorie (agricol, féminisme) | `retaguer-medias.ts --tout` | banque `tags.ts` corrigée (mots-clés) → les futurs imports taguent juste |
| Texte manquant (vidéo) | `reparer-medias-revue.mjs` | `rss.ts` lit `media:description` |
| Texte manquant (dessin/article) | `reparer-medias-revue.mjs` | `importer-medias.ts` → `chercherDescriptionArticle` (og:description) |
| Faux « live » | `reparer-medias-revue.mjs` | `estLiveDApresTitre` dans `importer-medias.ts` |

Règle adoptée : aucune correction de données n'est livrée sans son correctif
d'import correspondant + cette rubrique dans le manifest.

## Vérifications

- Unitaires : **1142 tests verts** (`vitest run`), dont les tests `doublons`
  (13) et `classification` (5). `tsc --noEmit` vert ; Biome propre.
- Prod : doublons = 0 ; faux lives reclassés ; textes nettoyés (vérifié sur le
  dessin Crozon → Féminismes).

## Reste / limites

- [ ] Le tagging par mots-clés reste imparfait sur les contenus à thèmes
  multiples ; éditable en admin.
- [ ] La rubrique « Lives » est désormais quasi vide (peu de vrais directs sur
  les flux YouTube). Chantier suivant demandé par Ben : alimenter les Lives
  avec des chaînes Twitch engagées (~50 sources).

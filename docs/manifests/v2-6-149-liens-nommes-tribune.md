# Manifest : V2.6.149, liens nommés dans les articles et chapô de la tribune du 17 octobre

**Date de fin** : 2026-09-24
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Durée approximative** : une partie de session

## Contexte

Demande de Lilou/Ben, alignée sur 26septembre.org et 17octobregiletjaune.net : la tribune « Fin du monde, fin du mois : le 17 octobre nous serons là ! » doit s'ouvrir sur un chapô qui dit « Voici un appel issu de la coordination nationale du mouvement du 26 septembre » (et non « la coordination appelle » : toute la coordination n'a pas signé), avec « Regards » et « Basta! » cliquables dès cette première phrase. L'illustration de Regards est retirée, seule la photo de Basta! reste.

## Livré et fonctionnel

- [x] **Liens nommés dans le corps** (`app/(public)/s-informer/media/[slug]/page.tsx`, `CorpsAvecLiens`) : en plus des adresses nues, la notation `[mot](https://…)` fait du mot un lien (nouvel onglet, `noopener noreferrer`). Le corps reste du texte brut, aucune porte ouverte au HTML.
- [x] **Texte sans adresses ailleurs** (`lib/media/liens.ts`, `texteSansLiens`) : extraits de la revue (`MosaiqueMedias`), une de l'accueil (`lib/home/une.ts`), flux RSS (`app/feed.xml`) et aperçus de partage gardent le mot et jettent l'adresse, pour ne jamais afficher de crochets.
- [x] **Article modifié en base de production** (feu vert de Lilou/Ben) : chapô ajouté en tête du corps, `vignette_url` = photo de Basta!, `media_url` = null (illustration de Regards retirée), crédit photo en fin de texte réécrit en conséquence. Le fichier de l'illustration de Regards reste dans le bucket `media/tribunes/`.
- [x] Déployé et vérifié en ligne (version Worker a091ab44) : deux liens cliquables dans le chapô, une seule image (Basta!), description de partage sans crochets.

## Contenus à arbitrer

- [ ] Aucun nouveau. Reste celui de V2.6.148 : l'article est signé « Rédaction ».

## Tests

- Typecheck vert, Biome vert sur les fichiers modifiés.
- Suite complète et Playwright non relancées pour ce correctif d'affichage.

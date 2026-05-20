# Manifest : Phase 7, Chantier 7.2 — Maintenant Radio (player AzuraCast)

**Date de fin** : 2026-05-21
**Branche** : `feature/phase-7-chantier-7.2-radio`
**Commit final** : `31e1b1e`
**Durée approximative** : 1 session Claude Code (chantier court)

---

## Livré et fonctionnel

- [x] **`<PlayerAzuraCast>`** : composant client. Élément `<audio>` natif (pas de bibliothèque, léger + accessible). Bouton play/pause stylé brand, slider volume, refresh des métadonnées AzuraCast `nowplaying` toutes les 30 s, gestion d'erreur silencieuse.
- [x] **`/s-informer/radio`** : page qui rend le player si `AZURACAST_FLUX_URL` est définie, sinon une bannière info « radio pas encore branchée ». Section pédagogique « Pourquoi AzuraCast auto-hébergé » reprend la doctrine §4B (pas de captation par plateformes).
- [x] **Variables d'env** : `AZURACAST_FLUX_URL` + `AZURACAST_METADATA_URL` optionnelles. Tant qu'elles ne sont pas posées, la radio reste à l'état stub explicite.
- [x] **Tests E2E** : 2 scénarios (rendu + bannière mock).
- [x] **Lint Biome + typecheck tsc + build Next.js** : tous verts. 238 tests unitaires (inchangés).

## Livré partiellement

Aucun. Le chantier est minuscule (player + variables d'env), il est entièrement livré côté code.

## Non livré (et pourquoi)

- [ ] **Hébergement effectif d'AzuraCast** : nécessite un serveur dédié (cohérent avec la doctrine « auto-hébergé »). Sera posé au chantier 11.3 ou par Lilou/Ben en infra.
- [ ] **Programme hebdomadaire** : pas de table `emission_radio` car AzuraCast gère la programmation côté serveur (panneau d'admin AzuraCast). On expose juste le flux + métadonnées côté site.

## Contenus à arbitrer

Aucun. Microcopy fonctionnelle.

## Décisions techniques prises

- **`<audio>` natif** plutôt que `react-audio-player` ou similaire : suffit pour un flux Icecast/HLS, plus léger, accessibilité native garantie (lecteur d'écran, contrôles clavier).
- **Pas de table BDD** : la programmation, les métadonnées et les archives d'émissions vivent côté AzuraCast (panneau d'admin). On consomme juste l'API `nowplaying` JSON.
- **Stub explicite par défaut** : tant qu'AzuraCast n'est pas branché, on affiche un état honnête plutôt qu'un player qui plante.

## Tests

- E2E Playwright : 2 scénarios (page rendue + bannière mock visible).
- Tests unitaires : **238 verts** (inchangés).
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **Chantier 11.3 (Lancement)** : héberger l'instance AzuraCast, définir les variables d'env en prod, brancher.
- **Polish** : si la programmation hebdo doit s'afficher dans le site (et pas uniquement dans AzuraCast), créer une vue qui consomme l'API `schedule` d'AzuraCast.

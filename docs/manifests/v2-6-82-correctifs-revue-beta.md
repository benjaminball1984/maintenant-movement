# Manifest : V2.6.82, Correctifs de la revue bêta du site en production

**Date de fin** : 2026-06-11
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Contexte** : revue « utilisateur exigeant » du site en production (maintenant-le-mouvement.org) menée le 2026-06-11 avec captures d'écran et vérifications DOM. Ben a arbitré : ne rien masquer, ne rien dépublier (il fait le peuplement), appliquer tous les correctifs techniques, importer les membres avec dédoublonnement.

## Livré et fonctionnel

### Bloquants
- [x] **Signature de pétition réparée** (bug bloquant : personne ne pouvait signer). Cause : le widget Turnstile vit dans le DOM dès le chargement (le `<dialog>` existe avant ouverture), se valide AVANT le premier clic, puis `ouvrir()` faisait `reset(token_turnstile: '')` et le widget ne rappelle jamais son callback. Correctif : `ModaleSignaturePetition` garde le dernier jeton dans une ref et le préserve au reset ; `CaptchaTurnstile` relance automatiquement le challenge à l'expiration du jeton (~5 min) pour tous les ~30 formulaires.
- [x] **Cartes débloquées** : la CSP `connect-src` bloquait les tuiles CARTO (`*.basemaps.cartocdn.com`), les glyphs MapLibre (`demotiles.maplibre.org`) ET les tuiles OSM de la carte unifiée (MapLibre télécharge tout en fetch, pas en `<img>`). Domaines ajoutés dans `next.config.mjs` (connect-src + img-src).
- [x] **Compteur « Membres » : 1 → 470**. Découverte : les 470 membres Base44 (dédoublonnés par email, plus ancienne occurrence conservée) étaient DÉJÀ importés dans `personne` + auth.users sur le distant ; il manquait les lignes `adhesion` que compte la RPC `compter_membres_actifs`. Nouveau script `scripts/backfill-adhesions-import.ts` (--dry-run/--confirm, idempotent) : 469 adhésions `gratuit` créées (debute_le = 2026-06-11, expire dans 365 j). Vérifié : RPC = 470. Aucune donnée existante modifiée.

### UX et contenus
- [x] Modale de signature **préremplie** (prénom, nom, email, code postal) pour les personnes connectées, via `lib/auth/prefil-signature.ts`, branchée sur la fiche pétition et la une de l'accueil. Champs téléphone et code postal CONSERVÉS (consigne Ben).
- [x] Encart « Pas encore connecté·e ? » de /s-informer affiché uniquement si non connecté.
- [x] En-têtes d'espace : le collage « ESPACES'informer » et l'intro qui s'enroulait autour des titres courts (Agir, Comprendre) ne touchaient QUE le rendu admin (wrapper inline-block de `TexteEditableAdmin`). Nouvelle prop `bloc` appliquée aux en-têtes des 4 hubs + cartes Comprendre.
- [x] /comprendre : les cartes affichaient l'URL technique (« /comprendre/monnaie ») ; remplacée par des descriptions courtes éditables CMS (`comprendre.carte.*.description`).
- [x] /s-entraider : surtitre « Espace » ajouté, apostrophe typographique dans le titre, sommaire latéral passé APRÈS le titre sur mobile (order-*).
- [x] Dé-jargonnage des pages publiques (fallbacks code) : « messagerie interne au chantier 7.5 », « sous-feature à venir » (x2), « rappel doctrine §4C », « Coûts API ~0,023 $ Claude Haiku 4.5 », « LiveKit self-hosted… chantier dédié », « Filtres dans l'URL ?jour=… », « Cf. doctrine §8 », « une modale de gestion s'ouvre », « testnet Mumbai en dev », « V1 d'export PDF print-ready ». Reformulations sobres, tout reste éditable CMS.
- [x] Page Adhérer : fautes corrigées dans la clé CMS `agir.adherer.intro` en base (« aux décisions, du mouvement » → sans virgule ; « les même droits » → « les mêmes droits ») + CTA « Choisir ce chemin → » et hover sur les 3 cartes-chemins.
- [x] `MarkdownLeger` rend désormais les liens `[texte](url)` (internes « / » et https externes uniquement ; javascript:/data:/http:/mailto laissés en texte brut ; pas de dangerouslySetInnerHTML). Répare le lien brut des mentions légales. 11 tests.
- [x] Mentions légales : « Cloudflare Pages » → « Cloudflare Workers ».
- [x] Images : redimensionnement client à l'upload (`lib/image-redimensionner.ts`, 1600 px max, JPEG 0.85) branché dans `TeleverseurImage` ; refus des URLs d'images à CDN éphémère (fbcdn.net, cdninstagram.com, fbsbx.com) via `estUrlImageDurable` sur les 10 champs image_url libres (cause de l'image cassée de la pétition Fichiers Epstein).
- [x] Vignettes de recherche : `image_url` sélectionné/mappé pour commune, fédération, sondage ; icône discrète à la place du carré vide.
- [x] 404 : liens vers les 5 espaces ajoutés.
- [x] « Voir tout le média » → « Voir Maintenant Médias » (vocabulaire fixé) ; « Peertube » → « PeerTube ».
- [x] Taux T99CP : déjà aligné dans le code (1 T99CP = 1 € = 100 centimes) ; seul le JSDoc datait la décision au 30/05, corrigé au 2026-06-11 (décision confirmée par Ben : 1 T99CP = 1 € = 1 minute).

## Écritures sur le distant (autorisées explicitement par Ben)
- 469 INSERT dans `adhesion` (backfill, voir ci-dessus). Aucun UPDATE/DELETE.
- 1 UPDATE de `contenu_editorial.agir.adherer.intro` (correction de 2 fautes, sens inchangé).

## Non livré (et pourquoi)
- [ ] **Alias emails contact@/adhesion@/presse@/dpd@** : les MX du domaine pointent vers IONOS (mx00/mx01.ionos.fr), pas Cloudflare ; le jeton API Cloudflare n'a de toute façon pas le droit Email Routing (403). **À faire par Ben dans le panneau IONOS** : Email, créer 4 redirections (alias) vers benjamin.ball@maintenant-le-mouvement.org. Tant que ce n'est pas fait, ces adresses publiées sur /contact rebondissent.
- [ ] Pétitions placeholder ([TITRE À METTRE] x4, doublon Epstein, image fbcdn morte) : peuplement par Ben (consigne explicite : ne rien dépublier).
- [ ] Lorem ipsum des pages éditoriales (FAQ, Monnaie, Ressources, Doctrine, À propos) : rédaction par Ben.
- [ ] Politique de confidentialité : mentionner le téléphone optionnel collecté à la signature (le champ est conservé sur décision Ben ; c'est le texte de la politique qu'il faut compléter, pas le champ qu'il faut retirer).

## Contenus à arbitrer
- `s-entraider/layout.tsx` : le surtitre « Espace » et le titre « S'entraider » ont le même style (deux petites lignes) ; harmonisation visuelle à décider (promouvoir le titre en grand comme les autres hubs ?).
- Tutoiement des états vides (« Annonce la prochaine », « Ouvre la première ») : cohérent avec le ton du site ? (constat de revue, pas de changement fait).

## Tests
- Unitaires : **1045 tests verts** (1030 + 15 nouveaux : 4 estUrlImageDurable, 11 MarkdownLeger liens).
- Lint Biome : propre (18 warnings préexistants inchangés). Typecheck : vert.
- `vitest.config.ts` : ajout `esbuild.jsx: 'automatic'` (nécessaire au test de rendu du Server Component MarkdownLeger).
- Vérification navigateur post-déploiement : voir section suivante du manifest (complétée après déploiement).

## Notes pour les chantiers suivants
- Le renouvellement auto du jeton Turnstile expiré est centralisé dans `CaptchaTurnstile` : ne pas re-gérer l'expiration dans les formulaires.
- La prop `bloc` de `TexteEditableAdmin` est disponible pour tout contenu de bloc : à poser si d'autres collages admin-only apparaissent.
- `data-migration/_extraction-signature-export/` contient l'export Base44 final des signatures (218 658 lignes, 2026-05-24) : source de vérité si une réconciliation des signatures est un jour nécessaire (dossier gitignoré, PII).

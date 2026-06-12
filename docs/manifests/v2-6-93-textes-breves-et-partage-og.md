# Manifest : V2.6.93, textes de brèves (entités + 6 lignes minimum) et partage réseaux sociaux

**Date de fin** : 2026-06-12
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare (suite de session)
**Commits** : aac53fa (textes de brèves), 069fa2b + e01c782 (partage OG)
**Durée approximative** : 1 session

## Contexte (demandes Ben du jour)

1. « Aucune brève ne doit avoir moins de 6 lignes de texte » et « attention
   aux erreurs d'import de texte avec des caractères chelou » (exemple
   fourni : « d&rsquo;herbicide. © Esteban Grépinet/Vert »).
2. « Les pétitions, articles, mobilisations ne s'affichent pas bien dans le
   partage Messenger : vérifier sur l'ensemble des réseaux qu'il y a titre,
   image et quelques lignes. »

## Livré et fonctionnel

### Textes de brèves (lib/import-breves/)

- [x] **Décodage complet des entités HTML** (`rss.ts`) : table d'une
  soixantaine d'entités nommées (typographie « &rsquo; &laquo; &hellip; »,
  accents « &eacute; &ccedil; », symboles « &euro; &deg; ») en plus des
  numériques ; DEUX passes de décodage pour résoudre les doubles encodages
  des flux (« &amp;rsquo; »). Les légendes d'images (`<figcaption>`, crédits
  photo « © Untel/Agence ») sont retirées AVEC leur contenu.
- [x] **Minimum ~6 lignes par brève** (`importer.ts`) : constante
  `MIN_CARACTERES_EXTRAIT = 360` (~60 caractères par ligne affichée). Quand
  la description du flux est trop courte, l'import ÉTOFFE depuis les
  paragraphes `<p>` de la page de l'article (`chercherTexteArticle` +
  `extraireParagraphes`, blocs hors article écartés). Un article dont on ne
  peut pas tirer 360 caractères est écarté (le cron tire une autre source).
- [x] **Réparation des 41 brèves en production**
  (`data-migration/reparer-texte-breves.mjs`, hors git) : 8 nettoyées
  d'entités (Regards, QG Média, Vert, El País, Le Grand Continent), 16
  étoffées depuis leur page d'article (212-310 → 441-650 caractères).
- [x] 5 nouveaux tests unitaires (entités nommées, doubles encodages,
  figcaption, extraireParagraphes). **1111 tests verts.**

### Partage réseaux sociaux (Open Graph)

Audit : 20 des 23 pages de détail publiques passaient déjà par le helper
central `metadataPourPartage` (V2.2.4) avec titre + description + image.
Corrections des manques :

- [x] **Image par défaut de TOUT le site** (`app/layout.tsx`) : le bloc
  Open Graph racine n'avait AUCUNE image ; ajout du logo (PNG 1147x1371)
  + carte Twitter par défaut. Toute page sans Open Graph propre hérite
  désormais d'un aperçu complet.
- [x] **Images SVG remplacées pour le partage** (`lib/og-metadata.ts`) :
  les robots de partage (Facebook/Messenger, X, WhatsApp, LinkedIn) ne
  lisent pas le SVG ; quand l'image résolue est `profil.svg` ou
  `generique.svg`, le helper sert le logo raster à la place.
- [x] **3 pages branchées sur le helper** : salle Décider, réunion Décider,
  agenda par type (elles ne renvoyaient que titre + description).
- [x] **Espaces normalisés dans les descriptions OG** : un retour à la
  ligne dans la description produisait une balise meta multi-lignes
  (constaté sur une mobilisation importée de l'Agenda Militant).
- [x] **Vérifié en prod avec le User-Agent facebookexternalhit** sur chaque
  type : home, pétitions (cuba, antifasciste), mobilisation, sondage
  présidentielle, article média, page média, agenda, réseau : titre +
  description + image présents partout, toutes les images répondent 200.

## Non livré (et pourquoi)

- [ ] **4 brèves restent sous les 6 lignes** : 2 Libération (Stellantis,
  Coupe du monde) + 2 New York Times (Hockney, SpaceX). Leurs pages article
  sont inaccessibles aux robots (403) et leurs flux ne donnent pas plus de
  texte. ARBITRAGE BEN : les supprimer (règle stricte) ou les garder (elles
  ont leur vraie image depuis V2.6.92 et le nouveau format annexe/important
  les affiche correctement). En attendant, elles restent en ligne.
- [ ] **Cache de Facebook** : le mauvais aperçu Messenger constaté par Ben
  sur la pétition Cuba venait vraisemblablement du cache du robot Facebook
  (la pétition a été recréée le jour même ; Facebook garde son aperçu ~30
  jours). Les balises servies sont correctes et vérifiées. Pour forcer le
  rafraîchissement : https://developers.facebook.com/tools/debug/ (coller
  l'URL, bouton « Scrape Again »), nécessite un compte Facebook.

## Décisions techniques prises

- Minimum fixé à 360 caractères (~6 lignes de ~60 caractères sur les cartes
  de la mosaïque). Pré-filtre du cron laissé à 40 caractères : une
  description courte peut être étoffée depuis la page, la règle finale est
  tranchée à l'insertion.
- L'import Agenda Militant n'a PAS été modifié : il exige déjà une vraie
  affiche (les événements sans image sont écartés depuis V2.6.87).

## Tests

- Unitaires : 1111 verts (+5). Lint + typecheck verts, hooks pre-commit OK.
- Vérification en ligne post-déploiement (maintenant-le-mouvement.org) :
  brèves étoffées visibles, balises OG complètes sur 9 URL de types
  différents, images OG en 200.

## Notes pour les chantiers suivants

- Si Ben tranche « supprimer » pour les 4 brèves courtes : un DELETE par id
  via le pattern de `reparer-texte-breves.mjs` (les id sont listés par
  `--lister`).
- Les flux cassés signalés au V2.6.90 (Politis, Haaretz, Arrêt sur images,
  Afrique XXI) restent à réparer.

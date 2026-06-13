# Manifest — V2.6.111 : mosaïque de couverture générée automatiquement pour chaque sondage

**Date de fin** : 2026-06-13
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (à venir)
**Durée approximative** : 1 session Claude Code

## Contexte (demande Ben, 2026-06-13)

« Faire en sorte que les sondages produisent systématiquement une mosaïque, du
même type que celle du sondage présidentielle : les différentes images des
options + une insertion du titre ; cette image sert de couverture, de
miniature et d'aperçu de partage. »

Arbitrages de Ben (AskUserQuestion) :
- Style quand une option n'a pas de photo : tuiles portant le texte des
  options, avec le titre en bandeau au-dessus.
- Mécanisme : génération AUTOMATIQUE (jamais un bouton à cliquer), avec une
  alternative : le créateur peut téléverser sa propre image, qui remplace
  alors la mosaïque.

## Décision technique (prise par l'agent, expliquée à Ben en clair)

La mosaïque présidentielle avait été fabriquée UNE seule fois par un script
Node local (`data-migration/creer-sondage-presidentielle.mjs`) avec `sharp`,
un binaire natif qui NE tourne PAS sur Cloudflare Workers (l'hébergement de
prod via OpenNext). Pour une génération « systématique » en production, on
génère donc la mosaïque CÔTÉ NAVIGATEUR avec `<canvas>` (zéro dépendance, le
même procédé que `lib/image-redimensionner.ts` qui réduit déjà les photos
avant envoi), puis on la téléverse par le canal existant (Server Action
`televerserImage`). Aucune dépendance ajoutée, rien de fragile.

Le système lisait DÉJÀ `sondage.image_url` pour les TROIS usages : couverture
de la fiche, miniature des cartes de liste, et `og:image` de partage (via
`lib/og-metadata.ts:metadataPourPartage`). Remplir ce champ avec la mosaïque
générée couvre donc les trois d'un coup, sans rien changer à l'affichage.

## Livré et fonctionnel

- [x] `lib/sondages/mosaique-layout.ts` : géométrie PURE et testée. Grille
  selon le nombre d'options (1 ligne jusqu'à 3, 2 lignes jusqu'à 18, 3 au-delà,
  comme le 9x2 présidentiel) ; cellules avec centrage horizontal d'une
  dernière ligne incomplète ; hauteur de bandeau adaptative (1 à 4 lignes de
  titre) ; découpage de texte en lignes avec ellipse, via une fonction de
  mesure injectée (testable sans DOM).
- [x] `lib/sondages/mosaique-canvas.ts` : générateur navigateur. Bandeau de
  titre auto-dimensionné + filet d'accent rose + sous-titre ; chaque tuile =
  la photo de l'option (recadrage « cover », biais vers le haut) si elle
  existe, sinon une tuile colorée avec le numéro et le libellé. Robuste :
  photos chargées en `crossOrigin=anonymous` (bucket Supabase public),
  REPLI en tuiles texte si le canvas est « taché » par CORS, et `null` en
  dernier recours (l'image par défaut prend alors le relais). Sortie JPEG
  1200x630 (format Open Graph).
- [x] `components/sondages/FormulaireCreationSondage.tsx` : à la soumission,
  si aucune image de couverture n'a été téléversée, la mosaïque est générée
  puis téléversée automatiquement (`role=couverture`, préfixe
  `sondages/couvertures`) et passée en `image_url`. Une image fournie par la
  personne reste prioritaire. Libellé/aide du champ mis à jour ; message
  d'avancement « Création de la couverture (mosaïque)… ».
- [x] Couverture + miniature + aperçu de partage suivent automatiquement
  (tous lisent `image_url`, aucun changement d'affichage ni d'OG nécessaire).

## Vérifications

- Unitaires : **1126 tests verts** (`npx vitest run`), dont 12 nouveaux sur
  `mosaique-layout` (grille, cellules + centrage + gouttière, bandeau,
  interligne/taille, découpage de lignes avec ellipse).
- `tsc --noEmit` : vert. Biome : propre sur les fichiers touchés.
- Visuel : le VRAI code a été rendu dans Chromium (Playwright) sur 3 cas (sans
  photo, avec photos, mixte). Titre en bandeau lisible, tuiles texte nettes
  (numéro jaune + libellé blanc + filet rose), photos recadrées proprement,
  cas mixte correct. La page et le script d'aperçu temporaires ont été
  supprimés après le contrôle.

## Comportement et bornes

- Génération automatique à la CRÉATION uniquement : il n'existe pas de
  formulaire d'édition de sondage (la modération admin ne fait que retirer).
- Alternative voulue par Ben : téléversement d'une couverture personnalisée,
  prioritaire sur la mosaïque.
- Dégradation propre : si la génération échoue (canvas indisponible, CORS,
  image illisible), le sondage est créé quand même et l'image par défaut
  (`/defaults/sondage.jpg`) sert de couverture.

## Reste / à arbitrer

- [ ] Sondages DÉJÀ en ligne : le présidentielle garde sa mosaïque actuelle.
  Les éventuels autres sondages publiés avant ce chantier sans couverture ne
  sont pas rétro-générés (pas de flux d'édition). Un script de rattrapage
  (écriture sur le distant = porte, feu vert Ben requis) peut les couvrir d'un
  coup ; à faire sur demande.
- [ ] Le sous-titre « Sondage · maintenant-le-mouvement.org » incrusté dans
  l'image n'est pas éditable via CMS (c'est du contenu d'image, comme la
  mosaïque présidentielle). Réglable dans la constante `SOUS_TITRE` du module.
- [ ] Déploiement : implémenté et vérifié EN LOCAL, pas encore commité ni
  déployé. `cf:deploy` vers maintenant-le-mouvement.org au feu vert de Ben.

## Notes pour les chantiers suivants

- La palette de la mosaïque est centralisée dans `mosaique-canvas.ts` (miroir
  des teintes validées du présidentiel) ; à brancher sur les design tokens si
  on veut une source unique de couleurs.
- La géométrie pure (`mosaique-layout.ts`) est partageable avec un éventuel
  script Node de rattrapage (le dessin diffère, `sharp` vs `canvas`, mais la
  mise en page est commune).

# Manifest — V2.6.113 : dédup vidéo/brève + catégories de la revue de presse

**Date de fin** : 2026-06-13
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (à venir)
**Durée approximative** : 1 session Claude Code (suite V2.6.111-112)

## Contexte (demande Ben, 2026-06-13)

Sur la page Maintenant Médias, une **vidéo** et une **brève texte** font parfois
doublon (même source, même sujet). Demande : dans ce cas, **une seule carte =
la vidéo + 6-7 lignes de texte dessous** (pas deux contenus) ; **détecter ce
cas automatiquement à l'avenir et y remédier** ; **vérifier qu'il n'y a pas
d'autres cas** ; et **mettre les bonnes catégories** sur les contenus (un fait
divers judiciaire était tagué « Écologie »).

## Cause des deux symptômes

- **Doublon non détecté** : la dédup d'import ne comparait que le `source_url`
  exact (différent entre la page vidéo et la page article) et restait par
  format. Elle ne voyait pas que vidéo et brève sont le même sujet.
- **Mauvaise catégorie** : le mot-clé `agricol` (banque de tags) matchait
  « site agricole » (lieu d'un crime) → faux « Écologie ». Et la vidéo (corps
  vide) tombait sur le tag par défaut « Politique », d'où l'incohérence avec sa
  brève jumelle.

## Livré et fonctionnel

- [x] **Détection pure** `lib/media/doublons.ts` (+ 13 tests) : comparaison de
  titres par **coefficient de recouvrement** (gère préfixe « Nom : » et suffixe
  « [EXTRAIT] »), gardes-fous **même source** + **fenêtre de dates** + minimum
  de mots communs, et **garde-fou anti faux-positif** : on ne fusionne que si
  le groupe mélange deux formats (vidéo + brève) OU si les titres sont
  strictement identiques (vrai ré-import). On garde le plus riche (vidéo/live >
  podcast > brève > dessin).
- [x] **Vérification + correction de l'existant** : `data-migration/dedup-medias.mjs`
  (`--lister` lecture seule / `--appliquer`). 4 doublons réels trouvés (le faux
  positif « 2 dessins Basta! » a été écarté par le garde-fou) : Le Média (live),
  Frustration Magazine (vidéo), Là-bas si j'y suis (vidéo), Télé Millevaches
  (vidéo importée 2×). Appliqué : **3 vidéos/lives enrichis** du texte de la
  brève, **4 doublons retirés** (`statut='retire'`, RÉVERSIBLE, rien d'effacé).
- [x] **Bonnes catégories** : `agricol` (nu) remplacé par des termes ciblés
  (`agriculture` mot entier, `agro industrie`, `agro alimentaire`, `agrochimie`,
  `monoculture`) + ajout de `nitrate` (récupère la pollution agricole, vraie
  écologie) dans `lib/import-breves/tags.ts`. `scripts/retaguer-medias.ts`
  gagne un mode `--tout` (recalcule les tags de TOUTE la revue de presse depuis
  titre+corps, n'écrase jamais les tags éditoriaux des contenus maison). **15
  contenus re-tagués** en prod (dont les 3 vidéos fusionnées, désormais
  catégorisées d'après leur texte).
- [x] **Prévention à l'avenir (à l'import)** : `lib/import-breves/importer.ts`
  (`fusionnerDansVideoMemeSujet`) : avant de créer une brève, si une vidéo/live
  récente de la même source porte le même sujet, on verse le texte dans la
  vidéo et on ne crée pas la brève. Symétrique dans
  `lib/import-medias/importer-medias.ts` (`chercherBreveMemeSujet`) : une
  vidéo/live importée absorbe le texte d'une brève jumelle récente et la
  retire. Tout réutilise `comparerTitres` (même logique que la détection).
- [x] **Affichage** : aucun changement nécessaire. `CarteImportante` rend déjà
  `corps` en `line-clamp-[7]` (6-7 lignes) sous la vidéo ; il manquait juste le
  texte, désormais versé par la fusion.

## Vérifications

- Unitaires : **1139 tests verts** (+13 sur `doublons`). `tsc --noEmit` vert.
  Biome propre (warnings de style préexistants seulement).
- Diagnostic exécuté en lecture seule d'abord (liste montrée et validée), puis
  fusion + recalcul appliqués en prod (opérations réversibles).

## Reste / limites

- [ ] Le tagging reste **par mots-clés** : il demeure imparfait sur quelques
  contenus dont le texte évoque plusieurs thèmes (ex. une salle de concert dont
  l'article touche d'autres sujets) ; ces cas sont **éditables en admin**
  (`mettreAJourMedia`).
- [ ] Détection de doublon : fenêtre 4 jours, seuil de recouvrement 0,75, même
  source. Réglable dans `lib/media/doublons.ts` et les deux importeurs si Ben
  constate un cas limite.

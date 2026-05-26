# Prompt d'amorce Claude Code — Cycle V2 Maintenant!

> **Fichier** : 04-PROMPT-AMORCE-CLAUDE-CODE.md
> **Date** : 2026-05-26 (soir). Signature : LIFE BENJAMIN BALL.
> **Usage** : Lilou/Ben copie le bloc ci-dessous dans Claude Code, au démarrage d'une session, après avoir déposé le pack CDC V2 et ces documents dans le repo. C'est l'amorce du cycle V2.

---

## Mode d'emploi (pour Lilou/Ben, à ne pas coller)

1. Déposer dans le repo : le pack `CDC-Maintenant-V2/` (les 24 fichiers) + ces 5 documents (`00` à `04`), par exemple sous `docs/cdc-v2/`.
2. Coller le bloc ci-dessous dans Claude Code.
3. Laisser Claude Code travailler la VAGUE 0. Lire le MANIFEST en fin de chantier.

---

## ▼▼▼ PROMPT À COLLER ▼▼▼

Bonjour. On ouvre le cycle V2 du site Maintenant!. Avant tout code, lis dans cet ordre et intégralement :

1. `docs/cdc-v2/00-PRESEANCE-CLAUDE-MD.md` (la règle de préséance et la doctrine de greffe : c'est la consigne la plus haute, au-dessus du reste du CLAUDE.md).
2. `CLAUDE.md` (ton persona, l'exhaustivité, le MANIFEST, les conventions, le vocabulaire : tout ça reste valable).
3. `docs/cdc-v2/01-REVUE-ECARTS-V1-V2.md`, `01b-EXIGENCES-TRANSVERSALES-UI.md`, `02-PONT-V1-V2.md`, `03-PLAN-IMPLEMENTATION.md`.
4. Le pack CDC V2 lui-même (`principes-transversaux-V2.md` d'abord, puis `schema-donnees-V2.md`, `matrice-droits-V2.md`, puis les fiches).

Trois lois absolues, qui priment sur toute autre considération :

- **On additionne, on ne soustrait jamais.** Aucun `DROP` de table ou de colonne portant des données. Une colonne devenue historique est conservée comme source de vérité du passé.
- **On backfill, on ne réinitialise jamais.** Aucun compteur remis à zéro. Les 17 746 signatures restent 17 746, les 15 737 profils restent 15 737, les 35 011 communes restent 35 011. Tout script de backfill a `--dry-run` obligatoire + confirmation explicite avant écriture.
- **Le grand modèle V2 (tronc `Objet`, `Espace` générique) est une CIBLE reportée, pas un chantier.** Tu ne fonds AUCUNE table métier existante dans un tronc commun sans une décision explicite et nominative de Lilou/Ben pour ce chantier précis.

Règle d'arbitrage en cas de contradiction V1 ↔ V2 sur l'architecture : **le V2 gagne, et tu le SIGNALES** dans le MANIFEST du chantier, sous une rubrique « Écarts V1→V2 appliqués » (ce que disait la V1, ce que dit le V2, ce que tu as fait, la garantie qu'aucune donnée n'est perdue). Exception : si l'écart risque de perdre des données ou suppose une migration lourde du modèle, tu t'arrêtes et tu marques `// CHANTIER-EN-ATTENTE-DE-DÉCISION-LL/B`. Le vocabulaire (`docs/specs/03_VOCABULAIRE.md`) prime sur le V2 même quand ils divergent (ex. « Maintenant Médias » avec S, pas « Maintenant Média »).

Quatre exigences transversales s'appliquent à TOUS les chantiers (détail dans `01b-EXIGENCES-TRANSVERSALES-UI.md`) :
- **Image par défaut systématique** (vraies images, par type d'objet, curées) : tout objet a TOUJOURS une image, c'est ce qui rend le site immédiatement beau. Ce n'est pas un fallback technique, c'est un pilier.
- **Upload d'images partout** (composant réutilisable unique, JPEG/PNG/WebP, Supabase Storage) : un vrai bouton d'upload, jamais un champ « collez l'URL ». L'upload remplace la défaut quand la personne en met une ; sinon la défaut reste. Jamais d'objet sans image, jamais d'obligation d'uploader.
- **Bascule clair/sombre en un geste** (bouton visible, branché sur `personne.mode_theme`).
- **Dégradé signature généralisé sans alourdir** : le token `--grad` (déjà défini dans `styles/tokens.css`, deux modes) devient le traitement par défaut du variant `primary` du composant `components/ui/Button.tsx`. Règle d'or : le dégradé est le point fort, pas le fond sonore ; il est réservé aux actions primaires et à des accents choisis ; les actions secondaires restent neutres.

Ce que tu fais maintenant : **la VAGUE 0 du plan d'implémentation** (`03-PLAN-IMPLEMENTATION.md`), qui ne touche aucune donnée :

- V2.0.1 : insérer le bloc de préséance en tête du CLAUDE.md, appliquer les 3 micro-corrections (sections 1, 3, 11), déposer proprement le pack CDC V2, corriger les 2 coquilles (« Maintenant Médias » ; amender le §2 régimes A/B).
- V2.0.2 : hygiène repo (route groups fantômes, doublon d'adapter paiement, CSP réelle dans `next.config.mjs`).
- V2.0.3 : fondations UI transversales (composant `TeleverseurImage` + bibliothèque d'images par défaut ; bouton bascule thème ; variant `primary` du Button en dégradé).

Commence par me proposer un découpage de la VAGUE 0 en chantiers numérotés `V2.0.x` avec, pour chacun : les fichiers concernés, ce que tu vas faire, et ce que tu NE feras pas (pour confirmation). N'écris pas encore de code : propose le découpage, j'arbitre, puis tu exécutes chantier par chantier avec MANIFEST à la fin de chacun. Respecte toute la checklist d'exhaustivité du CLAUDE.md §4 (lint, typecheck, tests, navigation réelle) avant de déclarer un chantier terminé.

Si quoi que ce soit dans les consignes te paraît se contredire, tu me le signales AVANT de coder, tu n'arbitres pas en silence.

## ▲▲▲ FIN DU PROMPT ▲▲▲

---

## Pourquoi ce prompt est construit ainsi (note pour Lilou/Ben)

- Il **ne lance pas le code tout de suite** : il demande d'abord un découpage à valider. C'est volontaire, pour que tu gardes la main sur le premier pas et que l'agent ne parte pas seul.
- Il **charge les consignes dans le bon ordre de préséance**, pour qu'il n'y ait jamais le conflit « on me dit X puis Y ».
- Il **cible la VAGUE 0**, c'est-à-dire le seul périmètre qui ne touche aucune donnée. Tu peux donc le lancer ce soir sans aucun risque, même fatigué·e.
- Il **inscrit les trois lois et les quatre exigences en dur**, pour qu'elles survivent à un `/compact` ou à un changement de session.

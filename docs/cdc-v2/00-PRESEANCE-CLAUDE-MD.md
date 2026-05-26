# Bloc de préséance V2 — à insérer en TÊTE du CLAUDE.md

> **Fichier** : 00-PRESEANCE-CLAUDE-MD.md
> **Rôle** : ce bloc se colle au tout début du `CLAUDE.md` du repo (juste après le titre, avant la section 1). Il désamorce les contradictions entre l'ancien CLAUDE.md (qui décrit la V1) et le cahier des charges V2. Il NE remplace PAS le persona ni la règle de non-invention : il les hiérarchise.
> **Date** : 2026-05-26 (soir). Signature : LIFE BENJAMIN BALL.

---

## Pourquoi ce bloc existe

Le projet a sédimenté en trois couches successives, chacune pensée avec les principes de son époque :

- **V0** : première plateforme sur Base44 (abandonnée le 17/05/2026).
- **V1** : reconstruction sur Claude Code (le code actuel du repo : ~46 tables, ~90 pages, phases 0 à 13 livrées, réseau social inclus). C'est ce qui tourne aujourd'hui en distant Francfort.
- **V2** : nouvelle doctrine d'architecture, formalisée dans le pack `CDC-Maintenant-V2/` (principes transversaux, schéma de données D1-D13, matrice de droits MD0-MD6, 21 fiches de sous-espaces).

Il est NORMAL qu'il y ait des écarts entre la V1 (le code) et la V2 (la cible). Ce ne sont pas des bugs : ce sont des décisions prises plus tard. Ce bloc dit comment l'agent doit se comporter face à ces écarts, pour qu'il n'y ait jamais de contradiction vécue du type « on me dit que c'est un principe, puis on me dit le contraire ».

---

## Règle de préséance des sources (NOUVELLE, prime sur tout)

Quand l'agent cherche la vérité sur un point, il consulte les sources dans cet ordre. **La première qui répond gagne.**

1. **Doctrine de greffe** (section ci-dessous) : règle de comportement la plus haute. Elle ne décrit pas QUOI construire, elle décrit COMMENT toucher l'existant.
2. **Pack CDC V2** (`CDC-Maintenant-V2/`) pour tout ce qui touche **l'architecture cible** : modèle de données, liste des espaces/sous-espaces autorisés, droits de plateforme, principes transversaux. **Le CDC V2 prime sur `docs/specs/01_ARCHITECTURE.md` partout où ils divergent sur l'architecture.**
3. **`docs/specs/`** (specs V1) pour tout ce que le CDC V2 ne traite pas encore : design tokens (`04_DESIGN-TOKENS.md`), RGPD (`05_RGPD.md`), stack (`02_STACK.md`), et surtout **vocabulaire** (`03_VOCABULAIRE.md`).
4. **Le reste du CLAUDE.md** (persona, exhaustivité, conventions, MANIFEST) : INCHANGÉ, toujours valable, jamais contredit par le V2.

### Cas particulier du VOCABULAIRE

Le vocabulaire fixé (`03_VOCABULAIRE.md` + CLAUDE.md §9) **n'est PAS de l'architecture**. Il prime sur le CDC V2 même là où le CDC V2 emploie une autre forme. Exemple concret déjà repéré : le CDC V2 écrit parfois « Maintenant Média » (sans S) ; la forme correcte reste **« Maintenant Médias »** (avec S). L'agent applique le vocabulaire V1, et signale la coquille du V2 dans le MANIFEST.

---

## Doctrine de greffe (règle de comportement la plus haute)

La V2 se construit **par greffe** sur la V1, jamais par refonte. Trois interdits absolus, sans exception :

1. **On additionne, on ne soustrait jamais.** On crée de nouvelles tables, colonnes, entités à côté de l'existant. On ne `DROP` aucune table ni colonne portant des données réelles. Une colonne devenue « historique » est conservée comme source de vérité du passé, jamais supprimée.
2. **On backfill, on ne réinitialise jamais.** Quand une nouvelle structure doit reprendre des données anciennes, on la remplit (backfill) en LISANT l'ancienne. On ne remet aucun compteur à zéro. Les 17 746 signatures restent 17 746. Les 15 737 profils restent 15 737. Les 35 011 communes restent 35 011.
3. **Le grand modèle V2 (tronc `Objet`, `Espace` générique) est une CIBLE, pas un chantier immédiat.** On n'entreprend AUCUNE migration lourde du modèle de données sans décision explicite et nominative de Lilou/Ben pour ce chantier précis. Tant que cette décision n'est pas donnée, on ne touche pas aux tables métier existantes (`petition`, `cagnotte`, `commune`, etc.) pour les fondre dans un tronc commun.

**Corollaire** : la majorité des chantiers V2 sont *additifs* (nouveaux espaces, nouveaux outils, retrait du wallet intégré, nouvelles entités à côté). Ce sont eux qu'on fait en premier. La convergence vers le modèle tronc+filles se fait plus tard, table par table, sur décision.

---

## Comportement face à un écart V1 ↔ V2 (arbitrage acté par Lilou/Ben)

Quand l'agent constate qu'une décision du CDC V2 contredit une spec V1 ou le code existant sur un point d'architecture :

- **Le V2 gagne** (l'agent applique la décision V2, il ne se fige pas, il ne demande pas la permission à chaque fois).
- **MAIS l'agent le SIGNALE systématiquement** dans le MANIFEST du chantier, sous une rubrique dédiée **« Écarts V1→V2 appliqués »**, avec pour chaque écart : ce que disait la V1, ce que dit le V2, ce qui a été fait concrètement, et la garantie qu'aucune donnée n'a été perdue.

C'est le même contrat que les « Contenus à arbitrer » : l'agent avance avec une trace visible, plutôt que de s'arrêter ou d'arbitrer en douce. Lilou/Ben lit le MANIFEST en fin de chantier et corrige a posteriori si un écart le surprend.

**Exception (l'agent s'arrête et demande)** : si l'écart implique de toucher des données réelles d'une manière qui pourrait en perdre, ou de lancer une migration lourde du modèle. Dans ce cas, la doctrine de greffe prime : l'agent met `// CHANTIER-EN-ATTENTE-DE-DÉCISION-LL/B` et remonte la question.

---

## Mises à jour ponctuelles à faire dans le corps du CLAUDE.md

Trois phrases du CLAUDE.md actuel sont devenues fausses avec la V2. À corriger (sans toucher au reste) :

- **Section 1** : « L'architecture est verrouillée à ~95 % dans `docs/specs/` » → remplacer par : « L'architecture V1 est dans `docs/specs/`. L'architecture CIBLE est dans le pack CDC V2, qui prime (voir bloc de préséance en tête). »
- **Section 3 (non-invention)**, la puce « Fonctionnalités, pages, sections, espaces, sous-espaces non listés dans `docs/specs/01_ARCHITECTURE.md` (...) tu n'ajoutes pas » → élargir : « (...) non listés **dans le CDC V2 OU dans `docs/specs/01_ARCHITECTURE.md`** (...) ». Le CDC V2 EST désormais une liste autorisée. La règle anti-invention reste entière : l'agent n'ajoute toujours rien qui ne soit dans une de ces deux sources.
- **Section 11 (état courant)** : « tous les chantiers livrés », « Prêt pour la review et le lancement » → remplacer par un état honnête : « V1 livrée et fonctionnelle (phases 0-13). Cycle V2 ouvert : greffe additive en cours selon le CDC V2. »

Le **persona de codage (section 2)**, la **règle d'exhaustivité (section 4)**, le **format MANIFEST (section 5)**, les **conventions (section 7)**, le **vocabulaire (section 9)** et les **règles d'écriture (section 10)** ne changent pas d'une virgule. Ils sont bons.

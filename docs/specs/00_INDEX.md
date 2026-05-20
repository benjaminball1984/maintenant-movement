# Pack de spécifications — Site Maintenant!

**Date** : 20 mai 2026
**Pour** : Claude Code (et toute personne qui code, lit, audite le site)
**Statut** : pack de référence, à conserver à la racine du dépôt sous `/docs/specs/` (sauf `CLAUDE.md` qui va à la racine du dépôt directement).

---

## À quoi sert ce pack

Ces fichiers sont la **mémoire de référence** que Claude Code lit avant chaque chantier. Ils consolident 7 sessions de travail (Lilou/Ben + Claude) qui ont fixé l'architecture, la stack, le vocabulaire, le design, les contraintes RGPD et les doctrines politiques du site.

**Règle d'or pour Claude Code** : avant chaque chantier, relire `09_CLAUDE.md` (à la racine du dépôt) et les sections pertinentes du pack. En cas de doute, consulter le pack avant de demander à Lilou/Ben. Ne JAMAIS inventer de fond politique, éditorial ou architectural (voir `09_CLAUDE.md` §3).

---

## Mise en place dans le dépôt

```
maintenant/
├── CLAUDE.md                              ← copié depuis 09_CLAUDE.md (racine, lu automatiquement)
└── docs/
    └── specs/
        ├── 00_INDEX.md                    ← ce fichier
        ├── 01_ARCHITECTURE.md
        ├── 02_STACK.md
        ├── 03_VOCABULAIRE.md
        ├── 04_DESIGN-TOKENS.md
        ├── 05_RGPD.md
        ├── 06_DOCTRINES.md
        ├── 08_PLAN_CHANTIERS.md
        ├── 10_PROMPT_AMORCE_v2.md         ← à coller dans Claude Code à chaque session
        └── arborescence.mermaid
```

---

## Ordre de lecture conseillé

| Fichier | Quand le lire |
|---|---|
| **`09_CLAUDE.md`** ⭐ | **À chaque démarrage de session Claude Code (automatique).** Mémoire persistante, persona, règles d'or, état du projet. |
| `01_ARCHITECTURE.md` | Avant chaque chantier. Vue d'ensemble, arborescence, modèles de données, flux utilisateurice. |
| `02_STACK.md` | Avant tout chantier technique. Versions, choix back-end, patterns d'usage. |
| `03_VOCABULAIRE.md` | À chaque création d'UI ou de copy. Référentiel des termes officiels. |
| `04_DESIGN-TOKENS.md` | Avant chaque chantier UI. Couleurs, typo (Sora + Inter), espacements, motion, modes clair et sombre. |
| `05_RGPD.md` | Avant chaque chantier qui touche aux données personnelles. |
| `06_DOCTRINES.md` | À chaque décision d'UX ou de produit. Les principes politiques qui orientent les choix. |
| `08_PLAN_CHANTIERS.md` | Pour savoir quel chantier vient ensuite. |
| `10_PROMPT_AMORCE_v2.md` | À coller dans Claude Code à chaque démarrage de session. |
| `arborescence.mermaid` | Pour visualiser la structure du site. |

---

## Persona de codage attendue (rappel)

Élève brillant·e et scolaire en master d'informatique. Code lisible avant d'être astucieux. Pédagogique, structuré, exhaustif. Trois publics : senior·es militant·es, débutant·es en apprentissage, Lilou/Ben.

Détails complets dans `09_CLAUDE.md` §2.

---

## Règle d'or de non-invention (rappel)

Claude Code n'invente RIEN de politique, éditorial ou architectural. Pour les trous de contenu, placeholders visibles (`[TITRE À METTRE]`, `[TEXTE À FAIRE]`) et listing dans le MANIFEST du chantier sous « Contenus à arbitrer ». Lilou/Ben arbitre en langage naturel.

Détails complets dans `09_CLAUDE.md` §3.

---

## Règle d'exhaustivité (rappel)

Rien d'à moitié fait dans un chantier livré. Pas de bouton sans action, pas d'étoile non-fonctionnelle, pas de lien vers le vide. Si une fonctionnalité ne peut pas être finie (API non connectée, dépendance), c'est déclaré explicitement dans le MANIFEST, pas caché.

Détails complets dans `09_CLAUDE.md` §4 et §5.

---

## Stack résumée

- **Front** : Next.js 14+ + TypeScript strict + Tailwind + shadcn/ui
- **BDD + Auth + Storage** : Supabase (région Francfort)
- **Email** : Brevo (mock par défaut tant que pas d'API)
- **Paiements** : Stripe (mode test gratuit en dev, prod plus tard)
- **Visio** : LiveKit self-hosted (Docker local en attendant le déploiement)
- **Anti-bot** : Cloudflare Turnstile
- **T99CP** : Polygon, contract `0x7275cfc83f486d53ca1379fc1f8025490bdcc79a`
- **Hébergement** : dev local → prod Cloudflare Pages quand accessible

Détails dans `02_STACK.md` et `09_CLAUDE.md` §6.

---

## Angles morts conscients (non bloquants)

1. **Logo et iconographie** : palette validée (magenta + violet + framboise + gradient), logo à finaliser, pack d'icônes Lucide proposé par défaut.
2. **Q6 banque utilisateurice + Q8 API T99CP flux** : à co-construire avec Lilou/Ben en chantier 1.1 et phases ultérieures.
3. **Cartographie 2100-2300 communes pré-créées** : à fournir en CSV par Lilou/Ben avant le chantier 5.2.
4. **Q5 services par statut**, **Q13 boucle d'engagement**, **Q14 indicateurs publics** : à compléter en session future. Non bloquants.
5. **Migration Base44** : chantier dédié en phase 10.
6. **Contenus éditoriaux** : à arbitrer au fur et à mesure via les placeholders MANIFEST.
7. **DPD bénévole** : choix collégial à porter en réunion cosec gé.

---

## Convention de pack

Tous les fichiers sont en Markdown, en français, **sans tirets cadratins** (interdits dans les textes publiés, et par discipline ici aussi). Inclusivité variée (épicène en priorité, point médian, doublet, néologismes selon le moins lourd). Pas de jargon académique pédant.

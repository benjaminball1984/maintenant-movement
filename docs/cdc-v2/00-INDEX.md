# INDEX — Pack de reprise V2 pour Claude Code

> **Fichier racine. À LIRE EN PREMIER.**
> **Date** : 2026-05-26 (soir). Signature : LIFE BENJAMIN BALL.
> Ce pack répond à une question : « que manque-t-il pour que Claude Code se remette au travail ce soir sur la V2 ? » Réponse : ces cinq documents, qui transforment le cahier des charges conceptuel V2 en ordre de travail exécutable sur le code réel.

---

## Le contexte en trois phrases

Le CDC V2 est une cible doctrinale (modèle tronc+filles, espace générique, droits atomiques). Le code réel (repo `maintenant-movement`) est une V1 déjà copieuse et fonctionnelle (46 tables, ~90 pages, phases 0-13 livrées). Le V2 ne décrit donc pas le code : il se greffe par-dessus, sans rien casser, sans perdre de donnée, sans remettre un compteur à zéro.

## Décisions actées avec Lilou/Ben (26/05 soir)

1. **Stratégie = greffe**, pas refonte. Le grand modèle tronc Objet est une cible reportée.
2. **Arbitrage des écarts** : le V2 gagne, mais l'agent le SIGNALE dans le MANIFEST.
3. **Backup** : confirmé fait par Lilou/Ben (les deux colonnes de consentement RGPD comprises). Alerte levée.
4. **Trois exigences transversales ajoutées** : upload d'images partout (sans supprimer les images par défaut), bascule thème en un geste, généralisation du dégradé signature.

## Les documents, dans l'ordre de lecture

| # | Fichier | Rôle |
|---|---|---|
| 00 | `00-PRESEANCE-CLAUDE-MD.md` | Le bloc à coller en tête du CLAUDE.md : règle de préséance + doctrine de greffe. **Désamorce les contradictions.** |
| 01 | `01-REVUE-ECARTS-V1-V2.md` | La revue de code : 8 écarts V1↔V2, chacun avec sa manœuvre de rattrapage sans perte. |
| 01b | `01b-EXIGENCES-TRANSVERSALES-UI.md` | Les 4 exigences UI (image défaut, upload, thème, dégradé) applicables à tous les chantiers. |
| 02 | `02-PONT-V1-V2.md` | Table par table : ce que chaque entité V1 devient en V2 (GARDER / GREFFER / CONVERGER-reporté). |
| 03 | `03-PLAN-IMPLEMENTATION.md` | L'ordre des chantiers par dépendances : 6 vagues, la VAGUE 0 démarrable ce soir. |
| 04 | `04-PROMPT-AMORCE-CLAUDE-CODE.md` | Le prompt à coller dans Claude Code pour démarrer. **C'est la pièce que tu utilises ce soir.** |

## Pour ce soir, concrètement

1. Déposer le pack CDC V2 + ces 5 documents dans le repo (ex. `docs/cdc-v2/`).
2. Ouvrir le document 04, copier le bloc « PROMPT À COLLER », le coller dans Claude Code.
3. Claude Code propose un découpage de la VAGUE 0 (zéro risque données) ; tu arbitres ; il exécute chantier par chantier avec MANIFEST.

## Ce qui reste à faire plus tard (hors de ce pack)

- Finir la spécification CDC des 4 blocs à 0 % (Espace membre, Admin, Transverses, Fondations) AVANT de les coder.
- Trancher, le jour venu, la convergence vers le tronc Objet (VAGUE 5), table par table.
- Clarifier deux points laissés ouverts : `organisation_partenaire` (= organisation-acteur ORM+5 ou autre ?) et `tupperware` (rattachée à quel sous-espace V2 ?).
- Points juridiques Légicoop (statut membres non actifs, location mutualisée, reçus fiscaux, dons 99-coin).

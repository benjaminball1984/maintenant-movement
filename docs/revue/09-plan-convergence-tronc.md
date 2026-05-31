# Revue 2026 : Plan de convergence vers le tronc commun (décision D3)

> Décision Lilou/Ben du 2026-05-31 : **planifier** la convergence du modèle de données vers le tronc générique `Objet` / `Espace` (schéma cible D1-D13 de `docs/cdc-v2/CDC-Maintenant-V2/schema-donnees-V2.md`).
>
> **Ce document est un PLAN, pas une exécution.** Aucune migration n'est lancée. L'exécution est un chantier séparé, déclenché explicitement et nominativement, soumis au protocole de sûreté ci-dessous. Priorité absolue : **aucune perte de donnée, aucune régression** (17 746 signatures, 35 011 communes, 15 737 profils).

## 1. Objectif et périmètre

Remplacer progressivement les ~46 tables métier séparées (petition, cagnotte, commune, federation, campagne, mobilisation, sondage, media, offre_entraide, service_sel, produit_marche, moment_solidaire…) par :
- un tronc **`objet`** générique (`objet_type`, `createur_profil_id`, `espace_origine_id`, `titre`, `description`, `image`, `statut`, `config` JSON, dates) + **tables filles** par spécificité (`petition_detail`, `cagnotte_detail`, `evenement_detail`, `offre_detail`, `sondage_detail`) ;
- un tronc **`espace`** générique (`type`, `nom`, `description`, `image`, `createur`, `config`) + table **`outil_active`** (`espace_id`, `outil`, `actif`, `config`) : activer un outil = une ligne, jamais une migration ;
- un graphe **`rattachement`** (lien orienté typé, `statut` demandé/accepté/refusé/retiré, double consentement, fork = retrait non destructif) et **`objet_espace`** (objet ↔ espaces, rôle origine/relai/héberge) ;
- `type_lien` limité à {fédère, relaie, soutient, héberge} ; identifiant public d'espace **`ESM`+5** (cohérent avec M+7 individus, ORM+5 organisations).

## 2. Principe directeur : greffe + vues de compatibilité, jamais de big-bang

On NE supprime AUCUNE table existante pendant la convergence. Pour chaque famille, l'ordre est :
1. **Créer** le tronc + la table fille (migration purement additive).
2. **Backfiller** le tronc en LISANT l'ancienne table (copie, jamais déplacement ; compteurs intacts).
3. Poser une **vue de compatibilité** portant le nom de l'ancienne table si on doit un jour la renommer (l'ancien code continue de lire la même forme). Tant que ce n'est pas nécessaire, on garde l'ancienne table comme source de vérité et le tronc en miroir.
4. **Basculer le code applicatif** lecture par lecture vers le tronc, en gardant un fallback.
5. **Vérifier** (tests verts + comptages identiques) avant de passer à la famille suivante.
6. L'ancienne table reste comme **trace historique** (jamais de DROP de données réelles, doctrine §0.3).

## 3. Protocole de sûreté (obligatoire avant TOUTE exécution)

1. **Export `pg_dump` daté et vérifié** du distant de Francfort, ET test de restauration sur une base jetable (le verrou de la Phase M). Avoir des données en local ne dispense pas de cet export.
2. Travailler **table par table**, jamais en bloc.
3. Chaque migration de backfill : **idempotente**, avec `--dry-run` puis `--confirm`, et un **compte avant/après** (les 17 746, 35 011, 15 737 doivent être identiques).
4. **Rollback** prévu à chaque étape (l'ancienne table intacte permet de revenir en arrière instantanément).
5. **Tests verts** (les 1013 actuels + nouveaux tests d'invariants de backfill) à chaque étape.
6. Exécution **uniquement** sur décision explicite, jamais automatique.

## 4. Ordre proposé (du moins risqué au plus structurant)

1. **`espace` + `outil_active`** : commencer par les espaces les plus simples et homogènes (gt_thematique, groupe_entraide_local) ; backfill depuis les tables existantes ; le code lit le tronc avec fallback.
2. **`objet` + tables filles** : commencer par un type peu lié et bien cerné (`sondage` ou `media`), valider le patron complet (tronc + fille + objet_espace), puis étendre type par type.
3. **`rattachement`** générique : modéliser les liens fédération↔commune, campagne↔objets existants en graphe (double consentement) en plus de l'existant, sans casser les FK actuelles.
4. **Identifiants `ESM`+5** : ajouter une colonne `numero_espace` + trigger générateur calqué sur `profil_unifie` (anti-collision, anti gros mots), sans collision avec M+7 / ORM+5.
5. **Familles les plus chargées en dernier** (commune 35 011 lignes, petition + signatures 17 746) : seulement une fois le patron éprouvé sur les petites familles.

## 5. Ce qui déclenche l'exécution

- Un **objectif concret** le justifie (typiquement : rendre la plateforme réutilisable par un autre mouvement, ou un besoin produit que le modèle par-tables bloque).
- Le **feu vert explicite et nominatif** de Lilou/Ben pour la famille précise.
- Le **protocole §3 satisfait** (export vérifié en premier).

Tant que ces trois conditions ne sont pas réunies, on continue d'**ajouter par greffe** sur le modèle actuel (qui fonctionne). Ce plan reste disponible et exécutable le moment venu.

## 6. Estimation honnête

Refonte **lourde** : compter plusieurs semaines de travail réparties, famille par famille, avec vérification à chaque étape. Ce n'est pas un chantier d'une session. Le risque principal n'est pas technique (le patron est clair) mais **le volume de données réelles** : d'où le protocole de sûreté non négociable.

---

*Décision enregistrée en mémoire projet (`d3-convergence-tronc-planifiee`). Exécution NON commencée. Voir aussi `06-plan-correctifs.md` (D3) et `01-synthese-cdc.md` §3 (modèle cible D1-D13).*

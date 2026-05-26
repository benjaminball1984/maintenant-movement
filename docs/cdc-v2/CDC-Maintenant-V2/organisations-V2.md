# Profils d'organisation — Spécifications V2

> **Fichier** : organisations-V2.md
> **Version** : 1.0
> **Dernière mise à jour** : 2026-05-26
> **Session** : 2026-05-26
> Brique TRANSVERSALE : concerne pétitions, mobilisations, médias (et potentiellement tout formulaire de création).
> Signature : LIFE BENJAMIN BALL.

---

## Historique des versions

- **v1.0** (2026-05-26) : création de la brique (identifiants, mandat, multi-mandataires, gestion email partagé, droit de vote).

---

## Principe

Dans tous les formulaires de création de contenu (pétitions, mobilisations, médias…), on peut créer **en son nom propre** OU **au nom d'une organisation** (une association, un collectif, une entreprise, etc.) — ou **au nom d'une commune libre** de la plateforme, traitée comme une organisation.

On ne « se connecte » JAMAIS en tant qu'organisation : c'est toujours **une personne physique identifiée** qui agit au nom de l'entité.

---

## Identifiants (figé)

Uniformité à **8 caractères** :

- **Profil individuel** = **M + 7 lettres** (8 au total). Capacité 26⁷ ≈ 8 milliards.
- **Profil organisation** = **ORM + 5 lettres** (8 au total). Capacité 26⁵ ≈ 11,9 millions.

- Préfixe **ORM** (« ORganisation Maintenant ») choisi pour la **lisibilité** et pour **éviter « OM »** (lu « Olympique de Marseille » en France → moqueries, rivalités).
- Le préfixe rend le **type de profil reconnaissable d'emblée**.
- **À vérifier dans le code** : adapter la génération existante du numéro `M+7` du `profil_unifie` pour accueillir `ORM+5` sans casser l'existant.

---

## Mandat (figé)

- Créer au nom d'une organisation exige de **cocher « je suis mandaté·e par [organisation] »**. **Obligatoire.**
- Sans mandat coché → création au nom de l'organisation **impossible**.
- Un individu ne peut pas se faire passer pour une organisation sans cette déclaration.
- **Responsabilité** : la déclaration de mandat est **tracée**. En cas de mensonge (mandat revendiqué mais inexistant), c'est la faute de la personne ; la plateforme a la preuve de la déclaration.

---

## Multi-mandataires (proposition technique figée)

Problème résolu : plusieurs personnes peuvent légitimement agir au nom d'une même entité (ex. deux membres de la même commune).

- Séparer **l'ENTITÉ** (organisation/commune, identifiant unique) de **QUI peut agir en son nom** (ses **mandataires**).
- Pas de compte partagé, pas de mot de passe commun.
- Chaque mandataire est un **individu** (profil M+7) **rattaché** à l'entité.
- Le **créateur** du profil organisation en est le **premier mandataire / admin** ; il peut **ajouter ou retirer** d'autres mandataires (par profil M+7 ou par email).
- Pour créer au nom de l'entité, le système vérifie l'**appartenance à la liste des mandataires**.
- **Traçabilité** : tout contenu « au nom de X » garde en interne l'identité du **profil individuel** qui l'a réellement créé.
- **UX** : menu « créer en tant que : moi-même / [entités dont je suis mandataire] » au moment de créer une pétition / mobilisation / média.
- **Cas COMMUNE** : les mandataires habilités à agir au nom d'une commune libre sont **désignés par la commune** selon ses propres règles (cohérent avec la désignation du binôme dans Décider).

---

## Gestion de l'email partagé (figé)

- Un **même email** peut être associé à un profil individuel ET à un profil d'organisation (ex. on réutilise son mail perso pour une organisation).
- Le système **NE DOIT PAS** signaler de doublon dans ce cas.
- À la **connexion**, si l'email est lié à plusieurs profils, **demander explicitement** avec lequel se connecter (individuel ou organisation).
- La distinction se fait par l'**identifiant unique** (M… / ORM…), pas par l'email.

---

## Droit de vote (figé — voir aussi decider-V2.md M4)

- **Par défaut, dans les assemblées du mouvement** (commune, fédérale, confédérale) : les organisations **NE votent PAS**. Une personne = une voix d'individu, quel que soit le nombre d'organisations mandatées.
- **Espace dédié inter-organisations** : les organisations peuvent voter (token de vote distribué par décision humaine) ; cumul individu + organisation autorisé et assumé (deux légitimités distinctes).

---

## Récapitulatif des implications techniques

- Générer des identifiants `ORM + 5` distincts des `M + 7` ; vérifier compatibilité avec l'existant.
- Table/relation « entité ↔ mandataires » (liste d'individus habilités, avec rôle admin pour le créateur).
- Case « je suis mandaté·e par » obligatoire + journalisation de la déclaration.
- Sélecteur « créer en tant que » dans tous les formulaires de création concernés.
- Gestion connexion multi-profils sur un même email (choix explicite, pas d'alerte doublon).
- Lien avec `organisation_partenaire` existant : VÉRIFIER si c'est la même notion ou à distinguer.
- Cloisonnement du droit de vote selon le type d'espace (cf. decider-V2.md).

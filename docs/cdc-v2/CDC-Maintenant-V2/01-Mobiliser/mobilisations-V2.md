# Mobilisations — Spécifications V2

> **Fichier** : mobilisations-V2.md
> **Version** : 1.0
> **Dernière mise à jour** : 2026-05-26
> **Session** : 2026-05-26 (M1-M3)
> Sous-espace de Mobiliser. Événements : manifs, rassemblements, actions, réunions publiques, porte-à-porte, événements numériques.
> Signature : LIFE BENJAMIN BALL.

---

## Historique des versions

- **v1.0** (2026-05-26) : arbitrages M1 à M3 (création, participation, modération, format, lieu, temporalité). Note : M4 (droit de vote des organisations) est consigné dans decider-V2.md car il concerne Décider.

---

## M1 — Création, participation, modération

- **PARTICIPER** : ouvert à tous, avec ou sans compte.
  - Modale d'inscription = mêmes champs que la pétition + spécifiques.
  - Champs : **email (obligatoire)**, **code postal (obligatoire)**, **téléphone (optionnel, « pour agir avec nous »)**.
  - **2 cases RGPD** : contact par les **organisateur·ices** / contact par la **plateforme** (= newsletter).
  - **Profil unifié silencieux** créé, ou rattaché si déjà existant ; reste silencieux tant que pas de compte utilisateur complet.
- **CRÉER** : **compte utilisateur obligatoire** (comme pétition).
- **MODÉRATION : a posteriori** (publication immédiate, contrôle après) — DIFFÉRENT des pétitions (a priori).
  - Justification : besoin de réactivité (mobilisations parfois organisées dans l'urgence).
  - Même équipe de modération volontaire (cooptation).

## M2 — Signalement

- **Pas de signalement accéléré** ni de masquage automatique.
- Confiance à la **vigilance spontanée** des communautés engagées (repérage rapide naturel).
- Canal d'alerte = **point de contact identifié** (formulaire + mail + téléphone). Lilou envisage un **téléphone dédié** pour être joignable.
- Modération a posteriori classique conservée.

## M3 — Format, lieu, temporalité

- **Lieu** = une **adresse sur la carte** (pas forcément une commune du référentiel).
- Sinon, case **« mobilisation numérique »** → événement en ligne (visio, etc.).
  - **Enrichir la liste des types d'événements** avec des formats numériques courants du milieu militant engagé.
- **Temporalité** : **ponctuelle OU récurrente**.
- Après la date : **conservée et consultable** (mémoire ; « c'était où ? quand ? »).
- Affichage **2 onglets** : **« à venir » (par défaut)** + **« événements passés »**.
- Pas de suppression, archive consultable.

## M4 — voir decider-V2.md

Le droit de vote des organisations et les espaces inter-organisations sont traités dans decider-V2.md (section M4), car ils concernent le fonctionnement de Décider.

---

## Lien avec les profils d'organisation

Une mobilisation peut être créée **au nom d'une organisation** (ou d'une commune en tant qu'entité). Voir **organisations-V2.md** pour le mécanisme complet (mandat obligatoire, multi-mandataires, identifiants ORM+5).

---

## Récapitulatif des implications techniques

- Modale d'inscription participant : email + code postal obligatoires, téléphone optionnel, 2 cases RGPD ; création/rattachement profil unifié silencieux.
- Création réservée aux comptes ; modération a posteriori (file de contrôle après publication).
- Champ lieu = adresse géocodée sur carte MapLibre, OU case « numérique » + type d'événement en ligne.
- Liste de types d'événements à enrichir (physiques + numériques).
- Récurrence à gérer (événement répétable).
- Archivage : onglets « à venir » / « passés », pas de suppression.
- Point de contact (formulaire + mail + téléphone) pour les alertes.
- Création possible au nom d'une organisation (cf. organisations-V2.md).

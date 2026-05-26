# Campagnes — Spécifications V2

> **Fichier** : campagnes-V2.md
> **Version** : 1.0
> **Dernière mise à jour** : 2026-05-26
> **Session** : 2026-05-26 (C1-C3 + arbitrages d'argent)
> Sous-espace de Mobiliser. Conteneur qui agrège des objets autour d'un combat.
> Signature : LIFE BENJAMIN BALL. Voir aussi principes-transversaux-V2.md.

---

## C1 — Nature et composition

- Une campagne = **conteneur qui agrège des modules** autour d'un même combat.
- Deux façons de peupler, **mixables** :
  1. **Rattacher de l'existant** : sélectionner des briques déjà créées et les regrouper.
  2. **Créer depuis la campagne** : modale pour créer une nouvelle brique (pétition, cagnotte, etc.) qui s'ajoute à la campagne.
- Les briques sont des **objets autonomes** que la campagne **référence** (pas de possession exclusive ; un objet peut vivre seul et/ou être rattaché à plusieurs campagnes).

## C2 — Merchandising (via marché solidaire)

- Pas de module merchandising dédié : la vente passe par le **marché solidaire**.
- **Règle dure** : paiement en **99-coin OU euros**, jamais euros exclusivement (acte militant). Tout-euro = lien vers boutique extérieure.
- Cf. principe de paiement unifié (transversal).

## C3 — Modules : TOUS les objets du site

- Une campagne peut agréger **tous les types d'objets** : pétitions, mobilisations, cagnottes, produits du marché, hébergement, covoiturage, prêt, fruits, SEL, articles, sondages, médias, agenda… et tout type futur.
- **Nativement extensible** : tout nouveau type d'objet devient automatiquement un module possible.
- Ne jamais présumer qu'un objet est « hors sujet » (ex. héberger des bénévoles, organiser des covoiturages vers un rassemblement).

## Groupes locaux + cartographie

- Une campagne peut avoir des **groupes locaux** et une **cartographie** (comme une commune).
- Carte **peuplée par l'usage** (12 villes participantes = 12 points ; 8 groupes locaux = 8 points). PAS de référentiel des 35 000 communes (trop lourd).
- Groupe local de campagne : fonctionnalités d'organisation, charté au nom de la campagne, suit la logique de **fork** (identifiant unique, peut perdurer/s'émanciper si la campagne s'arrête, ex. GT « porter plainte contre l'État »).
- Rattachements **multiples** et à **double consentement** (cf. principes §4) : un groupe peut être relais de plusieurs campagnes ; la campagne valide chaque rattachement.

## Back-office (cf. principes §9-10)

- Délégation granulaire, intégration ascendante, partage (3 entrées + métadonnées OG).
- Mini-blog de la campagne (cf. principes §7).

## Création au nom d'une organisation

- Possible (cf. organisations-V2.md) : mandat obligatoire, multi-mandataires.

---

## Implications techniques

- Réutilise le composant « espace agrégateur » (objets référencés, pas possédés).
- Carte MapLibre source « usage ».
- Rattachements many-to-many à double consentement.
- Back-office standardisé + mini-blog + module de partage.

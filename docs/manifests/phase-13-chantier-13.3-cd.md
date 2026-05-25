# Manifest — Phase 13, Chantier 13.3 (C + D) : fiche commune, carte clusterisée, « Mes données »

**Date de fin** : 2026-05-25
**Branche** : feature/phase-13-chantier-13.3-d-mes-donnees (partie de feature/phase-13-integration)
**Commits clés** : 99d303e (contributions), + carte/fiche communes
**Durée approximative** : 1 session Claude Code (autonome)

Suite de la plateforme de données. Adapté au schéma RÉCONCILIÉ (pas de tables
`personnes`/`actions` parallèles : on réutilise `personne`, `signature_petition`,
`appartenance_commune`, `commune`, `commune_reference`).

## Livré et fonctionnel

### Chantier D (partiel) : « Mes contributions »
- [x] `/profil/contributions` n'est plus un stub : affiche les pétitions signées par la
  personne connectée (`lib/petitions/requetes.ts` → `listerMesSignatures`).
- [x] Réglage par pétition « autoriser la créatrice à me recontacter », modifiable a posteriori
  (RGPD : consentement granulaire et réversible). Action `definirRecontactSignature`
  (`app/(membre)/profil/contributions/actions.ts`), schéma `definirRecontactSignatureSchema`.
- [x] États gérés : vide, nominal, erreur (toggle optimiste avec rollback).
- [x] Tests unitaires du schéma (5 cas).
- Note : l'export ZIP et la suppression de compte (autres briques de D) existaient déjà sous
  `/profil/confidentialite` (chantier 1.3).

### Chantier C : fiche commune + carte clusterisée
- [x] Carte clusterisée de tout le référentiel (~35 000 communes + 45 arrondissements) :
  `components/communes/CarteCommunesReference.tsx` (clustering NATIF MapLibre via source
  GeoJSON), route `/communes`. Données servies par `app/api/communes/geojson/route.ts`
  (pagination, cache 24 h).
- [x] Fiche par commune/arrondissement : `/communes/[code_insee]` (les 35 k codes du
  référentiel ; ex. /communes/31555 = Toulouse). Affiche identité, département, région,
  population, et les compteurs ANONYMISÉS.
- [x] Compteurs anonymisés (counts only) : inscrit·es, signataires, abonné·es, calculés par la
  fonction SQL `compteurs_commune` (SECURITY DEFINER), avec résolution code_postal → commune
  la plus peuplée (règle documentée migration 036). Migration `20260525120000_compteurs_commune.sql`.
- [x] Lien fiche → commune LIBRE correspondante (si activée) pour voir/rejoindre les membres,
  en réutilisant le flux existant (chantier 5.2) qui respecte RLS + visibilité.
- [x] typecheck + lint (386 fichiers) + 284 tests : verts. Smoke test : /communes 200,
  /communes/31555 200, /api/communes/geojson 200 (~35 k features).

## Livré partiellement / Non livré (décisions en attente de Lilou/Ben)

- [ ] **Migration `compteurs_commune` (037) NON appliquée sur le distant** : le garde-fou de
  sécurité a refusé d'appliquer une nouvelle migration sans autorisation explicite. Tant
  qu'elle n'est pas appliquée, la fiche affiche « compteurs en cours d'activation » au lieu
  des chiffres (dégradation propre, pas de crash). À appliquer : `supabase db push` ou
  `npx tsx --env-file=.env.local scripts/appliquer-sql-distant.ts supabase/migrations/20260525120000_compteurs_commune.sql`
  (DDL pur, sans PII), puis enregistrer la version dans `supabase_migrations.schema_migrations`.
- [ ] **Membres affichés NOMMÉMENT directement sur la fiche référentiel** : pour l'instant, on
  renvoie vers la commune libre (où les membres sont déjà affichés dans le respect de la RLS et
  des réglages de visibilité). L'affichage nominatif inline sur la fiche publique demande une
  décision RGPD : quel niveau de divulgation (prénom + nom complet ? prénom + initiale ?) et
  faut-il respecter les réglages de visibilité individuels ? À trancher.
- [x] **RÉSOLU (Lilou/Ben, 2026-05-25) : « Rejoindre » depuis une fiche référentiel** : la
  doctrine §7B est révisée (« coquilles vides » désormais autorisées). On pré-crée une coquille
  `pre_creee` pour TOUTES les communes et arrondissements du référentiel (`scripts/precreer-communes.ts`).
  Plus besoin d'auto-matérialiser au moment du « rejoindre » : la coquille existe déjà, le flux
  `rejoindreCommune` la trouve par `code_insee`. La création libre reste possible avec le nom
  souhaité, refusée seulement si ce nom exact est déjà pris (garde dans `creerCommuneLibre`).
  Préalable d'activation : lancer `scripts/precreer-communes.ts --confirm` sur la base distante.
- [ ] **Rattachement des signatures importées au profil par email** : les signatures faites
  avant d'avoir un compte (importées, `personne_id` null) n'apparaissent pas encore dans
  « Mes contributions » (la RLS filtre par `personne_id`). Le rattachement par email est une
  décision d'archi/RGPD (modifier la RLS ou lier `personne_id` à l'inscription). À trancher.
- [ ] **Perf carte** : le GeoJSON fait ~5,3 Mo (35 k points). Acceptable et mis en cache pour
  une v1, mais à optimiser plus tard (tuiles vectorielles ou clustering côté serveur).

## Tests

- Unitaires : 284 tests Vitest, tous verts (`npm test`).
- Smoke test manuel : routes /communes, /communes/[code_insee], /api/communes/geojson, /profil/contributions.
- Lint, typecheck : verts.

## Notes pour les chantiers suivants

- `lib/communes/reference.ts` est la couche dédiée au référentiel (distincte de
  `lib/communes/requetes.ts` qui gère les communes libres).
- La résolution code_postal → commune se fait « commune la plus peuplée » ; un code postal sans
  correspondance reste non rattaché (jamais deviné).
- Penser à régénérer `types/database.ts` après l'application de la migration 037 (les types de
  `commune_reference`, `correspondance_cp_insee` et `compteurs_commune` ont été ajoutés à la main
  cette session).

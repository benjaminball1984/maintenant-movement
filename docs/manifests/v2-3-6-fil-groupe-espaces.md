# Manifest — V2 Vague 3, Chantier V2.3.6 : FilDeGroupe sur commune + campagne

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-6-fil-groupe-espaces`
**Base** : `main` (tip `0a5657a`, V2.3.5)

---

## Livré et fonctionnel

Branche le composant transversal **`FilDeGroupe` (V2.2.1, §18)** sur deux espaces existants. Le composant `<FilDeGroupe espaceType="..." espaceId={...} />` lit la table `fil_groupe_message` filtrée par la RLS (membres uniquement via le helper SQL `est_membre_espace`).

- [x] **`/agir/communes/[slug]`** : `FilDeGroupe` ajouté en fin de page, **visible aux seuls membres de la commune** (utilisation conditionnelle `session !== null && dejaMembre`). La RLS `appartenance_commune` filtre déjà les non-membres en BDD ; la condition UI évite d'afficher une section vide aux visiteurs.
- [x] **`/mobiliser/campagnes/[slug]`** : `FilDeGroupe` ajouté en fin de page, **visible aux comptes authentifiés** (la V2.2.1 a posé `est_membre_espace('campagne', ...) → auth.uid() is not null` par défaut, en l'absence de table d'appartenance dédiée aux campagnes). À durcir quand une table d'appartenance campagne sera créée.

## Livré partiellement

- [ ] **Espaces non encore branchés** :
  - `/agir/federations/[slug]` (espaceType=`federation`).
  - GT thématiques (pas de page détail V1 actuellement ? à vérifier).
  - Confédérations.

  Le pattern est trivial à appliquer (~10 lignes par page). Reporté en chantiers ultérieurs.

## Non livré (et pourquoi)

- [ ] **Table d'appartenance campagne** : la V1 n'a pas de table `appartenance_campagne`. Conséquence : tout authentifié peut poster dans le fil d'une campagne, pas seulement ses « participants ». Acceptable comme MVP V2 ; à durcir avec une table d'appartenance dédiée si le besoin se confirme.
- [ ] **Notifications** : les messages postés dans un fil ne déclenchent pas encore de notification aux membres. Demande de coordonner avec `lib/notifications/` (V1 chantier 8.1).

## Décisions techniques prises

- **Condition d'affichage côté UI** : on n'affiche le `<FilDeGroupe>` que si l'utilisateurice est membre (commune) ou authentifiée (campagne). Évite une section vide ou un message « membres uniquement » qui serait redondant avec la RLS.
- **`cheminRevalidation` propagé** : permet à la Server Action `posterDansFilGroupe` de revalider la page contenant le fil après un nouveau post (re-render avec le message ajouté).

## Écarts V1→V2 appliqués

- **Nouveau composant transversal V2 sans pendant V1** : la V1 n'avait pas de fil de discussion par espace (seulement la messagerie DM dans le réseau social V1 chantier 7.5). Greffe additive pure.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (pas de nouveau test — le helper `posterMessageFil` et la validation sont déjà couverts en V2.2.1).
- **Lint Biome** : 454 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Brancher les autres espaces** : fédérations, GT, confédérations. Pattern 10 lignes par page.
- **Table d'appartenance campagne** : à créer pour durcir l'accès au fil + cohérence avec D2 V2 (« espace agrégateur avec membres explicites »).
- **Notifications de fil** : « X a posté dans le fil de votre commune ». Demande un cron ou un trigger côté `notification` V1.
- **Filtrage anti-spam** : si un fil devient bruyant, prévoir une UI de signalement par message (modération V1 a posteriori, branchement à `traiter_signalement` du V2 droits atomiques).

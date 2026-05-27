# Manifest — V2 Vague 3, Chantier V2.3.19 : Helper `nomAffichageRespectantVisibilite`

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-19-nom-affichage-visibilite`
**Base** : `main` (tip `be13877`, V2.3.18)

---

## Livré et fonctionnel

Helper transverse de nommage qui respecte la visibilité réseau V1 (RPC `personne_affichage(cible)` SECURITY DEFINER). Identifié comme manquant dans 3 manifests précédents (V2.3.13, V2.3.15, V2.3.17). Désormais branché partout où on a un `personne_id` à afficher dans les vues réservation.

- [x] **`lib/reseau/identite.ts`** :
  - `IdentiteAffichee` : `{ personneId, numero, prenom, nom, photoUrl }` — chaque champ sensible peut être `null` si la visibilité le masque.
  - `chargerIdentitesAffichables(personneIds)` : batch dédupliqué, une RPC `personne_affichage` par id (parallèle via `Promise.all`). Retourne `Map<string, IdentiteAffichee>`.
  - `nomAffichageRespectantVisibilite(identite)` : produit l'étiquette à afficher. Stratégie : `Prénom Nom` si visible (réutilise `nomAffiche` existant), sinon le numéro M+7, sinon « Membre ».
- [x] **`components/reservation/HistoriqueTransitions.tsx`** : nouvelle prop optionnelle `identites?: Map<string, IdentiteAffichee>`. Affiche « · par X » à côté de la date de chaque transition (« · par système » quand `auteurId IS NULL` — transitions automatiques futures).
- [x] **`app/(membre)/profil/reservations/page.tsx`** : charge les identités des auteurs du journal (utile pour voir QUI a accepté / refusé / marqué réalisée côté propriétaire), les passe à `HistoriqueTransitions`.
- [x] **`app/(membre)/profil/demandes-reservations/page.tsx`** : charge les identités du demandeur + des auteurs du journal. Affiche le nom du demandeur en lien vers son profil réseau (`/s-informer/reseau/[numero]`) si le numéro M+7 est dispo. Avant : « voir dans la messagerie » générique. Maintenant : « Demandeur·euse : Prénom Nom » (ou M+7) avec lien direct.
- [x] **`app/admin/moderation/reservations/page.tsx`** : symétrique côté admin — affiche le demandeur (lien profil) + identités dans l'historique.

## Non livré (et pourquoi)

- [ ] **Affichage du propriétaire de l'offre** : pas affiché côté demandeur (sur `/profil/reservations`). Demanderait une jointure polymorphe pour récupérer `createurice_id` / `organisateur_personne_id` selon `offre_type`. Comme le titre de l'offre est déjà lié vers la page de l'offre (qui montre son créateur), c'est rabattable. Bonus à ajouter si besoin se confirme.
- [ ] **Bénéficiaire interne dans la page caisse** (V2.3.18) : `beneficiairePersonneId` toujours affiché en `Personne XXX…` (id tronqué). Pas branché ici pour rester ciblé sur le cycle réservation. Petit ajout possible : importer `chargerIdentitesAffichables` dans `/admin/national/tresorerie/[caisseId]/page.tsx`.
- [ ] **Photo `photoUrl`** : retournée par la RPC mais pas affichée. Les UI restent textuelles pour ne pas alourdir. À ajouter dans un chantier UX dédié si l'expérience le demande.
- [ ] **Tests unitaires du helper pur** : `nomAffichageRespectantVisibilite` est pure et facilement testable. Ajout possible (4 cas : prénom+nom, prénom seul, nom seul, tout masqué + numéro, tout masqué sans numéro). Petit follow-up.

## Décisions techniques prises

- **Réutilisation de la RPC V1 `personne_affichage`** : ne pas réinventer la visibilité réseau. La fonction `SECURITY DEFINER` connaît déjà la logique « visibilité publique vs cercle commun vs masqué ». L'observateur courant (session.user) est implicite via `auth.uid()` dans la RPC. Le helper côté TS est juste une couche d'orchestration batch.
- **Batch par déduplication d'ids** : `chargerIdentitesAffichables` fait `new Set(ids)` avant l'appel parallèle. Économie de RPC quand plusieurs entrées du journal partagent le même auteur.
- **Une RPC par personne (pas une RPC unique)** : la fonction `personne_affichage` prend une `cible` unique. On pourrait écrire `personne_affichage_lot(cibles[])` mais ça demanderait une migration et l'analyse de complexité (RLS, SECURITY DEFINER avec liste). Pas dans ce chantier. Le pattern N requêtes parallèles est acceptable pour les volumes de listes typiques (10-50 réservations max).
- **`Map` plutôt que `Record<string, ...>`** : aligné avec `chargerTitresOffres` (V2.3.9) et `listerJournauxReservations` (V2.3.15). Cohérence du style « lookup batch » dans le module.
- **« système » pour `auteur_id IS NULL`** : transitions automatiques (futurs cron d'expiration) auront `auteur_id = null`. L'étiquette « par système » est lisible et pertinente.
- **Lien vers `/s-informer/reseau/[numero]` uniquement si numéro disponible** : la RPC retourne `null` quand le profil unifié n'a pas été créé (cas rare, signataires importés avant chantier 13.3-E). Fallback : étiquette en `<span>` non cliquable.

## Écarts V1→V2 appliqués

- **Greffe additive pure** : nouveau module `lib/reseau/identite.ts`, pas de migration. La RPC V1 est consommée telle quelle.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (inchangés).
- **Lint Biome** : 468 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Tests unitaires** : `nomAffichageRespectantVisibilite` est pure ; un fichier `tests/unit/reseau/identite.test.ts` peut couvrir les 4-5 branches en quelques lignes. À faire au prochain chantier qualité.
- **`personne_affichage_lot`** : si la liste devient longue (>100 personnes), poser une RPC batch qui prend un `cibles uuid[]` et retourne une table. Demande migration + soin sur les permissions. Pour l'instant N parallèles tient.
- **Affichage bénéficiaire trésorerie** : ré-utiliser `chargerIdentitesAffichables` dans `/admin/national/tresorerie/[caisseId]/page.tsx` pour les `beneficiairePersonneId` et `initiePersonneId`. Petit ajout cohérent.
- **Tooltip avec numéro M+7** : sur les cas où on affiche le prénom, ajouter `title={identite.numero ?? undefined}` pour faciliter la copie de l'identifiant public. UX bonus.

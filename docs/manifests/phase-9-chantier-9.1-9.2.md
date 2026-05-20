# Manifest : Phase 9, Chantiers 9.1 + 9.2 — Console modération unique + Tableau de bord admin

**Date de fin** : 2026-05-21
**Branche** : `feature/phase-9-chantier-9.1-9.2-admin`
**Commit final** : `À RENSEIGNER PAR LE COMMIT FIX SUIVANT`
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

### 9.1 — Console modération étendue (7 → 11 onglets)

- [x] **Layout `/admin` enrichi** : la nav latérale gagne 6 nouveaux onglets de modération (médias, SEL, marché, moments, sondages, autres-moyens) en plus des 4 existants (pétitions, campagnes, mobilisations, cagnottes). Section « Tableau de bord » ajoutée en haut.
- [x] **6 nouvelles pages de modération** (`app/admin/moderation/...`) :
  - `media` : liste avec statut, lien vers la fiche publique, badge provenance externe.
  - `sel` : prestations en attente de crédit ou contestées (priorité) + liste des services publiés.
  - `marche` : notations 1-2 étoiles en priorité + liste des produits.
  - `moments` : moments parents avec dates.
  - `sondages` : liste avec mode et statut.
  - `autres-moyens` : organisations affichées/retirées avec raison de retrait visible.

### 9.2 — Tableau de bord admin

- [x] **`/admin`** (vue d'ensemble) : 15 cartes de stats globales :
  - personnes, adhérent·es actif·ves, pétitions/mobilisations/cagnottes publiées ;
  - euros et T99CP collectés (somme des dons confirmés) ;
  - services SEL, prestations créditées, produits marché ;
  - moments à venir, médias publiés, sondages ouverts ;
  - communes pré-créées, mandats d'assemblée actifs.
- [x] **`lib/admin/stats.ts`** : 1 fonction `chargerStatsAdmin` qui parallélise 14 `Promise.all` (counts) + 1 select sur les dons confirmés pour sommer EUR/T99CP. Respecte la RLS (donc une personne sans droits voit 0 partout — défense en profondeur).

### Tests

- [x] Lint Biome + typecheck tsc + build Next.js : tous verts.
- [x] Tests unitaires inchangés (**245 verts**) — les pages admin n'ont pas de logique métier isolable.

## Livré partiellement

- [ ] **Actions de modération depuis l'UI** (boutons « publier », « retirer », « clore ») : les Server Actions existent depuis les chantiers précédents (3.1 modérer petition, 3.3 suspendreCagnotte, 4.3 retirerProduit, 5.4 retirerOrganisation, 7.1 retirerMedia, etc.). L'UI dans les pages de modération est en lecture seule pour 9.1 v1. Boutons d'action côté admin viendront en polish.
- [ ] **Filtrage par commune** dans le tableau de bord : les counts sont globaux. Pour un cosec gé / admin local, il faudra ajouter `?commune=<slug>` qui filtre tout sur la commune choisie. Polish.
- [ ] **Export CSV des dons / adhésions** : utile pour la trésorerie / les reçus fiscaux. Polish.

## Non livré (et pourquoi)

- [ ] **Édition des pages éditoriales** (chantier 2.2) : la spec §9 mentionne « édition pages éditoriales » dans le tableau de bord admin. Le chantier 2.2 reste bloqué tant que Lilou/Ben n'a pas fourni les textes des 8 pages. Quand les textes seront là, on ajoutera un éditeur dans `/admin/contenu/...`.
- [ ] **Gestion des catégories marché** : la spec §6F prévoit une arborescence de catégories ; pour l'instant `produit_marche.categorie_slug` est texte libre. Une UI admin de gestion de l'arborescence viendra avec un chantier dédié.
- [ ] **Audit log centralisé** : la table `journal_admin` existe depuis 1.1 mais elle est peu alimentée. Un cron ou des triggers BDD qui consignent automatiquement les actions admin viendraient avec un chantier polish.

## Décisions techniques prises

- **Une seule fonction de stats `chargerStatsAdmin`** parallélisée plutôt qu'une route API par stat : simple, performante, facile à étendre. Vue d'ensemble = 15 cartes en 1 requête réseau.
- **RLS comme défense en profondeur** : le layout admin filtre l'accès (chantier 3.1), mais les requêtes de stats respectent quand même la RLS. Une personne sans droits qui tenterait d'atteindre `/admin` verrait 0 partout (en plus du redirect).
- **Pages de modération en lecture seule v1** : préfère poser proprement les 6 listes en 1 commit plutôt que coupler 6 listes à 6 sets de boutons d'action qui demandent chacun leur composant client + state management. Polish UI dédié pour les boutons.

## Tests

- Unitaires : **245 verts** (inchangés ; les pages admin lisent des stats — pas de validation Zod nouvelle à tester).
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **Polish UI admin** : ajouter les boutons d'action (`<BoutonPublier>`, `<BoutonRetirer>`) sur chaque ligne des listes de modération, qui appellent les Server Actions existantes.
- **Chantier 10.1 (Migration Base44)** : alimentera les compteurs de stats avec les 946 membres + 9k newsletter + 16k signataires importés.
- **Chantier 11.x (Polish + lancement)** : ajouter les filtres par commune + exports CSV + audit log auto.

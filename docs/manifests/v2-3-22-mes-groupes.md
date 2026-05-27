# Manifest — V2 Vague 3, Chantier V2.3.22 : Page « Mes groupes » côté profil

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-22-mes-groupes`
**Base** : `main` (tip `74f8dca`, V2.3.21)

---

## Livré et fonctionnel

Page récapitulative des appartenances actives d'une personne dans le mouvement. Permet de naviguer d'un coup vers toutes les communes/fédérations/confédérations/GT auxquels on appartient — sans devoir chercher dans plusieurs sous-espaces.

- [x] **`lib/mes-groupes.ts` — `listerMesAppartenances(personneId)`** : 4 axes couverts par les tables V1 existantes.
  - Communes libres : direct (`appartenance_commune.personne_id`).
  - Fédérations : indirect — la personne appartient à une fédération **via sa commune**. Charge `appartenance_federation` filtrée par les `commune_id` chargés au préalable. Dédoublonnage car une personne peut être dans 2 communes d'une même fédération.
  - Confédérations : indirect — pivot sur l'`id` de `appartenance_federation` qui est référencé par `appartenance_confederation.federation_id` (donc l'`id` de l'appartenance, pas l'`id` de la fédération ; cf. fix V2.3.8). Idem dédoublonnage.
  - GT thématiques : direct (`appartenance_gt.personne_id`).
  - Triés par `rejointe_le` ascendant (les plus anciennes d'abord).
- [x] **`app/(membre)/profil/mes-groupes/page.tsx`** : Server Component. 4 sections (Communes, Fédérations, Confédérations, GT thématiques) avec compteur dans le titre. Chaque entrée = carte avec nom (lien cliquable) + type + date d'entrée.
- [x] **`app/(membre)/profil/NavOnglets.tsx`** : onglet « Mes groupes » ajouté en 3ᵉ position (entre Informations et Communes).

## Non livré (et pourquoi)

- [ ] **Groupes d'entraide locaux (V2.3.2)** : la table `appartenance_groupe_entraide` n'existe pas encore. À ajouter quand le besoin se confirme (la doctrine V2.3.2 traite les groupes comme nouveau sous-espace, mais l'appartenance n'est pas encore typée — sans doute parce que le périmètre des « membres d'un groupe d'entraide » reste à définir). Mentionné dans le manifest V2.3.2.
- [ ] **Campagnes** : pas de table `appartenance_campagne`. Mentionné dans V2.3.6. À ajouter avec un chantier dédié.
- [ ] **Page publique GT thématique** : la table `gt_thematique` existe (depuis chantier 1.1) mais aucune route `/co-construire/[slug]` ou `/gt-thematiques/[slug]` n'a été livrée. Les noms s'affichent en texte non cliquable dans cette page pour l'instant. Chantier de route GT à venir.
- [ ] **Confédérations individuelles** : pas de route `/agir/confederations/[slug]`. Le lien renvoie à la page de liste `/agir/confederations`. À étendre quand la page individuelle sera livrée.
- [ ] **Rôle dans le groupe** : la table `appartenance_commune` n'a pas (encore) de colonne `role` (cosec/référent·e/membre). On affiche seulement « membre depuis le … ». Quand la matrice de rôles V2 sera branchée à ces tables, ajouter un Badge.
- [ ] **Historique des appartenances quittées** : on filtre sur `est_active = true`. Voir l'historique demande un toggle « voir aussi les groupes quittés » qui n'est pas dans ce chantier.

## Décisions techniques prises

- **2 vagues de requêtes plutôt qu'un join géant** : on charge d'abord les communes/GT en parallèle, puis on dérive les fédérations/confédérations à partir des `commune_id`. C'est 4 requêtes pour les 4 axes au lieu d'un join SQL complexe. Acceptable : volumes individuels modérés (typiquement 1-3 communes par personne, 1-2 fédérations).
- **Dédoublonnage applicatif** : `dedupParId(liste)` après les jointures fédération/confédération. Une personne dans 2 communes d'une même fédération ne doit pas voir la fédération en double.
- **Filter type-guards** pour les jointures Supabase : le typage retourné par `select('commune:commune(...)')` est `{ commune: T | null }`. On filtre avec un type-predicate avant le `.map` pour que TypeScript narrow correctement.
- **Lien commune `/agir/communes/[slug]`** plutôt que `/communes/[code_insee]` (V2 13.3-C) : on ne charge pas le code INSEE dans la sous-query, et la route legacy est universelle. Si on veut basculer plus tard, charger aussi `code_insee` et préférer la nouvelle route quand dispo.
- **Lien GT vide** : page d'accueil GT thématique pas encore livrée. Plutôt que de mettre un lien mort, on rend le nom en texte. Le code regarde `a.href !== ''` (sentinelle string vide → pas de lien).

## Écarts V1→V2 appliqués

- **Page de profil consolidée** : la V1 n'avait pas de page récapitulative. Greffe additive pure, pas de modification de schéma.

## Tests

- **Unitaires (Vitest)** : 38 fichiers, **413 tests verts** (inchangés ; le helper fait des appels Supabase, couverture par tests E2E à venir).
- **Lint Biome** : 472 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.

## Notes pour les chantiers suivants

- **Table `appartenance_campagne`** : à poser dans un chantier dédié. Définit qui rejoint une campagne (au-delà des signataires implicites).
- **Table `appartenance_groupe_entraide`** : symétrique pour V2.3.2.
- **Rôle dans le groupe** : poser une colonne `role` ou une table fille `role_appartenance` pour distinguer cosec, référent·e, membre simple. Étend la matrice de droits V2.1.3.
- **Carte interactive « Mes groupes »** : afficher les communes sur une mini-carte. Bonus UX.
- **Page individuelle GT thématique** : route `/co-construire/[slug]` ou `/gt-thematiques/[slug]` avec présentation + FilDeGroupe (V2.2.1 prêt pour ça).

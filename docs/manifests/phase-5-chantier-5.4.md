# Manifest : Phase 5, Chantier 5.4 — D'autres moyens d'agir

**Date de fin** : 2026-05-21
**Branche** : `feature/phase-5-chantier-5.4-autres-moyens`
**Commit final** : `38a2021`
**Durée approximative** : 1 session Claude Code (court chantier)

---

## Livré et fonctionnel

### Schéma BDD (migration 030)

- [x] **Table `organisation_partenaire`** : nom, slug, url (regex `^https?://`), description courte, catégorie texte libre, statut `affichee | retiree`, raison de retrait + retiree_par + retire_le. RLS : lecture publique des organisations affichées, insertion réservée admin + modérateurice `autres_moyens`, retrait pareil. Pas d'ajout libre par les usager·ères (décision politique : présomption d'utilité côté admin).

### Code applicatif

- [x] **Types Database** : `OrganisationPartenaire`, union `StatutOrganisationPartenaire`.
- [x] **Validations Zod** (`lib/validations/autres-moyens.ts`) : `ajouterOrganisationPartenaire`, `retirerOrganisation` (raison ≥ 10 chars).
- [x] **Server Actions** (`app/(public)/agir/autres-moyens/actions.ts`) : `ajouterOrganisationPartenaire` (admin ou modérateurice), `retirerOrganisation` (pareil + raison de retrait conservée pour audit).
- [x] **Couche de requêtes** (`lib/autres-moyens/requetes.ts`) : `listerOrganisationsPartenaires` (toutes affichées triées par nom) et `listerOrganisationsParCategorie` (Map<categorie, liste>) pour le rendu groupé.

### Pages

- [x] **`/agir/autres-moyens`** : page sobre, listes groupées par catégorie. Liens externes en `target="_blank" rel="noopener noreferrer"`. Note de bas de page « Distance protectrice » qui rappelle l'absence d'endossement et invite à signaler via la page contact.

### Tests

- [x] **6 nouveaux tests unitaires** (`tests/unit/validations/autres-moyens.test.ts`) : ajout valide, refus URL invalide / catégorie avec espaces, retrait raison courte / valide. Total **232 tests verts** (+6).
- [x] **E2E Playwright** (`tests/e2e/autres-moyens.spec.ts`) : 2 scénarios (rendu + note distance protectrice).
- [x] **Lint Biome + typecheck tsc + build Next.js** : tous verts.

## Livré partiellement

- [ ] **Console admin pour ajouter / retirer une organisation** : les Server Actions sont prêtes ; l'UI dédiée dans `/admin/moderation/autres-moyens` (formulaire d'ajout et liste éditable) viendra avec le chantier 9.1 (console modération unique). Pour 5.4, l'ajout se fait par insertion SQL directe ou via le futur backoffice.

## Non livré (et pourquoi)

- [ ] **Sélection des premières organisations à afficher** : la spec §7D ne fournit pas la liste initiale (cf. CLAUDE.md §3, « organisations partenaires sauf fournies explicitement »). Lilou/Ben devra fournir la liste de départ ; elle sera insérée via la console admin (chantier 9.1).
- [ ] **Workflow de signalement utilisateurice** : la note de bas de page renvoie vers `/contact`. Un système formel de signalement (avec ticket) viendra avec le chantier 9.x.

## Contenus à arbitrer

- [ ] **Liste initiale des organisations partenaires** : 0 organisation affichée pour le moment. Lilou/Ben fournira la liste ; chaque ajout doit respecter la spec §7D (mix progressif modéré → activiste, présomption d'utilité, distance protectrice).

## Décisions techniques prises

- **Ajout réservé admin/modé enforced par RLS** : pas d'insertion libre, conforme à la spec §7D « présomption d'utilité » (qui est portée par la modération, pas par les usager·ères).
- **Pas de table de signalement dédiée** : le formulaire de contact existant suffit pour 5.4. Une table `signalement_orga_partenaire` pourrait être ajoutée si le volume de demandes le justifie.
- **Distance protectrice rendue visible** dans le rendu : la note de bas de page rappelle explicitement l'absence d'endossement et l'option de signalement. Conformité §7D (« ne pas être éclaboussé·es par les dérapages des organisations listées »).

## Tests

- Unitaires : **232 tests verts** (+6 pour 5.4).
- E2E Playwright : 2 scénarios.
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **Chantier 9.1 (Console modération)** : ajouter l'onglet `autres-moyens` avec formulaire d'ajout + liste éditable + bouton « retirer » qui pose la raison de retrait.
- **Newsletter** : pas de ciblage particulier pour les organisations partenaires (cf. distance protectrice : on ne pousse pas leurs causes).

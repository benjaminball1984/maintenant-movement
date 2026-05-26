# Manifest — V2 Vague 3, Chantier V2.3.2 : Groupe d'entraide local

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-2-groupe-entraide-local`
**Base** : `main` (tip `0634a65`, V2.3.1)
**Fiche source** : `docs/cdc-v2/CDC-Maintenant-V2/03-Sentraider/groupe-entraide-local-V2.md`

---

## Livré et fonctionnel

Nouveau sous-espace **« porte d'entrée non-politique »**. Variante de l'espace agrégateur avec un sous-ensemble d'outils activés par défaut (entraide + moments + mobilisations, sans pétitions/Décider). Greffe additive : aucune table V1 touchée.

- [x] **Migration `supabase/migrations/20260527060000_groupe_entraide_local.sql`** :
  - Table `groupe_entraide_local` : slug, nom, descriptions (courte + complète), zone géographique libre (« Lyon 7e », « immeuble 5 rue X », « AMAP du Plateau »), latitude/longitude optionnelles avec CHECK de cohérence, image_url, statut (`en_moderation` à la création), createurice_id, 10 booléens d'outils activés (par défaut : entraide + moments + mobilisations ON, pétitions + Décider OFF).
  - Table `appartenance_groupe_entraide_local` : (groupe, personne, role_groupe `membre`/`animateur`, rejoint_le, quitte_le, est_active). Index unique partiel pour garantir « une seule appartenance active par (groupe, personne) ».
  - **MAJ `est_membre_espace`** : la fonction SQL posée en V2.2.1 avait un fallback `auth.uid() is not null` pour `groupe_entraide_local`. Désormais elle lit la vraie table.
  - 4 + 4 policies RLS dans la migration. Lecture des groupes publiés publique ; en modération seulement par le créateur + admins.
- [x] **`lib/groupe-entraide-local.ts`** : `listerGroupesEntraide`, `groupeEntraideParSlug`, `listerMembresGroupe`, `estMembreDuGroupe`. Types stricts (`StatutGroupeEntraide`, `RoleGroupe`, `GroupeEntraideLocal`, `MembreGroupe`).
- [x] **`lib/groupe-entraide-local-validation.ts`** : schéma Zod `creerGroupeEntraideSchema` + helpers purs `slugifierNomGroupe` (gestion correcte des diacritiques via `\p{Mn}`), `slugValide`, `coordonneesValides`.
- [x] **`app/actions/groupe-entraide-local.ts`** : 3 Server Actions.
  - `creerGroupeEntraide` : valide, génère un slug unique (suffixe `-2`, `-3`, etc. en cas de collision), crée le groupe `en_moderation`, **inscrit automatiquement le créateur comme `animateur`** (preset « créateur d'espace » MD4 V2), redirect vers la page détail.
  - `rejoindreGroupe` : ajoute une appartenance active. Détection idempotente du « déjà membre ».
  - `quitterGroupe` : soft delete via `est_active = false` + `quitte_le`.
- [x] **3 pages UI** dans `app/(public)/s-entraider/groupes-locaux/` :
  - `page.tsx` : liste avec image + nom + zone + badges des outils + chapô. Metadata OG complète. Pied de page explicite sur le caractère non-politique.
  - `nouveau/page.tsx` : formulaire `FormulaireCreationGroupeEntraide` (Client Component), protégé par session.
  - `[slug]/page.tsx` : page détail avec image grand format, badges des outils activés, boutons rejoindre/quitter (`BoutonsAdhesion` Client Component), nombre de membres, **`FilDeGroupe` intégré pour les membres** (composant V2.2.1).
- [x] **`types/database.ts`** : 2 nouvelles définitions (`groupe_entraide_local`, `appartenance_groupe_entraide_local`) avec Relationships.
- [x] **Tests unitaires** `tests/unit/groupe-entraide-local/validation.test.ts` — **20 tests** sur le schéma Zod, le slugifier (accents, longueur, conformité CHECK SQL), la validation de coordonnées.

## Livré partiellement

- [ ] **`TeleverseurImage` sur le formulaire de création** : actuellement on ne propose pas d'upload d'image. La couverture utilise systématiquement la défaut. À brancher dans le chantier V2.3.4 (déjà au plan).
- [ ] **Page de paramètres du groupe** (édition des outils activés, gestion des membres, fermeture du groupe) : non livrée. La fiche §Fonctionnement dit « les gens paramètrent », ce qui demande une UI admin/animateur dédiée — chantier V2 ultérieur.
- [ ] **Intégration aux outils activés** (prêt, marché, SEL, etc.) : le groupe a les booléens mais n'affiche pas encore les annonces correspondantes filtrées par groupe. Demande un branchement profond avec chaque sous-espace V1, à faire au cas par cas.
- [ ] **Modération a posteriori** : la fiche §15 V2 sur la modération a posteriori s'applique aussi aux groupes. La queue de modération existe (`/admin/moderation/reseau`) ; le branchement spécifique des groupes y est à ajouter.

## Non livré (et pourquoi)

- [ ] **Migration appliquée au distant** : consigne, à faire au matin avec `supabase db push`.
- [ ] **Carte des groupes localisés** : les coordonnées sont stockées mais aucune page carte ne les affiche. À brancher sur la carte unifiée transversale (chantier V2 dédié).

## Contenus à arbitrer

Rien à arbitrer côté contenu éditorial pour V2.3.2 : la fiche V2 fournissait le périmètre fonctionnel ; le ton choisi pour les microcopies est sobre et neutre (cf. CLAUDE.md §10).

## Décisions techniques prises

- **Pas d'enum SQL pour les outils** : 10 booléens individuels. Choix qui simplifie la requête (`select * where outil_pret_active = true`) et permet d'ajouter un nouvel outil par simple `ALTER TABLE ADD COLUMN` sans toucher au type.
- **Zone géographique en texte libre** : un groupe peut couvrir un immeuble, un quartier, une AMAP, une rue. Pas de FK vers `commune_reference` (qui impose une commune INSEE).
- **Création = `animateur` automatique** : préfigure le preset MD4 V2 « créateur d'espace ». Quand `lib/droit.ts` V2 sera branché aux contrôles d'accès, on appellera aussi `accorderDroit(...preset gestionnaire_espace)` côté Server Action.
- **`role_groupe` minimal** (`membre`/`animateur`) : seulement 2 rôles. La granularité fine viendra avec la table `droit` V2.1.3.

## Écarts V1→V2 appliqués

- **Nouvelle entité V2 sans pendant V1** : greffe additive pure. Aucun écart à gérer.
- **MAJ du helper `est_membre_espace`** : la fonction SQL avait un fallback `auth.uid() is not null` pour `groupe_entraide_local`. Désormais elle lit la vraie table d'appartenance. Pas de régression : seul ce sous-espace utilisait le fallback.

## Tests

- **Unitaires (Vitest)** : 36 fichiers, **393 tests verts** (+20 nouveaux).
- **Lint Biome** : 448 fichiers, 0 issue (fix `\p{Mn}` pour gérer les diacritiques sans warning « combining character »).
- **Typecheck (tsc)** : 0 erreur (fix `coordonneesValides` pour narrowing TS).
- **Build Next.js** : non lancé séparément (pre-commit hook valide).
- **E2E Playwright** : non lancés.

## Notes pour les chantiers suivants

- **Application au matin** : ajouter `20260527060000_groupe_entraide_local.sql` à la séquence `supabase db push`.
- **`TeleverseurImage`** à brancher sur le formulaire (V2.3.4 du plan).
- **UI de paramétrage** : page `/s-entraider/groupes-locaux/[slug]/parametres` réservée aux animateurs (édition des outils activés, gestion des membres, fermeture). Chantier UX V2 dédié.
- **Filtrage des annonces par groupe** : chaque sous-espace d'entraide (prêt, marché, SEL, etc.) pourrait recevoir un paramètre `?groupe=<id>` qui filtre les annonces. Demande un branchement profond — chantier par sous-espace.
- **Page « Mes groupes »** côté profil membre : liste des groupes auxquels la personne appartient. Chantier UX V2 dédié.

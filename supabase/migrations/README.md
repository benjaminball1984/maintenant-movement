# supabase/migrations/

Migrations SQL versionnées du schéma Maintenant!.

## Convention de nommage

`YYYYMMDDHHMMSS_description.sql` (format Supabase CLI standard).

Le numéro horodaté garantit un ordre d'application déterministe entre
environnements. La description en snake_case français résume le contenu
de la migration.

## Convention de contenu

- **Une migration par groupe logique** (une table principale + ses index,
  ses triggers, son activation RLS).
- **Politiques RLS séparées** dans un fichier dédié (`_rls_policies.sql`)
  une fois que les helpers SQL sont disponibles.
- **Tout commentaire métier en français**, les mots-clés SQL en
  minuscules.
- **`ENABLE ROW LEVEL SECURITY`** sur chaque table publique avec données
  personnelles ou sensibles. Les politiques sont posées dans la migration
  RLS finale.
- **Conventions de nommage** : tables et colonnes métier en
  snake_case français (`commune`, `appartenance_commune`, `code_postal`),
  colonnes techniques en anglais (`created_at`, `updated_at`).

## Appliquer en local

Une fois Supabase CLI installé (`npm i -g supabase` ou via Homebrew),
linker le projet :

```bash
supabase login
supabase link --project-ref <ref-projet-supabase>
supabase db push
```

`db push` applique toutes les migrations non encore appliquées sur le
projet distant lié. Pour réinitialiser un environnement local (Docker) :
`supabase db reset`.

## Régénérer les types TypeScript

Une fois le projet lié, à exécuter après chaque migration :

```bash
supabase gen types typescript --linked > types/database.ts
```

Pour le chantier 1.1, `types/database.ts` est écrit à la main (le projet
Supabase n'est pas encore créé). La régénération automatique remplace le
contenu dès que possible.

## Migrations du chantier 1.1

| Fichier | Contenu |
|---|---|
| `20260520120001_extensions.sql` | Extension `pgcrypto`. |
| `20260520120002_personne.sql` | Table `personne` (RGPD complet, trigger `updated_at`). |
| `20260520120003_commune.sql` | Table `commune` (slug, géoloc, statut_creation). |
| `20260520120004_appartenance_commune.sql` | N-N + triggers max-3 et anti-spam 1 transition/mois. |
| `20260520120005_federation.sql` | `federation` + `appartenance_federation`. |
| `20260520120006_confederation.sql` | `confederation` + `appartenance_confederation`. |
| `20260520120007_gt_thematique.sql` | `gt_thematique` + `appartenance_gt`. |
| `20260520120008_droit_admin.sql` | Permissions admin (6 niveaux dont DPD). |
| `20260520120009_journal_admin.sql` | Audit log RGPD (conservation 3 ans). |
| `20260520120010_helpers.sql` | Fonctions `security definer` (est_admin_*, est_membre_*, est_dpd). |
| `20260520120011_rls_policies.sql` | Politiques RLS sur toutes les tables. |

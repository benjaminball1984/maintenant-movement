# supabase/

Migrations SQL et seed data du projet Supabase Maintenant! (région Francfort).

- `migrations/` : migrations versionnées (voir [migrations/README.md](migrations/README.md) pour la convention de nommage, l'application en local et la régénération des types TypeScript). Les 11 migrations du chantier 1.1 posent le schéma initial : `personne`, `commune`, `appartenance_commune`, `federation`, `confederation`, `gt_thematique`, `droit_admin`, `journal_admin`, les helpers SQL et les politiques RLS.
- `seed.sql` (à venir) : cartographie de 2100-2300 communes pré-créées, importée au **chantier 5.2** depuis le CSV fourni par Lilou/Ben.

Backup avant migration en prod : Supabase le fait automatiquement.

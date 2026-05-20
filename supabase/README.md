# supabase/

Migrations SQL et seed data.

- `migrations/` : numérotation horodatée. Migrations reproductibles et idempotentes quand possible. Première migration au **chantier 1.1** (entités `personne`, `commune`, `appartenance_commune`, `federation`, `gt_thematique`, `confederation`, `droit_admin`, `journal_admin`).
- `seed.sql` (à venir) : cartographie 2100-2300 communes pré-créées, importée au **chantier 5.2** depuis le CSV fourni par Lilou/Ben.

Backup avant migration en prod (Supabase le fait automatiquement).

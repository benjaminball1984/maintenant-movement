# supabase/

Migrations SQL du projet Supabase Maintenant! (région Francfort).

- `migrations/` : 33 migrations versionnées (voir `migrations/README.md` pour la convention de nommage, l'application en local et la régénération des types TypeScript).
  - Migrations 001 à 011 : schéma initial (chantier 1.1) — `personne`, `commune`, `appartenance_commune`, `federation`, `confederation`, `gt_thematique`, `droit_admin`, `journal_admin`, helpers SQL, policies RLS centralisées.
  - Migrations 012 à 033 : un domaine fonctionnel par chantier ultérieur (pétitions, mobilisations, campagnes, cagnottes, entraide, SEL, marché, adhésion, moments solidaires, médias, sondages, notifications).

## Lancement local

```bash
supabase db push
```

## Régénération des types TypeScript

Les types `types/database.ts` sont générés via Supabase CLI à chaque modification de schéma.

## Backup

Avant tout déploiement de migration en prod :

```bash
supabase db dump > backup-AAAA-MM-JJ.sql
```

Supabase Cloud fait un backup quotidien automatique (rétention 7 jours en plan free).

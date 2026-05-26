-- Fix du helper SQL `est_membre_espace` (cycle V2, chantier V2.3.8).
--
-- Bug latent introduit en V2.2.1 (migration `20260527030000_fil_groupe.sql`) :
-- le helper référençait des colonnes qui n'existent pas sur certaines
-- tables d'appartenance V1.
--
-- - `appartenance_federation` lie une COMMUNE à une fédération (pas une
--   personne directement). Le helper lisait `personne_id` qui n'existe
--   pas → SQL invalide à la première exécution sur `federation`.
-- - `appartenance_confederation` lie une FÉDÉRATION à une confédération
--   (pas une personne). Idem.
-- - `appartenance_gt` a bien `personne_id` mais la colonne s'appelle
--   `gt_thematique_id`, pas `gt_id` comme dans le helper V2.2.1.
--
-- Personne n'a consommé `est_membre_espace('federation' | 'confederation' |
-- 'gt_thematique', ...)` côté applicatif jusqu'à V2.3.8 (qui voulait
-- l'afficher sur la page détail fédération). Le bug est donc passé en
-- review.
--
-- Cette migration `CREATE OR REPLACE FUNCTION` remplace le corps du
-- helper avec :
-- - **`federation`** : jointure transitive via `appartenance_commune` →
--   `appartenance_federation`. Une personne est membre d'une fédération
--   si elle est membre d'au moins une commune rattachée à cette fédération.
-- - **`confederation`** : double jointure transitive `appartenance_commune`
--   → `appartenance_federation` → `appartenance_confederation`.
-- - **`gt_thematique`** : utilise désormais `gt_thematique_id` (et non
--   `gt_id` qui n'existe pas).
--
-- Greffe additive : aucune table touchée, aucun schéma cassé. Juste le
-- corps de la fonction qui devient cohérent.
--
-- À appliquer avec `supabase db push`. Non appliquée distant cette nuit.

create or replace function public.est_membre_espace(
  espace_type_a_verifier text,
  espace_id_a_verifier uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case espace_type_a_verifier
    when 'commune' then
      exists (
        select 1 from public.appartenance_commune
        where personne_id = auth.uid()
          and commune_id = espace_id_a_verifier
          and est_active = true
      )
    when 'federation' then
      exists (
        select 1
        from public.appartenance_commune ac
        join public.appartenance_federation af
          on af.commune_id = ac.commune_id
         and af.est_active = true
        where ac.personne_id = auth.uid()
          and ac.est_active = true
          and af.federation_id = espace_id_a_verifier
      )
    when 'confederation' then
      exists (
        select 1
        from public.appartenance_commune ac
        join public.appartenance_federation af
          on af.commune_id = ac.commune_id
         and af.est_active = true
        join public.appartenance_confederation aconf
          on aconf.federation_id = af.federation_id
         and aconf.est_active = true
        where ac.personne_id = auth.uid()
          and ac.est_active = true
          and aconf.confederation_id = espace_id_a_verifier
      )
    when 'gt_thematique' then
      exists (
        select 1 from public.appartenance_gt
        where personne_id = auth.uid()
          and gt_thematique_id = espace_id_a_verifier
          and est_active = true
      )
    when 'groupe_entraide_local' then
      exists (
        select 1 from public.appartenance_groupe_entraide_local
        where personne_id = auth.uid()
          and groupe_id = espace_id_a_verifier
          and est_active = true
      )
    -- Pas d'appartenance dédiée pour campagne en V1 : fallback ouvert.
    when 'campagne' then auth.uid() is not null
    else false
  end;
$$;

comment on function public.est_membre_espace(text, uuid) is
  'Vérifie l''appartenance d''une personne à un espace. V2.3.8 : helper corrigé pour fédération/confédération/gt_thematique (jointures transitives + bon nom de colonne).';

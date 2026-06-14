-- ============================================================
-- Sondages à CHOIX MULTIPLE (demande Ben 2026-06-14).
-- Additif et rétro-compatible : le choix unique existant n'est pas touché.
--   - sondage.choix_multiple : drapeau (défaut false).
--   - reponse_sondage.options_choisies : tableau d'index d'options choisies
--     (null pour un vote à choix unique, qui garde option_index).
--   - option_index devient nullable (un vote multi-choix n'en a pas).
--   - la vue sondage_resultats déplie options_choisies pour compter par option.
-- ============================================================

alter table public.sondage
  add column if not exists choix_multiple boolean not null default false;

comment on column public.sondage.choix_multiple is
  'Vrai si le sondage autorise plusieurs réponses par votant·e (cases à cocher). Défaut : choix unique.';

alter table public.reponse_sondage
  add column if not exists options_choisies integer[];

comment on column public.reponse_sondage.options_choisies is
  'Index des options choisies pour un sondage à choix multiple (null pour le choix unique, qui utilise option_index).';

-- Un vote multi-choix n'a pas d'option_index unique.
alter table public.reponse_sondage
  alter column option_index drop not null;

-- Garde-fou : un vote doit porter au moins une réponse.
alter table public.reponse_sondage
  drop constraint if exists reponse_sondage_au_moins_une;
alter table public.reponse_sondage
  add constraint reponse_sondage_au_moins_une
  check (option_index is not null or (options_choisies is not null and array_length(options_choisies, 1) >= 1));

-- Vue d'agrégation : compte les votes par option, en dépliant le choix multiple.
create or replace view public.sondage_resultats as
select s.sondage_id, s.option_index, count(*)::int as nombre_votes
from (
  select r.sondage_id,
         coalesce(oc.option_index, r.option_index) as option_index
  from public.reponse_sondage r
  left join lateral unnest(coalesce(r.options_choisies, '{}'::integer[])) as oc(option_index) on true
) s
where s.option_index is not null
group by s.sondage_id, s.option_index;

comment on view public.sondage_resultats is
  'Agrégation des votes par sondage et par option. Choix unique : 1 ligne par vote. Choix multiple : 1 ligne par option choisie (le total des compteurs dépasse le nombre de votant·es).';

grant select on public.sondage_resultats to anon, authenticated;

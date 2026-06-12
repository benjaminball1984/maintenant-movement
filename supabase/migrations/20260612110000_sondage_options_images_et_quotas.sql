-- Migration : sondages V2 (revue 2026-06-12, demandes Lilou/Ben).
--
--   1. Jusqu'à 20 options par sondage (au lieu de 10) : « noter les options
--      dans le cadre ne suffit pas [...] il faut augmenter le nombre
--      d'options jusqu'à 20 ».
--   2. Une image OPTIONNELLE par option : tableau `options_images` parallèle
--      à `options` (même longueur quand il est présent, éléments null
--      autorisés pour les options sans image). On ADDITIONNE une colonne,
--      `options` reste la source de vérité des libellés (doctrine de greffe).
--   3. Pondération : « ce n'est pas le créateur qui décide si le sondage est
--      pondéré ; il s'affiche en brut d'office tant qu'il n'y a pas assez de
--      données et en pondéré d'office dès qu'il y en a assez ; un toggle
--      permet au visiteur de choisir sa vue ». Le calcul par quotas se fait
--      côté app à partir d'un agrégat par tranche d'âge : nouvelle vue
--      SANS donnée personnelle (comptes agrégés uniquement, ni code postal
--      ni pronom ni genre). La colonne `mode` est CONSERVÉE (historique,
--      console admin) mais l'affichage ne s'en sert plus.

-- 1. Élargissement du nombre d'options : 2 à 20.
alter table public.sondage
  drop constraint sondage_options_nombre;
alter table public.sondage
  add constraint sondage_options_nombre
  check (array_length(options, 1) between 2 and 20);

-- 2. Images par option (tableau parallèle, nullable).
alter table public.sondage
  add column if not exists options_images text[];

comment on column public.sondage.options_images is
  'Images optionnelles des options, tableau PARALLÈLE à `options` (même longueur quand présent, éléments null autorisés). Null = aucune option illustrée.';

alter table public.sondage
  add constraint sondage_options_images_coherentes
  check (
    options_images is null
    or array_length(options_images, 1) = array_length(options, 1)
  );

-- 3. Agrégat par tranche d'âge pour la pondération par quotas côté app.
--    Lecture publique : transparence des résultats, aucune donnée
--    individuelle (mêmes garanties que la vue sondage_resultats).
create or replace view public.sondage_resultats_par_tranche as
select
  r.sondage_id,
  r.option_index,
  r.tranche_age,
  count(*)::int as nombre_votes
from public.reponse_sondage r
group by r.sondage_id, r.option_index, r.tranche_age;

comment on view public.sondage_resultats_par_tranche is
  'Votes agrégés par sondage, option et tranche d''âge déclarée (null = non renseignée). Sert au redressement par quotas côté app (brut d''office sous 300 répondant·es, pondéré d''office au-delà, bascule visiteur).';

grant select on public.sondage_resultats_par_tranche to anon, authenticated;

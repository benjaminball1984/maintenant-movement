-- ============================================================================
-- V2.6.125 — un cinquième emplacement à la une : le sondage
-- ============================================================================
--
-- Contexte (décision Lilou/Ben du 15/08/2026) : la une de la page d'accueil
-- ne montre plus QUE ce que l'administration a choisi (fini le repli
-- automatique sur le contenu le plus récent). Le bloc « sondage » était le
-- seul des cinq à ne pas être épinglable : il prenait d'office le dernier
-- sondage ouvert. On lui ouvre donc le même mécanisme qu'aux autres.
--
-- Ce que fait cette migration :
--   1. élargit la contrainte de la table `une_home` (liste des emplacements
--      autorisés) pour accepter 'sondage' ;
--   2. élargit la même liste dans la fonction d'épinglage `definir_une_home`.
--
-- GREFFE ADDITIVE (CLAUDE.md §0.3) : on n'enlève aucun emplacement existant,
-- aucune ligne n'est supprimée, aucune donnée n'est touchée. La contrainte
-- est recréée avec une valeur EN PLUS, ce qui ne peut invalider aucune
-- ligne déjà présente.
--
-- Idempotente : rejouable sans erreur.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. La table accepte l'emplacement « sondage »
-- --------------------------------------------------------------------------
alter table public.une_home
  drop constraint if exists une_home_emplacement_valide;

alter table public.une_home
  add constraint une_home_emplacement_valide check (emplacement in (
    'petition', 'article', 'mobilisation', 'cagnotte', 'sondage'
  ));

-- --------------------------------------------------------------------------
-- 2. La fonction d'épinglage accepte le même emplacement
--    (elle porte sa propre liste blanche, en plus de la contrainte)
-- --------------------------------------------------------------------------
create or replace function public.definir_une_home(p_emplacement text, p_objet_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.est_admin_general() then
    return false;
  end if;
  if p_emplacement not in ('petition', 'article', 'mobilisation', 'cagnotte', 'sondage') then
    return false;
  end if;
  insert into public.une_home (emplacement, objet_id, defini_par, updated_at)
    values (p_emplacement, p_objet_id, auth.uid(), now())
    on conflict (emplacement)
      do update set objet_id = excluded.objet_id, defini_par = auth.uid(), updated_at = now();
  return true;
end;
$$;

comment on function public.definir_une_home(text, uuid) is
  'Épingle un contenu à la une de la home pour un emplacement (admin) : petition, article, mobilisation, cagnotte, sondage.';

revoke execute on function public.definir_une_home(text, uuid) from public;
grant execute on function public.definir_une_home(text, uuid) to authenticated, service_role;

comment on table public.une_home is
  'Contenu épinglé à la une de la home par emplacement. Sans épinglage, l''emplacement reste vide (décision Lilou/Ben du 15/08/2026 : aucune mise à la une automatique).';

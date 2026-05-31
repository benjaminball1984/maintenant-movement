-- ============================================================================
-- Revue 2026 (correctif C15) — Soft-delete du lien « porté par » (cohérence fork).
-- ============================================================================
--
-- Cohérence avec la doctrine §4 (« fork = couper un lien sans rien détruire ») :
-- retirer le rattachement contenu ↔ organisation ne DÉTRUIT plus la ligne mais
-- pose `retire_le`. Un re-rattachement réactive le lien (retire_le = null). La
-- lecture publique ignore les liens retirés (lib/organisations/liaisons.ts).
--
-- Migration ADDITIVE (colonne) + remplacement de 2 fonctions existantes (logique
-- inchangée hormis DELETE -> UPDATE retire_le). Cible la table contenu_organisation
-- (chantier B), absente de la base de démo LOCALE : s'applique au distant en Phase M.
-- ============================================================================

alter table public.contenu_organisation
  add column if not exists retire_le timestamptz;

comment on column public.contenu_organisation.retire_le is
  'Soft-delete (C15) : horodatage du retrait du rattachement. NULL = lien actif.';

-- Déclarer : (re)pose le lien et le RÉACTIVE s'il avait été retiré (retire_le = null).
create or replace function public.declarer_contenu_organisation(
  p_objet_type text,
  p_objet_id uuid,
  p_org_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.est_gestionnaire_espace('organisation', p_org_id) then
    return false;
  end if;
  if p_objet_type not in ('petition', 'cagnotte', 'mobilisation', 'campagne', 'sondage', 'moment') then
    return false;
  end if;
  insert into public.contenu_organisation (objet_type, objet_id, organisation_id, declare_par)
    values (p_objet_type, p_objet_id, p_org_id, auth.uid())
    on conflict (objet_type, objet_id)
      do update set organisation_id = excluded.organisation_id,
                    declare_par = auth.uid(),
                    retire_le = null;
  return true;
end;
$$;

-- Retirer : soft-delete (pose retire_le) au lieu de supprimer la ligne.
create or replace function public.retirer_contenu_organisation(p_objet_type text, p_objet_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org
    from public.contenu_organisation
    where objet_type = p_objet_type and objet_id = p_objet_id and retire_le is null;
  if not found then
    return false;
  end if;
  if not (public.est_gestionnaire_espace('organisation', v_org) or public.est_admin_general()) then
    return false;
  end if;
  update public.contenu_organisation
    set retire_le = now()
    where objet_type = p_objet_type and objet_id = p_objet_id;
  return true;
end;
$$;

grant execute on function public.declarer_contenu_organisation(text, uuid, uuid) to authenticated, service_role;
grant execute on function public.retirer_contenu_organisation(text, uuid) to authenticated, service_role;

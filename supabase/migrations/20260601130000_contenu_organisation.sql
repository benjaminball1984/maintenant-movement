-- ============================================================================
-- Chantier V2.6.16 (épopée réseau V2, chantier B.4) — Contenus portés par une organisation
-- ============================================================================
--
-- Cf. docs/specs/09_RESEAU-SOCIAL-V2.md §7.2 / §7.3.
--
-- Un contenu (pétition, cagnotte, mobilisation, campagne, sondage, moment) peut
-- être déclaré « porté par » une organisation. On modélise le lien par une
-- table polymorphe `contenu_organisation` (objet_type, objet_id) → organisation,
-- comme `commentaire_objet` : AUCUNE table de contenu existante n'est modifiée
-- (doctrine de greffe §0.3). Un contenu a au plus UNE organisation porteuse.
--
-- Seul·e un·e gestionnaire de l'organisation peut décider qu'elle porte un
-- contenu (anti-usurpation : l'organisation vouche pour ce qu'elle porte).
--
-- Migration LOCALE (idempotente).
-- ============================================================================

-- ============================================================
-- Table : contenu_organisation (lien polymorphe)
-- ============================================================
create table if not exists public.contenu_organisation (
  id              uuid primary key default gen_random_uuid(),
  objet_type      text not null,
  objet_id        uuid not null,
  organisation_id uuid not null references public.organisation(id) on delete cascade,
  declare_par     uuid references public.personne(id) on delete set null,
  created_at      timestamptz not null default now(),

  constraint contenu_organisation_type_valide check (objet_type in (
    'petition', 'cagnotte', 'mobilisation', 'campagne', 'sondage', 'moment'
  )),
  -- Au plus une organisation porteuse par contenu.
  constraint contenu_organisation_unique unique (objet_type, objet_id)
);

comment on table public.contenu_organisation is
  'Lien polymorphe : un contenu (pétition, cagnotte…) porté par une organisation. Déclaré par un·e gestionnaire (B.4).';

create index if not exists contenu_organisation_par_org_idx
  on public.contenu_organisation (organisation_id);

-- ============================================================
-- RLS : lecture publique (« porté par X » s'affiche à tous), écriture via fonctions
-- ============================================================
alter table public.contenu_organisation enable row level security;

drop policy if exists "contenu_organisation_select" on public.contenu_organisation;
create policy "contenu_organisation_select" on public.contenu_organisation for select
  using (true);

-- ============================================================
-- Déclarer qu'une organisation porte un contenu (gestionnaire de l'orga)
-- ============================================================
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
  -- Seul·e un·e gestionnaire de l'organisation peut la déclarer porteuse.
  if not public.est_gestionnaire_espace('organisation', p_org_id) then
    return false;
  end if;
  if p_objet_type not in ('petition', 'cagnotte', 'mobilisation', 'campagne', 'sondage', 'moment') then
    return false;
  end if;
  insert into public.contenu_organisation (objet_type, objet_id, organisation_id, declare_par)
    values (p_objet_type, p_objet_id, p_org_id, auth.uid())
    on conflict (objet_type, objet_id)
      do update set organisation_id = excluded.organisation_id, declare_par = auth.uid();
  return true;
end;
$$;

comment on function public.declarer_contenu_organisation(text, uuid, uuid) is
  'Un·e gestionnaire déclare que son organisation porte un contenu (lien polymorphe, 1 orga max).';

revoke execute on function public.declarer_contenu_organisation(text, uuid, uuid) from public;
grant execute on function public.declarer_contenu_organisation(text, uuid, uuid) to authenticated, service_role;

-- ============================================================
-- Retirer le rattachement (gestionnaire de l'orga porteuse, ou admin)
-- ============================================================
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
    where objet_type = p_objet_type and objet_id = p_objet_id;
  if not found then
    return false;
  end if;
  if not (public.est_gestionnaire_espace('organisation', v_org) or public.est_admin_general()) then
    return false;
  end if;
  delete from public.contenu_organisation
    where objet_type = p_objet_type and objet_id = p_objet_id;
  return true;
end;
$$;

comment on function public.retirer_contenu_organisation(text, uuid) is
  'Retire le rattachement contenu ↔ organisation (gestionnaire de l''orga porteuse, ou admin).';

revoke execute on function public.retirer_contenu_organisation(text, uuid) from public;
grant execute on function public.retirer_contenu_organisation(text, uuid) to authenticated, service_role;

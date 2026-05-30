-- ============================================================================
-- Chantier V2.6.15 (épopée réseau V2, chantier B.3) — Revendications d'organisation
-- ============================================================================
--
-- Cf. docs/specs/09_RESEAU-SOCIAL-V2.md §7.2 (revendication concurrente : file
-- d'attente, l'admin tranche).
--
-- Une personne peut REVENDIQUER la gestion d'une organisation existante. Sa
-- demande entre en file d'attente (statut en_attente). L'admin l'accepte (la
-- personne devient gestionnaire) ou la refuse. Pas de fusion automatique : en
-- cas de revendications concurrentes, l'admin désigne explicitement.
--
-- Toutes les transitions sensibles passent par des fonctions SECURITY DEFINER.
-- Migration LOCALE (idempotente).
-- ============================================================================

-- ============================================================
-- Table : revendication_organisation
-- ============================================================
create table if not exists public.revendication_organisation (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation(id) on delete cascade,
  personne_id     uuid not null references public.personne(id) on delete cascade,
  message         text,
  statut          text not null default 'en_attente',
  created_at      timestamptz not null default now(),
  traite_le       timestamptz,
  traite_par      uuid references public.personne(id) on delete set null,

  constraint revendication_statut_valide check (statut in ('en_attente', 'acceptee', 'refusee')),
  constraint revendication_message_taille check (message is null or length(message) <= 1000)
);

comment on table public.revendication_organisation is
  'Demande d''une personne pour devenir gestionnaire d''une organisation existante. Arbitrée par l''admin (B.3).';

-- Au plus une revendication EN ATTENTE par (organisation, personne).
create unique index if not exists revendication_en_attente_unique
  on public.revendication_organisation (organisation_id, personne_id)
  where statut = 'en_attente';

create index if not exists revendication_org_idx
  on public.revendication_organisation (organisation_id, statut);
create index if not exists revendication_personne_idx
  on public.revendication_organisation (personne_id, statut);

-- ============================================================
-- RLS : la personne voit ses revendications ; l'admin voit tout. Écriture via
-- fonctions SECURITY DEFINER uniquement.
-- ============================================================
alter table public.revendication_organisation enable row level security;

drop policy if exists "revendication_select" on public.revendication_organisation;
create policy "revendication_select" on public.revendication_organisation for select
  using (personne_id = auth.uid() or public.est_admin_general());

-- ============================================================
-- Revendiquer : créer une demande en son nom (si pas déjà gestionnaire / en attente)
-- ============================================================
create or replace function public.revendiquer_organisation(p_org_id uuid, p_message text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  -- Déjà gestionnaire actif : rien à revendiquer.
  if public.est_gestionnaire_espace('organisation', p_org_id) then
    return false;
  end if;
  -- L'organisation doit exister.
  if not exists (select 1 from public.organisation where id = p_org_id) then
    return false;
  end if;
  insert into public.revendication_organisation (organisation_id, personne_id, message)
    values (p_org_id, auth.uid(), nullif(btrim(coalesce(p_message, '')), ''))
    on conflict (organisation_id, personne_id) where (statut = 'en_attente')
      do nothing;
  return true;
end;
$$;

comment on function public.revendiquer_organisation(uuid, text) is
  'Crée une revendication de gestion d''une organisation au nom du lecteur courant.';

revoke execute on function public.revendiquer_organisation(uuid, text) from public;
grant execute on function public.revendiquer_organisation(uuid, text) to authenticated, service_role;

-- ============================================================
-- Traiter : l'admin accepte (-> gestionnaire) ou refuse une revendication
-- ============================================================
create or replace function public.traiter_revendication_organisation(
  p_revendication_id uuid,
  p_accepter boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_personne uuid;
begin
  if not public.est_admin_general() then
    return false;
  end if;
  select organisation_id, personne_id into v_org, v_personne
    from public.revendication_organisation
    where id = p_revendication_id and statut = 'en_attente';
  if not found then
    return false;
  end if;

  update public.revendication_organisation
    set statut = case when p_accepter then 'acceptee' else 'refusee' end,
        traite_le = now(),
        traite_par = auth.uid()
    where id = p_revendication_id;

  if p_accepter then
    insert into public.gestionnaire_espace (espace_type, espace_id, personne_id, attestation)
      values ('organisation', v_org, v_personne, true)
      on conflict (espace_type, espace_id, personne_id)
        do update set statut = 'actif';
  end if;
  return true;
end;
$$;

comment on function public.traiter_revendication_organisation(uuid, boolean) is
  'Admin : accepte (la personne devient gestionnaire) ou refuse une revendication.';

revoke execute on function public.traiter_revendication_organisation(uuid, boolean) from public;
grant execute on function public.traiter_revendication_organisation(uuid, boolean) to authenticated, service_role;

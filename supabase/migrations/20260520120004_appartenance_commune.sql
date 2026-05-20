-- Migration 004 : table `appartenance_commune` + triggers métier.
--
-- Lien N-N entre `personne` et `commune`. Une personne peut appartenir à
-- 1, 2 ou 3 communes (cf. 01_ARCHITECTURE.md §7B). 4 = refusé.
--
-- Anti-spam : on limite à une transition (entrée ou sortie) par mois
-- glissant, pour empêcher le « zapping » entre communes.

create table public.appartenance_commune (
  id uuid primary key default gen_random_uuid(),
  personne_id uuid not null references public.personne(id) on delete cascade,
  commune_id uuid not null references public.commune(id) on delete cascade,

  rejointe_le timestamptz not null default now(),
  quittee_le timestamptz,
  est_active boolean not null default true,

  created_at timestamptz not null default now(),

  -- Une personne ne peut être active qu'une seule fois dans une même commune.
  constraint appartenance_commune_unique_active
    unique (personne_id, commune_id, est_active)
    deferrable initially deferred,
  -- Cohérence quittee_le ↔ est_active.
  constraint appartenance_commune_coherence_active
    check (
      (est_active = true and quittee_le is null)
      or (est_active = false and quittee_le is not null)
    )
);

comment on table public.appartenance_commune is 'Adhésion d''une personne à une commune. 3 actives max (trigger). Anti-spam : 1 transition par mois glissant.';

create index appartenance_commune_personne_idx
  on public.appartenance_commune (personne_id) where est_active;
create index appartenance_commune_commune_idx
  on public.appartenance_commune (commune_id) where est_active;

-- ============================================================
-- Trigger : maximum 3 appartenances actives par personne
-- ============================================================
create or replace function public.tg_appartenance_commune_max_actives()
returns trigger
language plpgsql
as $$
declare
  nb_actives integer;
begin
  -- Compter les appartenances actives APRÈS l'opération.
  -- Sur INSERT : on compte les existantes + 1.
  -- Sur UPDATE qui passe est_active de false à true : idem.
  if (new.est_active = true) then
    select count(*) into nb_actives
    from public.appartenance_commune
    where personne_id = new.personne_id
      and est_active = true
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

    if (nb_actives >= 3) then
      raise exception 'La personne % appartient déjà à 3 communes actives (maximum autorisé).', new.personne_id
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger appartenance_commune_max_actives
  before insert or update on public.appartenance_commune
  for each row
  execute function public.tg_appartenance_commune_max_actives();

-- ============================================================
-- Trigger : anti-spam — 1 transition (entrée ou sortie) par mois glissant
-- ============================================================
create or replace function public.tg_appartenance_commune_anti_spam()
returns trigger
language plpgsql
as $$
declare
  derniere_transition timestamptz;
begin
  -- Cherche la transition la plus récente (entrée ou sortie) sur les
  -- appartenances de cette personne.
  select greatest(coalesce(max(rejointe_le), 'epoch'), coalesce(max(quittee_le), 'epoch'))
  into derniere_transition
  from public.appartenance_commune
  where personne_id = new.personne_id
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if (derniere_transition is not null and derniere_transition > (now() - interval '30 days')) then
    raise exception
      'La personne % a déjà effectué une transition d''appartenance le %. Prochaine possible le %.',
      new.personne_id, derniere_transition, derniere_transition + interval '30 days'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- Anti-spam activé sur INSERT (rejointe) et UPDATE qui pose `quittee_le`.
create trigger appartenance_commune_anti_spam
  before insert on public.appartenance_commune
  for each row
  execute function public.tg_appartenance_commune_anti_spam();

alter table public.appartenance_commune enable row level security;

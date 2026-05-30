-- ============================================================================
-- Chantier V2.6.19 — « Une » de la page d'accueil choisie par l'admin
-- ============================================================================
--
-- Aujourd'hui, chaque « une » de la home (pétition, article, mobilisation,
-- cagnotte) affiche AUTOMATIQUEMENT le contenu publié le plus récent. L'admin
-- veut pouvoir ÉPINGLER un contenu précis à la une de chaque emplacement.
--
-- On ajoute une table `une_home` : un emplacement (slot) → un contenu épinglé.
-- Les helpers `xAlaUne()` consultent d'abord cet épinglage, et retombent sur
-- l'automatique (plus récent) si rien n'est épinglé. Greffe additive.
--
-- Migration LOCALE (idempotente).
-- ============================================================================

create table if not exists public.une_home (
  emplacement  text primary key,
  objet_id     uuid not null,
  defini_par   uuid references public.personne(id) on delete set null,
  updated_at   timestamptz not null default now(),

  constraint une_home_emplacement_valide check (emplacement in (
    'petition', 'article', 'mobilisation', 'cagnotte'
  ))
);

comment on table public.une_home is
  'Contenu épinglé à la une de la home par emplacement (sinon : automatique = plus récent).';

-- ============================================================
-- RLS : lecture publique (la home en a besoin), écriture via fonctions (admin)
-- ============================================================
alter table public.une_home enable row level security;

drop policy if exists "une_home_select" on public.une_home;
create policy "une_home_select" on public.une_home for select using (true);

-- ============================================================
-- Épingler / désépingler (admin uniquement)
-- ============================================================
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
  if p_emplacement not in ('petition', 'article', 'mobilisation', 'cagnotte') then
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
  'Épingle un contenu à la une de la home pour un emplacement (admin).';

revoke execute on function public.definir_une_home(text, uuid) from public;
grant execute on function public.definir_une_home(text, uuid) to authenticated, service_role;

create or replace function public.retirer_une_home(p_emplacement text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.est_admin_general() then
    return false;
  end if;
  delete from public.une_home where emplacement = p_emplacement;
  return true;
end;
$$;

comment on function public.retirer_une_home(text) is
  'Retire l''épinglage d''un emplacement de la une (admin) : retour à l''automatique.';

revoke execute on function public.retirer_une_home(text) from public;
grant execute on function public.retirer_une_home(text) to authenticated, service_role;

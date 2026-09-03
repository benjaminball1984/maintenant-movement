-- ============================================================================
-- V2.6.139 — Retirer ou corriger une signature (admin + créateurice).
--
-- Demande de Lilou/Ben (03/09/2026) : pouvoir supprimer ou éditer une
-- signature, en cliquant dessus. Cas réels : une signature d'insulte, un
-- doublon, un nom d'organisation mal orthographié, une personne qui demande
-- le retrait de sa signature.
--
-- CHOIX STRUCTURANT — on RETIRE, on ne supprime pas.
-- Une signature retirée garde sa ligne en base : elle ne compte plus, elle
-- n'apparaît plus nulle part, mais elle est restaurable d'un clic. C'est la
-- doctrine de greffe (CLAUDE.md §0.3, « on additionne, on ne soustrait
-- jamais ») appliquée aux données : un retrait par erreur ne doit pas être
-- une perte définitive, et l'historique politique reste vérifiable.
--
-- La suppression DÉFINITIVE reste possible, réservée à l'administration
-- générale, pour le seul cas qui l'exige vraiment : une demande d'effacement
-- au titre du RGPD.
--
-- Migration ADDITIVE : trois colonnes ajoutées, aucune donnée modifiée. Les
-- 17 967 signatures existantes ont `retiree_le` à null, donc toutes actives —
-- les compteurs ne bougent pas d'une unité.
-- ============================================================================

alter table public.signature_petition
  add column if not exists retiree_le timestamptz;

alter table public.signature_petition
  add column if not exists retiree_par uuid references public.personne(id) on delete set null;

alter table public.signature_petition
  add column if not exists raison_retrait text;

comment on column public.signature_petition.retiree_le is
  'Date du retrait. Null = signature active. Une signature retiree ne compte plus et n''apparait plus, mais sa ligne est conservee et le retrait est reversible.';
comment on column public.signature_petition.retiree_par is
  'Personne qui a retire la signature (admin, moderateurice ou createurice de la petition).';
comment on column public.signature_petition.raison_retrait is
  'Motif du retrait, saisi par la personne qui retire. Sert la tracabilite, jamais affiche publiquement.';

-- Cohérence : on ne note pas QUI a retiré si rien n'a été retiré.
alter table public.signature_petition
  drop constraint if exists signature_retrait_coherent;

alter table public.signature_petition
  add constraint signature_retrait_coherent check (
    retiree_le is not null
    or (retiree_par is null and raison_retrait is null)
  );

-- Lister rapidement les signatures actives d'une pétition (cas de loin le
-- plus fréquent : tous les compteurs et toutes les listes).
create index if not exists signature_petition_actives_idx
  on public.signature_petition (petition_id, created_at desc)
  where retiree_le is null;

-- ============================================================
-- Anti-doublon : une signature retirée libère la place
-- ============================================================
--
-- Sans ça, quelqu'un dont la signature a été retirée par erreur ne pourrait
-- plus jamais re-signer : l'index unique verrait encore sa ligne. Les deux
-- index sont donc restreints aux signatures actives.

drop index if exists public.signature_petition_unique_email_individu;
drop index if exists public.signature_petition_unique_organisation;

create unique index if not exists signature_petition_unique_email_individu
  on public.signature_petition (petition_id, lower(email))
  where type_signataire = 'individu' and retiree_le is null;

create unique index if not exists signature_petition_unique_organisation
  on public.signature_petition (petition_id, lower(btrim(organisation_nom)))
  where type_signataire = 'organisation' and retiree_le is null;

-- ============================================================
-- Les compteurs et les listes ignorent les signatures retirées
-- ============================================================

create or replace function public.nombre_signatures(petition_a_compter uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.signature_petition
  where petition_id = petition_a_compter
    and retiree_le is null;
$$;

comment on function public.nombre_signatures(uuid) is
  'Nombre de signatures ACTIVES d''une petition. Les signatures retirees ne comptent pas. Lisible publiquement.';

create or replace function public.nombre_signatures_organisations(petition_a_compter uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.signature_petition
  where petition_id = petition_a_compter
    and type_signataire = 'organisation'
    and retiree_le is null;
$$;

create or replace function public.signataires_organisations(petition_a_lister uuid)
returns table (
  organisation_nom text,
  organisation_categorie text,
  organisation_territoire text,
  signee_le timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.organisation_nom,
    s.organisation_categorie,
    s.organisation_territoire,
    s.created_at
  from public.signature_petition s
  where s.petition_id = petition_a_lister
    and s.type_signataire = 'organisation'
    and s.organisation_affichage_public = true
    and s.retiree_le is null
  order by s.created_at asc;
$$;

-- La vue agrégée sert la console admin et l'export : même règle.
create or replace view public.petition_compteur as
  select
    p.id as petition_id,
    p.slug,
    p.titre,
    p.objectif,
    p.statut,
    coalesce(count(s.id), 0) as nombre_signatures
  from public.petition p
  left join public.signature_petition s
    on s.petition_id = p.id
   and s.retiree_le is null
  group by p.id, p.slug, p.titre, p.objectif, p.statut;

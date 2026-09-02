-- ============================================================================
-- V2.6.134 — Signature par une organisation + variante « appel » d'une pétition.
--
-- Demande de Lilou/Ben (02/09/2026) : mettre en ligne l'appel « Faisons Front
-- par la Rue ! », dont l'en-tête précise qu'il est « ouvert à la signature des
-- assemblées, collectifs, syndicats et organisations ». Le système de pétition
-- ne savait signer qu'au nom d'une personne physique.
--
-- Migration ADDITIVE (doctrine de greffe, CLAUDE.md §0.3) :
--   - aucune colonne supprimée, aucune donnée réécrite ;
--   - les signatures existantes deviennent `type_signataire = 'individu'`,
--     ce qui est exactement ce qu'elles étaient ;
--   - le seul index remplacé (`signature_petition_unique_email`) est reconstruit
--     à l'identique pour les individus, et complété pour les organisations.
-- ============================================================================

-- ============================================================
-- 1. Pétition : variante « appel »
-- ============================================================
--
-- Un appel est une pétition (même table, même modération, même compteur, même
-- export) dont l'habillage diffère : il n'est pas adressé à un destinataire
-- qu'on interpelle, il est proposé par un collectif et ouvert à la signature.
-- On ne crée donc pas d'objet nouveau, on qualifie l'objet existant.

alter table public.petition
  add column if not exists est_appel boolean not null default false;

alter table public.petition
  add column if not exists propose_par text;

comment on column public.petition.est_appel is
  'True = appel (texte proposé, ouvert à signature) plutôt que petition adressee a un destinataire. Change l''habillage public, pas le modele.';
comment on column public.petition.propose_par is
  'Auteur collectif affiche d''un appel (ex : la Coordination nationale Bloquons Tout). Null = on affiche la personne creatrice, comme pour une petition.';

-- ============================================================
-- 2. Signature : au nom de soi, ou au nom d'une organisation
-- ============================================================

alter table public.signature_petition
  add column if not exists type_signataire text not null default 'individu';

alter table public.signature_petition
  add column if not exists organisation_nom text;

alter table public.signature_petition
  add column if not exists organisation_categorie text;

alter table public.signature_petition
  add column if not exists organisation_territoire text;

alter table public.signature_petition
  add column if not exists signataire_fonction text;

-- Une organisation qui co-signe un appel a vocation a figurer dans la liste
-- publique des signataires : c'est le sens meme de la co-signature. La case
-- reste decochable (une organisation peut soutenir sans s'afficher).
alter table public.signature_petition
  add column if not exists organisation_affichage_public boolean not null default true;

comment on column public.signature_petition.type_signataire is
  'individu (defaut, comportement historique) | organisation';
comment on column public.signature_petition.organisation_nom is
  'Nom de l''organisation signataire. Obligatoire si type_signataire = organisation.';
comment on column public.signature_petition.organisation_categorie is
  'assemblee | collectif | syndicat | organisation — les quatre familles nommees par l''appel lui-meme.';
comment on column public.signature_petition.organisation_territoire is
  'Territoire declare (ville, departement, national...). Libre, optionnel.';
comment on column public.signature_petition.signataire_fonction is
  'Fonction de la personne qui signe au nom de l''organisation. Optionnel, jamais affiche publiquement.';
comment on column public.signature_petition.organisation_affichage_public is
  'True = le nom de l''organisation peut figurer dans la liste publique des signataires.';

-- Coherence : une signature d'organisation porte un nom et une categorie ;
-- une signature individuelle n'en porte aucun.
alter table public.signature_petition
  drop constraint if exists signature_type_coherent;

alter table public.signature_petition
  add constraint signature_type_coherent check (
    (
      type_signataire = 'individu'
      and organisation_nom is null
      and organisation_categorie is null
    )
    or (
      type_signataire = 'organisation'
      and organisation_nom is not null
      and btrim(organisation_nom) <> ''
      and organisation_categorie in ('assemblee', 'collectif', 'syndicat', 'organisation')
    )
  );

-- ============================================================
-- 3. Anti-doublon : une regle par type de signataire
-- ============================================================
--
-- Avant : une adresse email ne pouvait signer qu'une fois une petition donnee.
-- Cette regle reste vraie pour les signatures individuelles (index reconstruit
-- a l'identique, simplement restreint aux individus).
--
-- Elle ne peut pas s'appliquer telle quelle aux organisations : la meme
-- personne peut legitimement signer en son nom propre PUIS au nom de son
-- syndicat. Pour les organisations, l'unicite porte donc sur le nom de
-- l'organisation, insensible a la casse.

drop index if exists public.signature_petition_unique_email;

create unique index if not exists signature_petition_unique_email_individu
  on public.signature_petition (petition_id, lower(email))
  where type_signataire = 'individu';

create unique index if not exists signature_petition_unique_organisation
  on public.signature_petition (petition_id, lower(btrim(organisation_nom)))
  where type_signataire = 'organisation';

create index if not exists signature_petition_organisation_idx
  on public.signature_petition (petition_id, created_at)
  where type_signataire = 'organisation';

-- ============================================================
-- 4. Lectures publiques agregees (SECURITY DEFINER)
-- ============================================================
--
-- La table `signature_petition` n'est pas lisible publiquement (vie privee,
-- cf. migration 013). Comme pour `nombre_signatures`, on expose uniquement
-- ce qui est legitimement public : le decompte, et la liste des organisations
-- qui ont accepte d'etre affichees. Aucune donnee personnelle ne sort d'ici :
-- ni email, ni nom de personne, ni code postal, ni fonction.

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
    and type_signataire = 'organisation';
$$;

comment on function public.nombre_signatures_organisations(uuid) is
  'Nombre d''organisations signataires d''une petition ou d''un appel. Lisible publiquement.';

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
  order by s.created_at asc;
$$;

comment on function public.signataires_organisations(uuid) is
  'Liste publique des organisations signataires ayant accepte l''affichage. N''expose aucune donnee personnelle.';

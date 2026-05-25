-- Migration 038 : table `profil_unifie` + identifiant public « M » + 7 lettres.
--
-- Décision Lilou/Ben (2026-05-25) : CHAQUE signataire possède un PROFIL UNIFIÉ,
-- y compris les signataires importés qui n'ont jamais créé de compte. Ce profil
-- est identifié par un numéro stable « M » + 7 lettres (ex. MABCDEFG), qui
-- identifie la personne AU-DELÀ de son email : elle peut changer d'adresse sans
-- perdre son identité ni ses contributions.
--
-- Ce n'est PAS une table parallèle qui duplique `personne` : elle ne porte que
-- l'identité durable (numéro + email de réconciliation + lien éventuel vers le
-- compte). Le compte `personne` reste la source unique pour le reste du profil
-- (nom, préférences, etc.). Cette migration révise la réconciliation du
-- 2026-05-24 (« tout repose sur l'email, pas de table d'identité »).
--
-- Cycle de vie :
--   1. Signature (import ou anonyme) -> trouve-ou-crée un `profil_unifie` par
--      email, et y rattache la signature.
--   2. Création de compte + email vérifié -> on relie le `profil_unifie` au
--      compte (`personne_id`) via `rattacher_profil_unifie()`, et les signatures
--      de cet email deviennent lisibles dans « Mes contributions ».

-- ============================================================
-- Table d'identité durable
-- ============================================================
create table public.profil_unifie (
  id uuid primary key default gen_random_uuid(),

  -- Identifiant public lisible : 'M' suivi de 7 lettres majuscules A-Z.
  -- Posé automatiquement par le trigger `profil_unifie_numero` si absent.
  numero_unique text not null,

  -- Email de réconciliation (clé de rattachement signature <-> compte).
  -- Nullable par prudence, mais en pratique toujours renseigné.
  email text,

  -- Compte applicatif associé, une fois la personne inscrite (sinon null).
  -- Relation 1-1 : un compte n'a qu'un profil unifié, et inversement.
  personne_id uuid unique references public.personne(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profil_unifie_numero_format
    check (numero_unique ~ '^M[A-Z]{7}$')
);

comment on table public.profil_unifie is
  'Identité durable d''une personne (signataire), avec ou sans compte. Numéro stable M+7 lettres, indépendant de l''email.';
comment on column public.profil_unifie.numero_unique is
  'Identifiant public : M + 7 lettres majuscules (ex. MABCDEFG). Stable à vie.';
comment on column public.profil_unifie.personne_id is
  'Compte applicatif lié, renseigné à la vérification de l''email (sinon null).';

-- Unicité du numéro (et index de recherche).
create unique index profil_unifie_numero_unique_idx
  on public.profil_unifie (numero_unique);

-- Unicité de l'email, insensible à la casse (clé de réconciliation).
create unique index profil_unifie_email_unique_idx
  on public.profil_unifie (lower(email)) where email is not null;

-- ============================================================
-- Génération du numéro « M » + 7 lettres
-- ============================================================

-- Garde-fou anti gros mots : on régénère si le numéro contient une suite
-- offensante. La liste est volontairement courte et sans ambiguïté (un faux
-- positif ne coûte qu'une régénération). Le candidat est en majuscules A-Z.
create or replace function public.numero_contient_terme_interdit(candidat text)
returns boolean
language sql
immutable
as $$
  select candidat ~ ('(' ||
    'CONNARD|CONNASS|CONNES|CONASSE|SALOPE|SALAUD|SALOP|PUTAIN|PUTE|' ||
    'ENCULE|ENFOIRE|BATARD|BATART|NIQUE|NIQUER|PEDALE|TAPETTE|TARLOUZ|' ||
    'NEGRE|YOUPIN|BOUGNOUL|PEDE|ZOB|BITE|CHATTE|COUILLE|MERDE|' ||
    'FUCK|SHIT|BITCH|NIGGER|CUNT|RAPE|SLUT|NAZI|HITLER' ||
  ')');
$$;

comment on function public.numero_contient_terme_interdit(text) is
  'True si le candidat de numéro contient une suite offensante (déclenche une régénération).';

-- Génère un numéro « M » + 7 lettres garanti unique et acceptable.
create or replace function public.generer_numero_unique()
returns text
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  candidat text;
  i int;
  existe boolean;
begin
  loop
    candidat := 'M';
    for i in 1..7 loop
      candidat := candidat || substr(alphabet, 1 + floor(random() * 26)::int, 1);
    end loop;

    -- On rejette les suites offensantes.
    if public.numero_contient_terme_interdit(candidat) then
      continue;
    end if;

    -- On rejette les collisions (extrêmement rares : 26^7 ≈ 8 milliards).
    select exists(
      select 1 from public.profil_unifie where numero_unique = candidat
    ) into existe;
    exit when not existe;
  end loop;

  return candidat;
end;
$$;

comment on function public.generer_numero_unique() is
  'Génère un numéro M + 7 lettres unique et non offensant.';

-- Trigger : pose le numéro à la création si l'application ne l'a pas fourni.
create or replace function public.tg_profil_unifie_numero()
returns trigger
language plpgsql
as $$
begin
  if new.numero_unique is null or new.numero_unique = '' then
    new.numero_unique := public.generer_numero_unique();
  end if;
  return new;
end;
$$;

create trigger profil_unifie_numero
  before insert on public.profil_unifie
  for each row
  execute function public.tg_profil_unifie_numero();

create trigger profil_unifie_updated_at
  before update on public.profil_unifie
  for each row
  execute function public.tg_set_updated_at();

-- ============================================================
-- Lien depuis les signatures
-- ============================================================
alter table public.signature_petition
  add column profil_unifie_id uuid references public.profil_unifie(id) on delete set null;

comment on column public.signature_petition.profil_unifie_id is
  'Profil unifié du signataire (identité durable, même sans compte).';

create index signature_petition_profil_unifie_idx
  on public.signature_petition (profil_unifie_id) where profil_unifie_id is not null;

-- ============================================================
-- RLS : la personne lit son propre profil unifié
-- ============================================================
alter table public.profil_unifie enable row level security;

-- Lecture : son propre profil (via le lien de compte), ou admin général.
-- Les écritures passent par le client service_role (signature) et par la
-- fonction SECURITY DEFINER `rattacher_profil_unifie` (inscription) : aucune
-- policy d'insertion/mise à jour pour le public.
create policy "profil_unifie_select_self"
  on public.profil_unifie for select
  using (personne_id = auth.uid() or public.est_admin_general());

-- ============================================================
-- Trouve-ou-crée le profil unifié d'un email (flux de signature)
-- ============================================================
-- Appelée par la Server Action de signature via le client service_role.
-- SECURITY DEFINER + réservée à service_role : pas d'abus possible depuis le
-- client anonyme (sinon on pourrait polluer la table avec des emails arbitraires).
-- La comparaison se fait sur lower(email) (et non un `ilike` applicatif, où `_`
-- serait un joker). Robuste aux courses (deux premières signatures simultanées).
create or replace function public.trouver_ou_creer_profil_unifie(email_cible text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  select id into pid from public.profil_unifie where lower(email) = lower(email_cible) limit 1;
  if pid is not null then
    return pid;
  end if;

  begin
    insert into public.profil_unifie (email) values (email_cible) returning id into pid;
  exception when unique_violation then
    select id into pid from public.profil_unifie where lower(email) = lower(email_cible) limit 1;
  end;

  return pid;
end;
$$;

comment on function public.trouver_ou_creer_profil_unifie(text) is
  'Trouve ou crée le profil unifié d''un email. Réservée à service_role (flux de signature).';

revoke execute on function public.trouver_ou_creer_profil_unifie(text) from public;
revoke execute on function public.trouver_ou_creer_profil_unifie(text) from anon, authenticated;
grant execute on function public.trouver_ou_creer_profil_unifie(text) to service_role;

-- ============================================================
-- Rattachement compte <-> profil unifié (à la vérification de l'email)
-- ============================================================
-- SECURITY DEFINER : opère uniquement sur le compte appelant (`auth.uid()`) et
-- son propre email. Impossible de revendiquer les données d'autrui. Idempotente
-- (rappelée à chaque retour d'authentification, sans effet si déjà rattachée).
create or replace function public.rattacher_profil_unifie()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  mail text;
  pid uuid;
begin
  if uid is null then
    return null;
  end if;

  -- Email du compte courant.
  select email into mail from public.personne where id = uid;
  if mail is null then
    return null;
  end if;

  -- Trouve-ou-crée le profil unifié de cet email.
  select id into pid from public.profil_unifie where lower(email) = lower(mail) limit 1;
  if pid is null then
    insert into public.profil_unifie (email, personne_id)
    values (mail, uid)
    returning id into pid;
  else
    -- On relie au compte (sans écraser un éventuel lien existant vers autrui :
    -- de toute façon `personne.email` est unique, donc le cas ne se produit pas).
    update public.profil_unifie
    set personne_id = uid
    where id = pid and (personne_id is null or personne_id = uid);
  end if;

  -- Rattache les signatures déjà liées à ce profil unifié (lisibilité).
  update public.signature_petition
  set personne_id = uid
  where profil_unifie_id = pid and personne_id is null;

  -- Rattache aussi par email les signatures pas encore reliées à un profil.
  update public.signature_petition
  set profil_unifie_id = pid, personne_id = uid
  where lower(email) = lower(mail) and profil_unifie_id is null;

  return (select numero_unique from public.profil_unifie where id = pid);
end;
$$;

comment on function public.rattacher_profil_unifie() is
  'Relie le compte courant à son profil unifié (par email vérifié) et rend ses signatures lisibles. Idempotente.';

-- ============================================================
-- Remplissage des données existantes
-- ============================================================
-- 1. Un profil unifié pour chaque compte existant (numéro posé par le trigger).
do $$
declare
  r record;
  pid uuid;
begin
  for r in select id, email from public.personne where email is not null loop
    select id into pid from public.profil_unifie where lower(email) = lower(r.email) limit 1;
    if pid is null then
      insert into public.profil_unifie (email, personne_id) values (r.email, r.id);
    else
      update public.profil_unifie set personne_id = r.id where id = pid;
    end if;
  end loop;
end $$;

-- 2. Un profil unifié pour chaque email de signature.
--    Les insertions passent par une boucle (un INSERT = un statement, donc le
--    trigger voit les numéros déjà posés et garantit leur unicité, ce qu'une
--    insertion ensembliste unique ne permettrait pas). Le rattachement, lui, se
--    fait ensuite en une seule passe ensembliste (jointure sur lower(email)),
--    bien plus rapide qu'un UPDATE par email sur ~16 000 emails.
do $$
declare
  r record;
begin
  for r in
    select lower(email) as email_norm, min(email) as email_orig
    from public.signature_petition
    group by lower(email)
  loop
    if not exists (select 1 from public.profil_unifie where lower(email) = r.email_norm) then
      insert into public.profil_unifie (email) values (r.email_orig);
    end if;
  end loop;
end $$;

update public.signature_petition s
set profil_unifie_id = pu.id
from public.profil_unifie pu
where lower(pu.email) = lower(s.email)
  and s.profil_unifie_id is null;

-- 3. `personne_id` sur les signatures dont l'email correspond à un compte.
update public.signature_petition s
set personne_id = pu.personne_id
from public.profil_unifie pu
where s.profil_unifie_id = pu.id
  and pu.personne_id is not null
  and s.personne_id is null;

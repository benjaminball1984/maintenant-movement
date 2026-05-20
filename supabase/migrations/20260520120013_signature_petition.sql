-- Migration 013 : table `signature_petition` + helper `nombre_signatures`.
--
-- Cf. docs/specs/01_ARCHITECTURE.md §5A et §12 :
--   - Signature **anonyme** possible (sans compte).
--   - Champs : nom, prenom, code_postal, email, telephone optionnel.
--   - Cases : newsletter + autorisation contact créateurice.
--   - Code postal obligatoire (tagging newsletter au département, spec §10).
--
-- Une personne ne peut signer qu'une fois une pétition donnée (contrainte
-- unique sur `(petition_id, email)`). Pas d'`(petition_id, personne_id)`
-- parce que la signature anonyme l'autorise (personne_id = null).

create table public.signature_petition (
  id uuid primary key default gen_random_uuid(),

  petition_id uuid not null references public.petition(id) on delete cascade,

  -- Personne authentifiée (si signature connectée) ou null (anonyme).
  personne_id uuid references public.personne(id) on delete set null,

  -- Identité capturée à la signature (snapshot, indépendant du profil).
  nom text not null,
  prenom text not null,
  email text not null,
  code_postal text not null,
  telephone text,

  -- Cases (cf. spec §3 « Parcours pétition »).
  accepte_newsletter boolean not null default false,
  accepte_contact_createurice boolean not null default false,

  created_at timestamptz not null default now(),

  constraint signature_email_format
    check (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  constraint signature_code_postal_format
    check (code_postal ~ '^\d{5}$')
);

-- Anti-doublon : une même adresse email ne peut signer qu'une fois une
-- pétition donnée. Insensible à la casse.
create unique index signature_petition_unique_email
  on public.signature_petition (petition_id, lower(email));

-- Index pour les requêtes de count() et listing.
create index signature_petition_petition_idx
  on public.signature_petition (petition_id, created_at desc);
create index signature_petition_personne_idx
  on public.signature_petition (personne_id) where personne_id is not null;
create index signature_petition_departement_idx
  on public.signature_petition (substring(code_postal, 1, 2));

comment on table public.signature_petition is 'Signature d''une pétition. Anonyme possible (personne_id null). Unique par email.';
comment on column public.signature_petition.personne_id is 'Renseigné si la signataire était connectée au moment de signer.';

alter table public.signature_petition enable row level security;

-- ============================================================
-- Politiques RLS
-- ============================================================

-- Lecture : la signature individuelle n'est PAS publique (vie privée).
-- - La personne signataire connectée voit ses propres signatures.
-- - La créatrice de la pétition voit les signatures qui ont accepté son
--   contact (pour pouvoir contacter ces signataires).
-- - Modérateurice + admin voient tout.
create policy "signature_petition_select"
  on public.signature_petition for select
  using (
    personne_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('petitions')
    or (
      accepte_contact_createurice = true
      and exists (
        select 1 from public.petition p
        where p.id = signature_petition.petition_id
          and p.createurice_id = auth.uid()
      )
    )
  );

-- Insertion : ouverte à tout le monde (signature publique anonyme).
-- L'application valide via Server Action + Turnstile + Zod.
-- La RLS impose seulement que `personne_id` corresponde à la session
-- ou soit null (signature anonyme).
create policy "signature_petition_insert"
  on public.signature_petition for insert
  with check (
    personne_id is null
    or personne_id = auth.uid()
  );

-- Mise à jour : signataire connectée peut éditer ses propres signatures
-- (cas rare, ex : corriger une faute dans son nom). Pas de modification
-- post-validation par d'autres.
create policy "signature_petition_update_self"
  on public.signature_petition for update
  using (personne_id = auth.uid())
  with check (personne_id = auth.uid());

-- Suppression : signataire peut retirer sa signature (droit RGPD à
-- l'opposition). Admin aussi.
create policy "signature_petition_delete"
  on public.signature_petition for delete
  using (
    personne_id = auth.uid()
    or public.est_admin_general()
  );

-- ============================================================
-- Vue d'agrégation publique : nombre de signatures par pétition.
-- Permet aux Server Components de fetcher le compteur sans charger
-- toutes les lignes.
-- ============================================================
create or replace view public.petition_compteur as
  select
    p.id as petition_id,
    p.slug,
    p.titre,
    p.objectif,
    p.statut,
    coalesce(count(s.id), 0) as nombre_signatures
  from public.petition p
  left join public.signature_petition s on s.petition_id = p.id
  group by p.id, p.slug, p.titre, p.objectif, p.statut;

comment on view public.petition_compteur is
  'Compteur agrégé de signatures par pétition. Lecture publique pour les pétitions publiées (via RLS sur petition).';

-- ============================================================
-- Fonction utilitaire : nombre de signatures d'une pétition donnée.
-- SECURITY DEFINER pour ne pas exposer la table signature_petition à la
-- lecture publique tout en autorisant le count() agrégé.
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
  where petition_id = petition_a_compter;
$$;

comment on function public.nombre_signatures(uuid) is
  'Nombre total de signatures d''une pétition. Lisible publiquement.';

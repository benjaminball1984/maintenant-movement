-- Migration 002 : table `personne`.
--
-- Cœur du modèle : chaque utilisateur·ice authentifié·e a une ligne ici.
-- L'id est lié à `auth.users(id)` (Supabase Auth, branché au chantier 1.2).
--
-- Champs RGPD (cf. docs/specs/05_RGPD.md §5A et §5B) :
--   statut                  : 'actif' | 'pending_deletion' | 'anonymise'
--   suppression_demandee_le : timestamp de la demande, démarre les 30 j de grâce
--   anonymise_le            : timestamp d'anonymisation effective
--   email_verifie           : booléen, validation email systématique (§5E)
--   totp_secret             : secret 2FA optionnel (§5F), à chiffrer côté app
--   preferences_visibilite  : visibilité par champ (cf. 01_ARCHITECTURE.md §9)
--   mode_theme              : préférence UI miroirée depuis localStorage (cf. 04_DESIGN-TOKENS.md §3)
--
-- Conventions de nommage (CLAUDE.md §7) : métier en français
-- (`personne`, `pronom`, `code_postal`, etc.), technique en anglais
-- (`created_at`, `updated_at`, `totp_secret`).

create table public.personne (
  id uuid primary key references auth.users(id) on delete cascade,

  -- Identité
  email text unique,
  nom text,
  prenom text,
  pronom text,
  date_naissance date,
  code_postal text,
  telephone text,
  photo_url text,
  bio text,

  -- État du compte
  statut text not null default 'actif',
  email_verifie boolean not null default false,

  -- 2FA (cf. CLAUDE.md §6 et RGPD §5F)
  totp_secret text,

  -- Préférences UI
  preferences_visibilite jsonb not null default '{}'::jsonb,
  mode_theme text default 'auto',

  -- Cycle de vie RGPD
  suppression_demandee_le timestamptz,
  anonymise_le timestamptz,
  derniere_connexion_le timestamptz,

  -- Audit technique
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Contraintes
  constraint personne_statut_valide
    check (statut in ('actif', 'pending_deletion', 'anonymise')),
  constraint personne_mode_theme_valide
    check (mode_theme is null or mode_theme in ('auto', 'light', 'dark')),
  -- 15 ans minimum à l'inscription (RGPD §5G). Permet null pour les
  -- comptes anonymisés (la date de naissance est effacée).
  constraint personne_age_minimum
    check (date_naissance is null or date_naissance <= (now() - interval '15 years')::date)
);

comment on table public.personne is 'Profil applicatif lié à auth.users. Source unique pour l''identité et les préférences.';
comment on column public.personne.statut is 'actif | pending_deletion | anonymise (cf. RGPD §5A)';
comment on column public.personne.preferences_visibilite is 'Visibilité par champ : { "email": "prive", "telephone": "amis", ... } (cf. spec §9)';
comment on column public.personne.mode_theme is 'Miroir BDD de la préférence locale (auto | light | dark)';

-- Index utiles
create index personne_email_idx on public.personne (email) where email is not null;
create index personne_statut_idx on public.personne (statut);
create index personne_code_postal_idx on public.personne (code_postal) where code_postal is not null;

-- Trigger updated_at générique (réutilisable par d'autres tables).
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.tg_set_updated_at() is 'Trigger BEFORE UPDATE : met à jour la colonne updated_at.';

create trigger personne_updated_at
  before update on public.personne
  for each row
  execute function public.tg_set_updated_at();

-- RLS : activée. Politiques posées dans 011_rls_policies.sql une fois
-- les helpers d'admin disponibles.
alter table public.personne enable row level security;

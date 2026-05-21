-- Migration 030 : organisation_partenaire (chantier 5.4).
--
-- Cf. docs/specs/01_ARCHITECTURE.md §7D « D'autres moyens d'agir » :
--   « Doctrine de distance protectrice. Page courte, pas
--     d'éditorialisation. "Il y a d'autres moyens d'agir, les voici."
--     Liste de redirections sans endossement. Présomption d'utilité.
--     Retrait si problématique. »
--   « Raison politique : ne pas être éclaboussé·es par les dérapages
--     des organisations listées. »

create table public.organisation_partenaire (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  nom text not null,
  slug text not null unique,
  description_courte text,
  url text not null,
  -- Catégorie technique fonctionnelle (politique, environnement, social,
  -- féministe, LGBTQI+, antiraciste, etc.). Texte libre v1, arborescence
  -- admin à venir si besoin.
  categorie_slug text,

  -- État. `affichee` par défaut. `retiree` quand l'admin retire pour
  -- problématique (la raison reste pour audit). Pas de cycle complexe :
  -- on n'a pas de modération a priori, présomption d'utilité.
  statut text not null default 'affichee',
  raison_retrait text,
  retire_par uuid references public.personne(id) on delete set null,
  retire_le timestamptz,

  -- Provenance
  ajoute_par uuid not null references public.personne(id) on delete cascade,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orga_statut_valide
    check (statut in ('affichee', 'retiree')),
  constraint orga_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint orga_url_https
    check (url ~ '^https?://.+'),
  constraint orga_retrait_coherent
    check (
      (statut = 'retiree' and raison_retrait is not null and retire_le is not null)
      or statut <> 'retiree'
    )
);

comment on table public.organisation_partenaire is
  'Liste de redirections vers d''autres organisations. Cf. spec §7D : pas d''endossement, présomption d''utilité, retrait si problème.';

create index orga_partenaire_statut_idx on public.organisation_partenaire (statut, nom);
create index orga_partenaire_categorie_idx on public.organisation_partenaire (categorie_slug)
  where statut = 'affichee';

create trigger organisation_partenaire_updated_at
  before update on public.organisation_partenaire
  for each row
  execute function public.tg_set_updated_at();

alter table public.organisation_partenaire enable row level security;

-- Lecture publique des organisations affichées + retirées vues par admin.
create policy "orga_partenaire_select"
  on public.organisation_partenaire for select
  using (
    statut = 'affichee'
    or public.est_admin_general()
    or public.est_moderateurice('autres_moyens')
  );

-- Ajout : admin ou modé (présomption d'utilité côté admin, pas
-- d'ajout libre par les usager·ères pour éviter le spam).
create policy "orga_partenaire_insert"
  on public.organisation_partenaire for insert
  with check (public.est_admin_general() or public.est_moderateurice('autres_moyens'));

create policy "orga_partenaire_update"
  on public.organisation_partenaire for update
  using (public.est_admin_general() or public.est_moderateurice('autres_moyens'));

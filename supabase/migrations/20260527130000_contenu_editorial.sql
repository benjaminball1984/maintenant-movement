-- Table `contenu_editorial` : CMS minimal pour les pages éditoriales et
-- les blocs textuels modifiables par l'admin (cycle V2 V2.4.1).
--
-- Stocke des blocs Markdown identifiés par une `cle` unique. L'UI charge
-- le contenu via `lireContenuEditorial(cle)`, et l'admin l'édite via
-- `mettreAJourContenuEditorialAction`. Aucune logique de versioning
-- (un seul état actif par clé). Lorem ipsum par défaut tant que pas
-- édité.
--
-- À appliquer avec `supabase db push`. Non appliquée distant cette nuit.

create table if not exists public.contenu_editorial (
  cle text primary key check (length(cle) between 1 and 200),
  valeur_md text not null default '',
  titre text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.personne(id) on delete set null
);

comment on table public.contenu_editorial is
  'CMS minimal V2.4.1 : blocs Markdown identifiés par une clé. Lecture publique, écriture admin national.';

create index if not exists contenu_editorial_updated_at_idx
  on public.contenu_editorial (updated_at desc);

alter table public.contenu_editorial enable row level security;

-- Lecture publique : tout le monde voit les contenus éditoriaux.
drop policy if exists "contenu_editorial_select_public" on public.contenu_editorial;
create policy "contenu_editorial_select_public"
  on public.contenu_editorial
  for select
  using (true);

-- Écriture admin national uniquement.
drop policy if exists "contenu_editorial_insert_admin" on public.contenu_editorial;
create policy "contenu_editorial_insert_admin"
  on public.contenu_editorial
  for insert
  with check (public.est_admin_general());

drop policy if exists "contenu_editorial_update_admin" on public.contenu_editorial;
create policy "contenu_editorial_update_admin"
  on public.contenu_editorial
  for update
  using (public.est_admin_general())
  with check (public.est_admin_general());

drop policy if exists "contenu_editorial_delete_admin" on public.contenu_editorial;
create policy "contenu_editorial_delete_admin"
  on public.contenu_editorial
  for delete
  using (public.est_admin_general());

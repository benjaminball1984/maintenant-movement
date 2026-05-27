-- Table `journal_affiche` : éditions de journal-affiche imprimables
-- (V2.4.11, chantier 7.3 V1 partiellement).
--
-- Cf. spec V1 §4C. Le chantier complet demande des modèles Canva,
-- un agent Claude API, Paged.js + Puppeteer pour le PDF, Stripe pour
-- les commandes d'impression. Pour le MVP, on stocke juste les
-- éditions en Markdown ; l'export PDF viendra dans un chantier dédié.
--
-- À appliquer avec `supabase db push`. Non appliquée distant.

create table if not exists public.journal_affiche (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (length(slug) between 1 and 100),
  titre text not null check (length(titre) between 1 and 300),
  sous_titre text,
  numero integer not null default 1,
  format text not null default 'A3' check (format in ('A3', 'A4')),

  -- Contenu agrégé en Markdown : titres, paragraphes, citations,
  -- listes. Permet d'éditer librement avant la mise en page PDF.
  contenu_md text not null default '',

  -- Image de couverture (optionnelle). Affichée en tête + en aperçu liste.
  image_couverture_url text,

  -- Statut éditorial.
  statut text not null default 'brouillon' check (statut in (
    'brouillon',
    'publie',
    'archive'
  )),

  -- Périmètre géographique : commune, fédération, ou national.
  perimetre_type text not null default 'national' check (perimetre_type in (
    'commune', 'federation', 'confederation', 'national'
  )),
  perimetre_id uuid,

  createurice_id uuid references public.personne(id) on delete set null,
  publie_le timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists journal_affiche_slug_idx
  on public.journal_affiche (slug);

create index if not exists journal_affiche_statut_publie_idx
  on public.journal_affiche (statut, publie_le desc)
  where statut = 'publie';

alter table public.journal_affiche enable row level security;

-- Lecture : public pour les publiés, admin/createurice pour les brouillons.
drop policy if exists "journal_affiche_select_publie" on public.journal_affiche;
create policy "journal_affiche_select_publie"
  on public.journal_affiche
  for select
  using (
    statut = 'publie'
    or public.est_admin_general()
    or (createurice_id is not null and createurice_id = auth.uid())
  );

-- Création : admin general OU adhérent·e cooptée (à brancher quand
-- la matrice de droits V2 sera là). Pour MVP : admin only.
drop policy if exists "journal_affiche_insert_admin" on public.journal_affiche;
create policy "journal_affiche_insert_admin"
  on public.journal_affiche
  for insert
  with check (public.est_admin_general());

drop policy if exists "journal_affiche_update_admin" on public.journal_affiche;
create policy "journal_affiche_update_admin"
  on public.journal_affiche
  for update
  using (public.est_admin_general())
  with check (public.est_admin_general());

drop policy if exists "journal_affiche_delete_admin" on public.journal_affiche;
create policy "journal_affiche_delete_admin"
  on public.journal_affiche
  for delete
  using (public.est_admin_general());

-- Trigger updated_at
create or replace function public.journal_affiche_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists journal_affiche_updated_at on public.journal_affiche;
create trigger journal_affiche_updated_at
  before update on public.journal_affiche
  for each row execute function public.journal_affiche_set_updated_at();

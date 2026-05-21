-- Migration 031 : Maintenant Médias (chantier 7.1).
--
-- Cf. docs/specs/01_ARCHITECTURE.md §4A :
--   « Sections : Éditos, Tribunes, Articles, Brèves (flux Reuters + AP),
--     Dessins, Podcasts, Vidéos, Lives, Newsletter (archive),
--     Maintenant Radio (live embarqué). »
--
-- Modèle polymorphe : une seule table `media` avec un type discriminant.
-- Pas une table par type (DRY + facile de croiser dans le flux du
-- réseau social et le journal-affiche).
--
-- Brèves Reuters/AP : ce sont des médias avec `provenance_externe`
-- renseignée. Le flux sera alimenté par un job d'import dédié plus
-- tard (clés API non fournies pour 7.1).

create table public.media (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  slug text not null unique,
  titre text not null,
  -- Pour les éditos, articles, tribunes : le corps Markdown.
  -- Pour les médias riches (podcast, video, live) : description courte.
  corps text not null,

  -- Type. 9 valeurs couvrant la spec §4A.
  type text not null,

  -- Auteurice principale (peut être null pour les brèves externes).
  auteurice_id uuid references public.personne(id) on delete set null,

  -- Provenance externe pour les brèves (Reuters, AP, autre).
  -- Si renseignée, on ajoute une mention dans l'UI.
  provenance_externe text,
  source_url text,

  -- Médias riches : URL d'embed (podcast .mp3, video YouTube/Vimeo,
  -- live LiveKit, dessin image, etc.).
  media_url text,
  vignette_url text,

  -- Tags thématiques (libre v1, arborescence admin plus tard).
  tags text[],

  -- Cycle de vie. brouillon | publie | retire | archive.
  -- Modération a posteriori (cf. spec §11) sauf pour les éditos
  -- qui sont écrits par l'équipe nationale.
  statut text not null default 'brouillon',
  publie_le timestamptz,
  retire_par uuid references public.personne(id) on delete set null,
  retire_le timestamptz,
  raison_retrait text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint media_type_valide
    check (type in (
      'edito',
      'tribune',
      'article',
      'breve',
      'dessin',
      'podcast',
      'video',
      'live',
      'newsletter'
    )),
  constraint media_statut_valide
    check (statut in ('brouillon', 'publie', 'retire', 'archive')),
  constraint media_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint media_publie_coherent
    check (
      (statut = 'publie' and publie_le is not null)
      or statut <> 'publie'
    ),
  constraint media_retire_coherent
    check (
      (statut = 'retire' and retire_le is not null and raison_retrait is not null)
      or statut <> 'retire'
    ),
  -- Si provenance externe, source_url obligatoire (transparence).
  constraint media_provenance_coherente
    check (
      provenance_externe is null
      or (source_url is not null and source_url <> '')
    )
);

comment on table public.media is
  'Médias Maintenant! (9 types : édito, tribune, article, brève, dessin, podcast, vidéo, live, newsletter).';
comment on column public.media.type is
  'edito | tribune | article | breve | dessin | podcast | video | live | newsletter';
comment on column public.media.provenance_externe is
  'Source externe pour les brèves (Reuters, AP, etc.). Cf. spec §4A.';

create index media_type_idx on public.media (type, publie_le desc);
create index media_statut_idx on public.media (statut, publie_le desc);
create index media_publie_idx on public.media (publie_le desc) where statut = 'publie';
create index media_auteurice_idx on public.media (auteurice_id);
create index media_tags_idx on public.media using gin (tags);

create trigger media_updated_at
  before update on public.media
  for each row
  execute function public.tg_set_updated_at();

alter table public.media enable row level security;

-- ============================================================
-- Politiques RLS — modération a posteriori (a priori pour éditos /
-- newsletter qui passent par l'équipe nationale).
-- ============================================================

-- Lecture : publié = public ; auteurice voit ses brouillons ; admin
-- voit tout.
create policy "media_select"
  on public.media for select
  using (
    statut = 'publie'
    or auteurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('media')
  );

-- Insertion : auth requise, l'auteurice doit être celle de la session.
-- Les brèves Reuters/AP sont insérées via le service_role (job
-- d'import dédié).
create policy "media_insert"
  on public.media for insert
  with check (
    auth.uid() is not null
    and (auteurice_id = auth.uid() or auteurice_id is null)
  );

-- Update : l'auteurice (sur ses brouillons) ; admin / modé partout.
create policy "media_update"
  on public.media for update
  using (
    (auteurice_id = auth.uid() and statut = 'brouillon')
    or public.est_admin_general()
    or public.est_moderateurice('media')
  );

-- Migration 021 : table `service_sel` (chantier 4.2).
--
-- Cf. docs/specs/01_ARCHITECTURE.md §6E « SEL — Système d'échange local » :
--   - Sous-titre : « Reconnaître le temps de chacun·e, libérer du temps
--     pour tous et toutes ».
--   - Conversion fondatrice : 1 99-coin (T99CP) = 1 € = 1 minute.
--   - Vocabulaire : « Service » entre particulier·ères, « Volontariat »
--     pour les collectifs. PAS « travail ».
--   - Mécanique : modération à 2 h, 120 minutes = 120 99-coins crédités.
--   - Cagnotte cotisation libre RBU sur la plateforme.
--
-- Cette table représente l'offre (« je propose ce service »). La table
-- 022 `prestation_sel` représente une exécution concrète d'un service
-- entre deux personnes (avec le compteur de minutes effectives).

create table public.service_sel (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  slug text not null unique,
  titre text not null,
  description text not null,

  -- Catégorie : service entre particulier·ères ou volontariat collectif.
  categorie text not null,

  -- Sens : je propose (j'offre mon temps) ou je cherche (j'ai besoin d'aide).
  sens text not null,

  -- Durée estimée pour une prestation type (en minutes). Indicative ;
  -- la durée réelle est saisie au moment de la réalisation
  -- (table `prestation_sel`).
  duree_minutes_estimee integer not null,

  -- Lieu + géolocalisation optionnelle.
  lieu text not null,
  latitude double precision,
  longitude double precision,

  -- Provenance
  createurice_id uuid not null references public.personne(id) on delete cascade,

  -- État
  statut text not null default 'publie',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint service_sel_categorie_valide
    check (categorie in ('service', 'volontariat')),
  constraint service_sel_sens_valide
    check (sens in ('propose', 'cherche')),
  constraint service_sel_statut_valide
    check (statut in ('publie', 'retire', 'cloture')),
  constraint service_sel_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint service_sel_duree_positive
    check (duree_minutes_estimee > 0 and duree_minutes_estimee <= 480),
  constraint service_sel_lat_valide
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint service_sel_lng_valide
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint service_sel_geo_coherent
    check (
      (latitude is null and longitude is null)
      or (latitude is not null and longitude is not null)
    )
);

comment on table public.service_sel is
  'Offre/demande de service SEL (service entre particulier·ères ou volontariat collectif).';
comment on column public.service_sel.categorie is 'service | volontariat (PAS "travail" — décision politique)';
comment on column public.service_sel.duree_minutes_estimee is
  'Durée estimée par prestation. La durée réelle créditée vient de prestation_sel.';

create index service_sel_categorie_idx on public.service_sel (categorie, statut);
create index service_sel_sens_idx on public.service_sel (sens) where statut = 'publie';
create index service_sel_createurice_idx on public.service_sel (createurice_id);
create index service_sel_recent_idx on public.service_sel (created_at desc)
  where statut = 'publie';

create trigger service_sel_updated_at
  before update on public.service_sel
  for each row
  execute function public.tg_set_updated_at();

alter table public.service_sel enable row level security;

create policy "service_sel_select"
  on public.service_sel for select
  using (
    statut in ('publie', 'cloture')
    or createurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('sel')
  );

create policy "service_sel_insert"
  on public.service_sel for insert
  with check (
    auth.uid() is not null
    and createurice_id = auth.uid()
  );

create policy "service_sel_update"
  on public.service_sel for update
  using (
    (createurice_id = auth.uid() and statut = 'publie')
    or public.est_admin_general()
    or public.est_moderateurice('sel')
  );

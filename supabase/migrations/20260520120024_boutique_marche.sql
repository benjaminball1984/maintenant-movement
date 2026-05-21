-- Migration 024 : table `boutique_marche` (chantier 4.3 — onglet 2).
--
-- Cf. spec §6F « Marché solidaire » :
--   « 2. Boutique (créer ou chercher une boutique éphémère). »
--
-- Une boutique regroupe plusieurs produits sous une même identité
-- (artisan·e, créateurice, brocante, vide-grenier). Éphémère :
-- `ouverte_du` / `ouverte_au` optionnels mais souvent renseignés pour
-- les vide-greniers et marchés ponctuels.
--
-- Lien produit ↔ boutique : table de jointure `produit_boutique` qui
-- permet à un produit d'appartenir à plusieurs boutiques (cas rare
-- mais peu coûteux à modéliser, et évite une migration future).

create table public.boutique_marche (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  slug text not null unique,
  nom text not null,
  description text not null,
  image_url text,

  -- Sens : la personne crée sa boutique (`propose`) ou cherche à
  -- rejoindre/créer collectivement une boutique (`cherche`).
  sens text not null,

  -- Fenêtre temporelle de la boutique éphémère. Nullable : si non
  -- renseignée, boutique permanente.
  ouverte_du timestamptz,
  ouverte_au timestamptz,

  -- Lieu physique (vide-grenier, brocante). Géolocalisation pour la
  -- carte unifiée — réutilise les conventions des autres entités.
  lieu text,
  latitude double precision,
  longitude double precision,

  -- Provenance
  createurice_id uuid not null references public.personne(id) on delete cascade,

  -- État : ouverte | fermee | retiree. Pas d'expiration auto pour la
  -- v1 ; les boutiques éphémères se ferment à la main quand le
  -- créneau est passé.
  statut text not null default 'ouverte',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint boutique_marche_sens_valide
    check (sens in ('propose', 'cherche')),
  constraint boutique_marche_statut_valide
    check (statut in ('ouverte', 'fermee', 'retiree')),
  constraint boutique_marche_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint boutique_marche_lat_valide
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint boutique_marche_lng_valide
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint boutique_marche_geo_coherent
    check (
      (latitude is null and longitude is null)
      or (latitude is not null and longitude is not null)
    ),
  constraint boutique_marche_dates_coherentes
    check (
      ouverte_du is null
      or ouverte_au is null
      or ouverte_du <= ouverte_au
    )
);

comment on table public.boutique_marche is
  'Boutique éphémère du marché solidaire (artisan·e, vide-grenier, brocante). Peut regrouper plusieurs produits via produit_boutique.';
comment on column public.boutique_marche.sens is
  'propose (je crée ma boutique) | cherche (je cherche à rejoindre ou créer collectivement)';

create index boutique_marche_statut_idx on public.boutique_marche (statut, created_at desc);
create index boutique_marche_sens_idx on public.boutique_marche (sens) where statut = 'ouverte';
create index boutique_marche_createurice_idx on public.boutique_marche (createurice_id);
create index boutique_marche_geo_idx on public.boutique_marche (latitude, longitude)
  where statut = 'ouverte' and latitude is not null;

create trigger boutique_marche_updated_at
  before update on public.boutique_marche
  for each row
  execute function public.tg_set_updated_at();

alter table public.boutique_marche enable row level security;

-- ============================================================
-- Politiques RLS — modération a posteriori
-- ============================================================

create policy "boutique_marche_select"
  on public.boutique_marche for select
  using (
    statut in ('ouverte', 'fermee')
    or createurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('marche')
  );

create policy "boutique_marche_insert"
  on public.boutique_marche for insert
  with check (
    auth.uid() is not null
    and createurice_id = auth.uid()
  );

create policy "boutique_marche_update"
  on public.boutique_marche for update
  using (
    (createurice_id = auth.uid() and statut <> 'retiree')
    or public.est_admin_general()
    or public.est_moderateurice('marche')
  );

-- ============================================================
-- Lien produit ↔ boutique (n-n)
-- ============================================================

create table public.produit_boutique (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid not null references public.produit_marche(id) on delete cascade,
  boutique_id uuid not null references public.boutique_marche(id) on delete cascade,
  rattache_le timestamptz not null default now(),
  rattache_par uuid not null references public.personne(id) on delete cascade,
  unique (produit_id, boutique_id)
);

comment on table public.produit_boutique is
  'Rattachement n-n produit ↔ boutique. Le produit reste découvrable hors boutique.';

create index produit_boutique_produit_idx on public.produit_boutique (produit_id);
create index produit_boutique_boutique_idx on public.produit_boutique (boutique_id);

alter table public.produit_boutique enable row level security;

create policy "produit_boutique_select"
  on public.produit_boutique for select
  using (true);

-- Insertion : la vendeureuse du produit OU la créatrice de la boutique.
-- Les deux acceptations (rattacher un produit / accueillir un produit)
-- s'expriment dans la Server Action ; ici on autorise l'un OU l'autre.
create policy "produit_boutique_insert"
  on public.produit_boutique for insert
  with check (
    auth.uid() is not null
    and rattache_par = auth.uid()
    and (
      exists (
        select 1 from public.produit_marche p
        where p.id = produit_id and p.vendeureuse_id = auth.uid()
      )
      or exists (
        select 1 from public.boutique_marche b
        where b.id = boutique_id and b.createurice_id = auth.uid()
      )
    )
  );

-- Suppression du rattachement par l'un·e ou l'autre, ou modé.
create policy "produit_boutique_delete"
  on public.produit_boutique for delete
  using (
    rattache_par = auth.uid()
    or exists (
      select 1 from public.produit_marche p
      where p.id = produit_id and p.vendeureuse_id = auth.uid()
    )
    or exists (
      select 1 from public.boutique_marche b
      where b.id = boutique_id and b.createurice_id = auth.uid()
    )
    or public.est_admin_general()
    or public.est_moderateurice('marche')
  );

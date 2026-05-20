-- Migration 023 : table `produit_marche` (chantier 4.3 — onglet 1).
--
-- Cf. docs/specs/01_ARCHITECTURE.md §6F « Marché solidaire » :
--   « Bon Coin/Vinted-like. Vente OU don gratuit (toggle sur le même
--     formulaire). »
--   Modération a posteriori. Catégories en arborescence (admin).
--   Fraîcheur : 3 mois d'inactivité → modale via messagerie.
--   Monnaies en ligne : T99CP + Euros, double affichage. Frais 5 % EUR,
--   0 % T99CP. Retrait : rencontre physique OU envoi postal (port à la
--   charge de la personne acheteuse).
--
-- Le toggle vente/don est modélisé par la colonne `mode` ('vente' |
-- 'don'). Quand `mode = 'don'`, les prix sont obligatoirement à 0.
-- Quand `mode = 'vente'`, au moins un prix (EUR ou T99CP) doit être
-- strictement positif.

create table public.produit_marche (
  id uuid primary key default gen_random_uuid(),

  -- Identité
  slug text not null unique,
  titre text not null,
  description text not null,

  -- Toggle fondateur : vente ou don. Pose un seul formulaire de
  -- création (cf. spec §6F « toggle sur le même formulaire »).
  mode text not null,

  -- Prix double affichage. Stockés tous deux ; la personne acheteuse
  -- choisit en ligne (cf. spec §6F « la personne acheteuse choisit »).
  -- Centimes pour EUR ; plus petite unité T99CP (équivalent wei) en
  -- string parce que JS Number ne représente pas fidèlement un bigint
  -- > 2^53. Convention : 0 = pas de prix fixé dans cette monnaie.
  prix_euros_centimes integer not null default 0,
  prix_t99cp_unites text not null default '0',

  -- Catégorie technique (arborescence définie en admin — chantier 9.2).
  -- Slug texte libre ici, l'admin remplacera par une FK quand l'arbre
  -- existera. Permet de filtrer côté UI dès maintenant.
  categorie_slug text,

  -- Image principale (galerie multi-image : feature ultérieure).
  image_url text,

  -- Lieu de retrait. Géolocalisation pour la carte unifiée (chantier 6.1).
  lieu text not null,
  latitude double precision,
  longitude double precision,
  -- Retrait : rencontre physique et/ou envoi postal.
  -- Cf. spec §6F « port à la charge de la personne acheteuse ».
  remise_main_propre boolean not null default true,
  envoi_postal boolean not null default false,

  -- Provenance
  vendeureuse_id uuid not null references public.personne(id) on delete cascade,

  -- État opérationnel.
  --   `disponible`  : visible, achetable.
  --   `reserve`     : une personne a manifesté son intérêt (transaction
  --                   en cours). Retiré de la liste publique pour
  --                   éviter les sollicitations.
  --   `vendu`       : transaction finalisée → ouvre la notation.
  --   `retire`      : retiré par la vendeureuse (changement d'avis).
  --   `expire`      : 3 mois sans interaction → fraîcheur (spec §6F).
  statut text not null default 'disponible',

  -- Dernier signal d'activité (vue, message, mise à jour). Utilisé par
  -- le job de fraîcheur (chantier 8.1 / 11.3) qui passe à `expire` les
  -- annonces inactives depuis plus de 3 mois.
  derniere_activite_le timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint produit_marche_mode_valide
    check (mode in ('vente', 'don')),
  constraint produit_marche_statut_valide
    check (statut in ('disponible', 'reserve', 'vendu', 'retire', 'expire')),
  constraint produit_marche_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint produit_marche_prix_eur_positif
    check (prix_euros_centimes >= 0),
  constraint produit_marche_prix_t99cp_format
    check (prix_t99cp_unites ~ '^\d+$'),
  constraint produit_marche_lat_valide
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint produit_marche_lng_valide
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  constraint produit_marche_geo_coherent
    check (
      (latitude is null and longitude is null)
      or (latitude is not null and longitude is not null)
    ),
  -- Au moins un mode de retrait sélectionné.
  constraint produit_marche_retrait_minimal
    check (remise_main_propre = true or envoi_postal = true),
  -- Don : prix obligatoirement à 0 ; vente : au moins un prix > 0.
  constraint produit_marche_prix_coherent
    check (
      (mode = 'don' and prix_euros_centimes = 0 and prix_t99cp_unites = '0')
      or (
        mode = 'vente'
        and (prix_euros_centimes > 0 or prix_t99cp_unites <> '0')
      )
    )
);

comment on table public.produit_marche is
  'Annonce de produit (vente OU don) du marché solidaire. Bon Coin/Vinted-like, modération a posteriori, double affichage T99CP/EUR.';
comment on column public.produit_marche.mode is 'vente | don (toggle dans le même formulaire — cf. spec §6F)';
comment on column public.produit_marche.prix_t99cp_unites is
  'Plus petite unité T99CP, sérialisée en string pour rester bigint-safe. ''0'' = pas de prix en T99CP.';
comment on column public.produit_marche.derniere_activite_le is
  'Réinitialisé à chaque message reçu ou édition. Au-delà de 3 mois → statut expire (cf. spec §6F fraîcheur).';

create index produit_marche_statut_idx on public.produit_marche (statut, created_at desc);
create index produit_marche_mode_idx on public.produit_marche (mode) where statut = 'disponible';
create index produit_marche_categorie_idx on public.produit_marche (categorie_slug)
  where statut = 'disponible';
create index produit_marche_vendeureuse_idx on public.produit_marche (vendeureuse_id);
create index produit_marche_geo_idx on public.produit_marche (latitude, longitude)
  where statut = 'disponible' and latitude is not null;
create index produit_marche_freshness_idx on public.produit_marche (derniere_activite_le)
  where statut = 'disponible';

create trigger produit_marche_updated_at
  before update on public.produit_marche
  for each row
  execute function public.tg_set_updated_at();

alter table public.produit_marche enable row level security;

-- ============================================================
-- Politiques RLS — modération a posteriori (cf. spec §11)
-- ============================================================

-- Lecture : disponible/réservé/vendu/expiré = public ; retiré visible
-- seulement par la vendeureuse + modé/admin.
create policy "produit_marche_select"
  on public.produit_marche for select
  using (
    statut in ('disponible', 'reserve', 'vendu', 'expire')
    or vendeureuse_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('marche')
  );

-- Insertion : auth requise, la vendeureuse doit être l'auteurice.
create policy "produit_marche_insert"
  on public.produit_marche for insert
  with check (
    auth.uid() is not null
    and vendeureuse_id = auth.uid()
  );

-- Mise à jour : la vendeureuse peut éditer son annonce tant qu'elle
-- est disponible ou réservée. Modé/admin pour modération.
create policy "produit_marche_update"
  on public.produit_marche for update
  using (
    (vendeureuse_id = auth.uid() and statut in ('disponible', 'reserve'))
    or public.est_admin_general()
    or public.est_moderateurice('marche')
  );

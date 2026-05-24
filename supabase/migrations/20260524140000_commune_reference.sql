-- Migration 035 : table de référence `commune_reference` (chantier 13.3).
--
-- Contexte (plateforme de données « profil qui s'enrichit ») : on importe
-- le référentiel géographique COMPLET de la France (~35 000 communes +
-- ~45 arrondissements), keyé par `code_insee`, distinct de la table
-- `commune` qui, elle, ne porte QUE les communes libres « actives »
-- (2100-2300 pré-créées, doctrine §7B « pas de coquilles vides »).
--
-- Rôles respectifs :
--   - `commune`            : entité métier vivante (commune libre, animation,
--                            appartenances, Moments…). Reste limitée.
--   - `commune_reference`  : pur référentiel géographique en lecture, sert
--                            à résoudre un `code_insee` → libellé/géoloc et
--                            à calculer les compteurs territoriaux (chantier C)
--                            sans imposer la création d'une commune libre.
--
-- La correspondance code_postal → code_insee (un CP couvre plusieurs
-- communes) fera l'objet d'une table dédiée quand Lilou/Ben fournira le
-- fichier de correspondance officiel (cf. décision chantier 13.3).

create table public.commune_reference (
  -- Code INSEE officiel (5 caractères) : clé naturelle du référentiel.
  code_insee text primary key,

  nom text not null,
  -- 'commune' ou 'arrondissement' (Paris, Lyon, Marseille).
  type text not null default 'commune',

  code_departement text,
  region text,
  population integer,

  latitude double precision,
  longitude double precision,

  created_at timestamptz not null default now(),

  constraint commune_reference_code_insee_format
    check (code_insee ~ '^[0-9AB]{5}$'),
  constraint commune_reference_type_valide
    check (type in ('commune', 'arrondissement'))
);

comment on table public.commune_reference is
  'Référentiel géographique complet (INSEE) en lecture. Distinct de commune (communes libres actives). Sert à la résolution code_insee et aux compteurs territoriaux.';
comment on column public.commune_reference.code_insee is 'Code INSEE officiel, clé naturelle. Format 5 caractères (les codes corses contiennent A/B).';

-- Index de recherche par nom (autocomplétion) et par département.
create index commune_reference_nom_idx on public.commune_reference (nom);
create index commune_reference_departement_idx on public.commune_reference (code_departement);

alter table public.commune_reference enable row level security;

-- Référentiel public en lecture seule : tout le monde peut consulter.
-- Aucune politique d'écriture : seul le service_role (script d'import)
-- écrit, en contournant la RLS par conception.
create policy "commune_reference_select_public"
  on public.commune_reference for select
  using (true);

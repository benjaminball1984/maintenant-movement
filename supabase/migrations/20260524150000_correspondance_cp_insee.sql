-- Migration 036 : table `correspondance_cp_insee` (chantier 13.3).
--
-- Contexte : les signatures (et autres données importées) ne portent que le
-- `code_postal`. Pour les rattacher à une commune (`code_insee`, cf.
-- `commune_reference`), il faut une table de correspondance. Source : base
-- officielle des codes postaux de La Poste (hexasmal, data.gouv.fr).
--
-- IMPORTANT : la relation est MANY-TO-MANY. Un code postal dessert souvent
-- plusieurs communes, et une commune peut avoir plusieurs codes postaux.
-- On conserve donc TOUTES les paires (clé composite). La règle de
-- résolution « 1 signature → 1 commune » (pour ne pas surcompter) est
-- appliquée AU MOMENT DU CALCUL des compteurs, pas ici :
--   règle retenue (documentée) = on attribue la signature à la commune la
--   plus peuplée parmi celles desservies par son code postal
--   (jointure sur `commune_reference.population`, départage déterministe par
--   `code_insee` en cas d'égalité). On ne devine jamais silencieusement :
--   un code postal sans correspondance reste non rattaché.

create table public.correspondance_cp_insee (
  code_postal text not null,
  code_insee text not null,
  nom_commune text,

  created_at timestamptz not null default now(),

  primary key (code_postal, code_insee),

  constraint correspondance_cp_format check (code_postal ~ '^\d{5}$'),
  constraint correspondance_insee_format check (code_insee ~ '^[0-9AB]{5}$')
);

comment on table public.correspondance_cp_insee is
  'Correspondance officielle code_postal ↔ code_insee (base La Poste hexasmal). Many-to-many. Résolution unique (commune la plus peuplée) calculée à la lecture.';

create index correspondance_cp_idx on public.correspondance_cp_insee (code_postal);
create index correspondance_insee_idx on public.correspondance_cp_insee (code_insee);

alter table public.correspondance_cp_insee enable row level security;

-- Référentiel public en lecture seule (comme commune_reference). Écriture
-- réservée au service_role (script d'import) qui contourne la RLS.
create policy "correspondance_cp_insee_select_public"
  on public.correspondance_cp_insee for select
  using (true);

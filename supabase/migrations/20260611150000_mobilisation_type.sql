-- ============================================================
-- Migration : type de mobilisation (pictogrammes UI)
-- Date : 2026-06-11 (revue bêta, demande Lilou/Ben)
-- ============================================================
-- ADDITIVE (doctrine de greffe §0.3) : nouvelle colonne nullable,
-- aucune ligne existante modifiée. Le type alimente le système de
-- pictogrammes (un picto par type d'action) sur les cartes et fiches.
--
-- Taxonomie maison (types d'ACTION, distincte des catégories de luttes
-- des agendas externes) :
--   manifestation      : cortège, marche
--   rassemblement      : statique (place, parvis, piquet de soutien)
--   blocage_greve      : blocage, grève, piquet de grève
--   assemblee_reunion  : AG, réunion publique, plénière
--   projection_debat   : projection, débat, conférence, rencontre
--   concert_fete       : concert, fête militante, festival
--   formation_atelier  : formation, atelier pratique
--   occupation_village : occupation, campement, village militant
--   autre              : tout le reste

alter table public.mobilisation
  add column if not exists type_mobilisation text
  constraint mobilisation_type_valide check (
    type_mobilisation is null
    or type_mobilisation in (
      'manifestation',
      'rassemblement',
      'blocage_greve',
      'assemblee_reunion',
      'projection_debat',
      'concert_fete',
      'formation_atelier',
      'occupation_village',
      'autre'
    )
  );

comment on column public.mobilisation.type_mobilisation is
  'Type d''action affiché en pictogramme (manifestation, rassemblement, blocage_greve, assemblee_reunion, projection_debat, concert_fete, formation_atelier, occupation_village, autre). Nullable : pas de picto si absent.';

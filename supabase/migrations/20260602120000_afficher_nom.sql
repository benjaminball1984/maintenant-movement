-- ============================================================================
-- Revue 2026 (correctif C5) — Masquage SOCIAL du nom du donateur·ice (D11).
-- ============================================================================
--
-- Décision D11 (CDC schema-donnees-V2) : le payeur·euse est TOUJOURS connu·e de
-- la plateforme (jamais d'anonymat total), mais peut choisir de ne pas afficher
-- son nom publiquement. `afficher_nom` porte ce choix d'affichage SOCIAL
-- uniquement, sans toucher à l'identité réelle (conservée pour la conformité).
--
-- Migration ADDITIVE (doctrine de greffe §0.3) : ajout de colonnes seulement,
-- défaut = nom masqué (false). Aucune donnée existante modifiée. Local d'abord ;
-- à pousser au distant en Phase M.
-- ============================================================================

alter table public.don
  add column if not exists afficher_nom boolean not null default false;

alter table public.transaction_entrante
  add column if not exists afficher_nom boolean not null default false;

comment on column public.don.afficher_nom is
  'Masquage SOCIAL (D11) : true = nom affiché publiquement sur la cagnotte. Le payeur·euse reste toujours connu·e de la plateforme. Défaut = masqué.';
comment on column public.transaction_entrante.afficher_nom is
  'Masquage SOCIAL (D11) : true = nom affiché publiquement. Défaut = masqué.';
